<template>
  <canvas
    ref="canvas"
    width="800"
    height="600"
    @click="handleClick"
    @mousemove="handleMouseMove"
    :style="{ cursor: cursorStyle }"
  />
</template>

<script>
export default {
  name: 'SharedCanvas',
  inject: ['getSocket'],
  props: ['selectedTool'],

  computed: {
    actualSocket() {
      return this.getSocket()
    },

    cursorStyle() {
      if (this.selectedTool === 'point') return 'crosshair'
      if (this.selectedTool === 'line') return 'copy'
      return 'not-allowed'
    }
  },
  
  data() {
    return {
      canvas: null,
      ctx: null,
      socketListenerAdded: false,
      // 선 그리기를 위한 상태 추가
      lineStartPoint: null,  // 선의 시작점
      isDrawingLine: false,   // 선 그리기 모드 여부
      previewLine: null       // 미리보기 선 정보
    }
  },
  
  mounted() {
    this.initCanvas()
    this.setupSocketListener()
  },
  
  methods: {
    initCanvas() {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')
      this.ctx.lineWidth = 2
      this.ctx.strokeStyle = '#000'
    },

    setupSocketListener() {
      this.$watch('actualSocket', (newSocket) => {
        if (newSocket && !this.socketListenerAdded) {
          console.log('소켓 이벤트 리스너 등록')
          
          newSocket.on('point', this.drawPoint)
          newSocket.on('line', this.drawLine)  // 선 그리기 이벤트 추가
          newSocket.on('canvasState', this.loadCanvasState)
          newSocket.on('clearCanvas', this.handleClearCanvas)
          
          this.socketListenerAdded = true
        }
      }, { immediate: true })
    },

    loadCanvasState(data) {
      console.log('기존 캔버스 상태 로드:', data.length + '개 요소')
      
      if (!data || !Array.isArray(data)) {
        console.log('유효하지 않은 캔버스 데이터')
        return
      }
      
      data.forEach(item => {
        if (item.type === 'point') {
          this.drawPoint(item, false)
        } else if (item.type === 'line') {
          this.drawLine(item, false)
        }
      })
    },

    handleClearCanvas() {
      console.log('캔버스 지우기 신호 받음')
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // 선 그리기 상태도 초기화
      this.resetLineDrawing()
    },

    resetLineDrawing() {
      this.lineStartPoint = null
      this.isDrawingLine = false
      this.previewLine = null
    },
    
    handleClick(e) {
      if (!this.selectedTool) {
        console.log('도구가 선택되지 않음 - 클릭 무시')
        return
      }

      const x = e.offsetX
      const y = e.offsetY
      
      if (this.selectedTool === 'point') {
        this.handlePointClick(x, y)
      } else if (this.selectedTool === 'line') {
        this.handleLineClick(x, y)
      }
    },

    //잔상남는거.
    handleMouseMove(e) {
      // if (this.selectedTool === 'line' && this.isDrawingLine) {
      //   const x = e.offsetX
      //   const y = e.offsetY
      //   this.updatePreviewLine(x, y)
      // }
    },

    handlePointClick(x, y) {
      console.log('점 찍기:', x, y)
      this.drawPoint({ type: 'point', x, y })

      if (this.actualSocket?.connected) {
        console.log('point 데이터 전송:', x, y)
        this.actualSocket.emit('point', { type: 'point', x, y })
      }
    },

    handleLineClick(x, y) {
      if (!this.isDrawingLine) {
        // 첫 번째 클릭: 시작점 설정
        this.lineStartPoint = { x, y }
        this.isDrawingLine = true
        console.log('선 시작점 설정:', x, y)
        
        // 시작점에 작은 점 표시 (선택사항)
        this.drawStartPoint(x, y)
      } else {
        // 두 번째 클릭: 끝점 설정하고 선 그리기
        const lineData = {
          type: 'line',
          startX: this.lineStartPoint.x,
          startY: this.lineStartPoint.y,
          endX: x,
          endY: y
        }
        
        console.log('선 그리기 완료:', lineData)
        this.drawLine(lineData)
        
        if (this.actualSocket?.connected) {
          console.log('line 데이터 전송:', lineData)
          this.actualSocket.emit('line', lineData)
        }
        
        // 선 그리기 상태 초기화
        this.resetLineDrawing()
      }
    },

    updatePreviewLine(x, y) {
      if (this.lineStartPoint) {
        this.previewLine = {
          startX: this.lineStartPoint.x,
          startY: this.lineStartPoint.y,
          endX: x,
          endY: y
        }
        this.drawPreviewLine()
      }
    },

    drawStartPoint(x, y) {
      // 시작점에 작은 초록색 점 표시
      this.ctx.beginPath()
      this.ctx.arc(x, y, 2, 0, 2 * Math.PI)
      this.ctx.fillStyle = '#28a745'
      this.ctx.fill()
    },

    drawPreviewLine() {
      if (this.previewLine) {
        this.ctx.save()
        this.ctx.setLineDash([5, 5]) // 점선으로 미리보기
        this.ctx.strokeStyle = '#999'
        this.ctx.beginPath()
        this.ctx.moveTo(this.previewLine.startX, this.previewLine.startY)
        this.ctx.lineTo(this.previewLine.endX, this.previewLine.endY)
        this.ctx.stroke()
        this.ctx.restore()
      }
    },
    
    drawPoint(data, showLog = true) {
      if (showLog) {
        console.log('다른 사용자의 점 받음:', data)
      }
      this.ctx.beginPath()
      this.ctx.arc(data.x, data.y, 3, 0, 2 * Math.PI)
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fill()
    },

    drawLine(data, showLog = true) {
      if (showLog) {
        console.log('다른 사용자의 선 받음:', data)
      }
      
      this.ctx.save()
      this.ctx.strokeStyle = '#0000ff' // 파란색 선
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([]) // 실선
      this.ctx.beginPath()
      this.ctx.moveTo(data.startX, data.startY)
      this.ctx.lineTo(data.endX, data.endY)
      this.ctx.stroke()
      this.ctx.restore()
    }
  },

  // 도구가 변경될 때 선 그리기 상태 초기화
  watch: {
    selectedTool(newTool) {
      if (newTool !== 'line') {
        this.resetLineDrawing()
      }
    }
  }
}
</script>

<style scoped>
canvas {
  border: 2px solid black;
  background: white;
}
</style>
