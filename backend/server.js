const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

let userCount = 0; //현재 접속자 수
const canvasState = []; //캔버스에 그린 요소들
const activeUsers = new Set(); // 접속자들
const MAX_USERS = 4; // 최대 사용자 

io.on('connection', (socket) => {
  // 4명 제한
  if (activeUsers.size >= MAX_USERS) {
    console.log(`접속 거부: ${socket.id} (최대 ${MAX_USERS}명 초과)`);
    socket.emit('connectionRejected', { 
      reason: 'MAX_USERS_EXCEEDED',
      maxUsers: MAX_USERS,
      currentUsers: activeUsers.size
    });
    socket.disconnect(true);
    return;
  }

  // 사용자 추가
  activeUsers.add(socket.id);
  userCount = activeUsers.size;
  console.log(`새 유저 접속: ${socket.id} (총 ${userCount}명/${MAX_USERS}명)`);
  
  // 사용자 수 알림
  io.emit('userCount', {
    current: userCount,
    max: MAX_USERS
  });

  // 접속 성공 알림
  socket.emit('connectionAccepted', {
    userId: socket.id,
    userCount: userCount,
    maxUsers: MAX_USERS
  });

  // 기존 캔버스 상태 전송
  setTimeout(() => {
    socket.emit('canvasState', canvasState);
    console.log(`기존 캔버스 상태 전송: ${canvasState.length}개`);
  }, 200);

  // 점 그리기
  socket.on('point', (data) => {
    if (activeUsers.has(socket.id)) {
      canvasState.push(data);
      console.log(`점 저장됨: (${data.x}, ${data.y}) - 총 ${canvasState.length}개`);
      socket.broadcast.emit('point', data);
    }
  });

  // 선 그리기
  socket.on('line', (data) => {
    if (activeUsers.has(socket.id)) {
      canvasState.push(data);
      console.log(`선 저장됨: (${data.startX}, ${data.startY}) > (${data.endX}, ${data.endY}) - 총 ${canvasState.length}개`);
      socket.broadcast.emit('line', data);
    }
  });

  socket.on('clearCanvas', () => {
    if (activeUsers.has(socket.id)) {
      canvasState.length = 0;
      console.log('캔버스가 초기화되었습니다');
      io.emit('clearCanvas');
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id); // 사용자제거
    userCount = activeUsers.size;
    console.log(`유저 연결 해제: ${socket.id} (총 ${userCount}명/${MAX_USERS}명)`);
    
    // 변경된 사용자수
    io.emit('userCount', {
      current: userCount,
      max: MAX_USERS
    });
  });
});

//백 서버 세팅
server.listen(3000, '0.0.0.0', () => {
  console.log('서버 실행 중: http://0.0.0.0:3000');
  console.log(`최대 동시 접속자: ${MAX_USERS}명`);
});

