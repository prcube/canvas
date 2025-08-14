<template>
    <canvas
      ref="canvas"
      width="800"
      height="600"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseout="stopDrawing"
    />
  </template>
  
  <script>
  export default {
    name: 'SharedCanvas',
    inject: ['socket'],
    data() {
      return {
        canvas: null,
        ctx: null,
        drawing: false,
        lastX: 0,
        lastY: 0
      }
    },
    mounted() {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')
      this.ctx.lineWidth = 2
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.strokeStyle = '#000'
      
      // 소켓 이벤트 리스너 등록
      this.socket.on('draw', this.drawLine)
    },
    beforeUnmount() {
      // 컴포넌트 제거 시 이벤트 리스너 해제
      this.socket.off('draw', this.drawLine)
    },
    methods: {
      startDrawing(e) {
        this.drawing = true
        this.lastX = e.offsetX
        this.lastY = e.offsetY
      },
      
      draw(e) {
        if (!this.drawing) return
        
        const currentX = e.offsetX
        const currentY = e.offsetY
        
        const lineData = {
          fromX: this.lastX,
          fromY: this.lastY,
          toX: currentX,
          toY: currentY
        }
        
        // 내 화면에 그리기
        this.drawLine(lineData)
        
        // 서버로 데이터 전송
        this.socket.emit('draw', lineData)
        
        this.lastX = currentX
        this.lastY = currentY
      },
      
      stopDrawing() {
        this.drawing = false
      },
      
      drawLine(data) {
        this.ctx.beginPath()
        this.ctx.moveTo(data.fromX, data.fromY)
        this.ctx.lineTo(data.toX, data.toY)
        this.ctx.stroke()
      }
    }
  }
  </script>
  
  <style scoped>
  canvas {
    border: 2px solid #333;
    background: white;
    cursor: crosshair;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    border-radius: 8px;
  }
  </style>
  