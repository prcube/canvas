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
    <div class="controls">
      <button @click="clearCanvas" class="clear-btn">지우기</button>
      <button @click="selectTool('point')" :class="{ active: selectedTool === 'point' }" class="tool-btn">점</button>
      <button @click="selectTool('line')" :class="{ active: selectedTool === 'line' }" class="tool-btn">선</button>
    </div>
    <div class="tool-info">
      <span v-if="selectedTool === null">도구를 선택하세요</span>
      <span v-else-if="selectedTool === 'point'">점 찍기 모드</span>
      <span v-else-if="selectedTool === 'line'">선 그리기 모드</span>
    </div>
    <SharedCanvas v-if="connected" :selectedTool="selectedTool" />
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
      userCount: 0,
      selectedTool: null  // 초기에는 아무 도구도 선택 안됨
    }
  },

  provide() {
    return {
      getSocket: () => this.socket
    }
  },

  mounted() {    
    this.initSocket()
  },

  methods: {
    initSocket() {
      this.socket = io('http://localhost:3000')
      this.setupSocketListeners()
    },

    setupSocketListeners() {
      this.socket.on('connect', this.handleConnect)
      this.socket.on('userCount', this.handleUserCount)
      this.socket.on('disconnect', this.handleDisconnect)
      this.socket.on('connect_error', this.handleConnectError)
    },

    handleConnect() {
      console.log('서버에 연결됨:', this.socket.id)
      this.connected = true
    },

    handleUserCount(count) {
      console.log('사람 수 카운트:', this.socket.id)
      this.userCount = count
      console.log(count)
    },

    handleDisconnect() {
      console.log('서버 연결 해제')
      this.connected = false
    },

    handleConnectError(error) {
      console.error('연결 실패:', error.message)
      this.connected = false
    },

    clearCanvas() {
      console.log('앱에서 캔버스 지우기 버튼 클릭')
      if (this.socket?.connected) {
        this.socket.emit('clearCanvas')
        console.log('캔버스 지우기 신호 전송')
      }
    },

    // 도구 선택 기능 추가
    selectTool(tool) {
      this.selectedTool = tool
      console.log(`도구 선택됨: ${tool}`)
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

.controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}


.loading {
  color: #666;
  font-size: 16px;
  margin: 20px;
  padding: 40px;
}
</style>
