<template>
  <canvas
    ref="canvas"
    width="800"
    height="600"
    @click="handleClick"
  />
</template>

<script>
export default {
  name: 'SharedCanvas',
  inject: ['getSocket'],

  computed: {
    actualSocket() {
      return this.getSocket()
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
          newSocket.on('point', this.drawPoint)
          newSocket.on('canvasState', this.loadCanvasState)
          newSocket.on('clearCanvas', this.handleClearCanvas)
          this.socketListenerAdded = true
        }
      }, { immediate: true })
    },

    loadCanvasState(points) {
      console.log('기존 캔버스 상태 로드:', points.length + '개 점')
      points.forEach(point => {
        this.drawPoint(point, false) // 로그 출력 안함
      })
    },

    handleClearCanvas() {
      console.log('캔버스 지우기 신호 받음')
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    
    handleClick(e) {
      const x = e.offsetX
      const y = e.offsetY
      
      console.log('점 찍기:', x, y)
      this.drawPoint({ x, y })

      console.log('socket 존재:', !!this.actualSocket)
      console.log('socket.emit 함수:', typeof this.actualSocket?.emit)
      
      if (this.actualSocket?.connected) {
        console.log('point 데이터 전송:', x, y)
        this.actualSocket.emit('point', { x, y })
      }
    },
    
    // showLog 파라미터 추가로 로그 제어
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
  cursor: crosshair;
}
</style>
