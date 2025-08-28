<template>
  <div class="app">
    <h1>공유 캔버스</h1>
    
    <!-- 접속 거부 메시지 -->
    <div v-if="connectionRejected" class="connection-error">
      <h2>접속이 거부되었습니다</h2>
      <p>현재 최대 인원({{ maxUsers }}명)이 초과되었습니다.</p>
      <p>나중에 다시 시도해주세요.</p>
      <button @click="retryConnection" class="retry-btn">다시 시도</button>
    </div>

    <!-- 정상 접속 시 UI -->
    <div v-else>
      <div class="status">
        <span v-if="connected" class="connected">
          서버 연결됨 ({{ userCount.current }}명/{{ userCount.max }}명 접속 중)
        </span>
        <span v-else class="disconnected">
          서버 연결 안됨
        </span>
      </div>
      
      <!-- 인원 현황 표시 -->
      <div class="user-status" v-if="connected">
        <div class="user-indicator">
          <span class="user-dots">
            <span 
              v-for="n in userCount.max" 
              :key="n"
              :class="['dot', { 'active': n <= userCount.current }]"
            ></span>
          </span>
          <span class="user-text">{{ userCount.current }}/{{ userCount.max }}</span>
        </div>
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
      userCount: { current: 0, max: 4 },
      selectedTool: null,
      connectionRejected: false,
      maxUsers: 4
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
  this.socket = io('https://f1e38130469b.ngrok-free.app', {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
  })
  this.setupSocketListeners()
},

    setupSocketListeners() {
      this.socket.on('connect', this.handleConnect)
      this.socket.on('userCount', this.handleUserCount)
      this.socket.on('disconnect', this.handleDisconnect)
      this.socket.on('connect_error', this.handleConnectError)
      
      // 새로운 이벤트 리스너 추가
      this.socket.on('connectionRejected', this.handleConnectionRejected)
      this.socket.on('connectionAccepted', this.handleConnectionAccepted)
    },

    handleConnect() {
      console.log('서버에 연결 시도:', this.socket.id)
    },

    handleConnectionAccepted(data) {
      console.log('접속 승인:', data)
      this.connected = true
      this.connectionRejected = false
      this.userCount = { current: data.userCount, max: data.maxUsers }
    },

    handleConnectionRejected(data) {
      console.log('접속 거부:', data)
      this.connectionRejected = true
      this.connected = false
      this.maxUsers = data.maxUsers
    },

    handleUserCount(count) {
      console.log('사용자 수 업데이트:', count)
      this.userCount = count
    },

    handleDisconnect() {
      console.log('서버 연결 해제')
      this.connected = false
    },

    handleConnectError(error) {
      console.error('연결 실패:', error.message)
      this.connected = false
    },

    retryConnection() {
      console.log('재연결 시도')
      this.connectionRejected = false
      this.socket?.disconnect()
      setTimeout(() => {
        this.initSocket()
      }, 1000)
    },

    clearCanvas() {
      console.log('앱에서 캔버스 지우기 버튼 클릭')
      if (this.socket?.connected) {
        this.socket.emit('clearCanvas')
        console.log('캔버스 지우기 신호 전송')
      }
    },

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
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 16px;
}

.connected { color: #28a745; }
.disconnected { color: #dc3545; }

.user-status {
  margin-bottom: 15px;
  padding: 8px 15px;
  background: #e9ecef;
  border-radius: 20px;
  display: inline-block;
}

.user-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dee2e6;
  transition: background-color 0.3s;
}

.dot.active {
  background: #28a745;
}

.user-text {
  font-size: 12px;
  font-weight: bold;
  color: #6c757d;
}

.controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.connection-error {
  text-align: center;
  padding: 40px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 10px;
  color: #721c24;
  max-width: 400px;
}

.connection-error h2 {
  margin-top: 0;
  color: #721c24;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
}

.retry-btn:hover {
  background: #c82333;
}

.loading {
  color: #666;
  font-size: 16px;
  margin: 20px;
  padding: 40px;
}
</style>
