<!-- App.vue -->
<template>
  <div class="app">
    <h1>공유 캔버스</h1>
    <div class="status">
      <span v-if="connected" class="connected">
        서버 연결됨 ({{ userCount }}명 접속 중)
      </span>
      <span v-else class="disconnected">
        서버 연결 안됨
      </span>
    </div>
    <SharedCanvas v-if="socket && connected" />
    <div v-else class="loading">캔버스 로딩 중...</div>
  </div>
</template>

<script>
import SharedCanvas from './components/SharedCanvas.vue'
import { io } from 'socket.io-client'

export default {
  name: 'App',
  components: {
    SharedCanvas
  },
  data() {
    return {
      socket: null,
      connected: false,
      userCount: 0
    }
  },
  mounted() {
    // 소켓 연결 설정 개선
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })
    
    this.socket.on('connect', () => {
      console.log('서버에 연결됨:', this.socket.id)
      this.connected = true
    })
    
    this.socket.on('disconnect', () => {
      console.log('서버 연결 해제')
      this.connected = false
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('연결 실패:', error.message)
      this.connected = false
    })
    
    this.socket.on('userCount', (count) => {
      this.userCount = count
    })
  },
  provide() {
    return {
      socket: this.socket
    }
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f0f0f0;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.status {
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 16px;
}

.connected { color: #28a745; }
.disconnected { color: #dc3545; }

.loading {
  color: #666;
  font-size: 16px;
  margin: 20px;
  padding: 40px;
  border: 2px dashe
}

.info {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}
</style>