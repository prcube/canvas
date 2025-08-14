<template>
  <canvas
    ref="canvas"
    width="800"
    height="600"
    @click="handleClick"
    :style="{ cursor: cursorStyle }"
  />
</template>

<script>
export default {
  name: 'SharedCanvas',
  inject: ['getSocket'],
  props: ['selectedTool'],  // App.vue에서 선택된 도구를 받음

  computed: {
    actualSocket() {
      return this.getSocket()
    },

    cursorStyle() {
      if (this.selectedTool === 'point') return 'crosshair'
      if (this.selectedTool === 'line') return 'copy'
      return 'not-allowed'  // 도구 선택 안됨
    }
  },
  
  data() {
    return {
      canvas: null,
      ctx: null,
      socketListenerAdded: false
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
          newSocket.on('canvasState', this.loadCanvasState)
          newSocket.on('clearCanvas', this.handleClearCanvas)
          
          this.socketListenerAdded = true
        }
      }, { immediate: true })
    },

    loadCanvasState(points) {
      console.log('기존 캔버스 상태 로드:', points.length + '개 점')
      
      if (!points || !Array.isArray(points)) {
        console.log('유효하지 않은 점 데이터')
        return
      }
      
      points.forEach(point => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          this.drawPoint(point, false)
        }
      })
    },

    handleClearCanvas() {
      console.log('캔버스 지우기 신호 받음')
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    
    handleClick(e) {
      // 도구가 선택되지 않았으면 아무것도 하지 않음
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

    handlePointClick(x, y) {
      console.log('점 찍기:', x, y)
      this.drawPoint({ x, y })

      console.log('socket 존재:', !!this.actualSocket)
      console.log('socket.emit 함수:', typeof this.actualSocket?.emit)
      
      if (this.actualSocket?.connected) {
        console.log('point 데이터 전송:', x, y)
        this.actualSocket.emit('point', { x, y })
      }
    },

    handleLineClick(x, y) {
      console.log('선 그리기 준비 중:', x, y)
      // 선그리기 파트
    },
    
    drawPoint(data, showLog = true) {
      if (showLog) {
        console.log('다른 사용자의 점 받음:', data)
      }
      this.ctx.beginPath()
      this.ctx.arc(data.x, data.y, 3, 0, 2 * Math.PI)
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fill()
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
