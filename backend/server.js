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

let userCount = 0;
const canvasState = [];

io.on('connection', (socket) => {
  userCount++;
  console.log(`새 유저 접속: ${socket.id} (총 ${userCount}명)`);
  
  io.emit('userCount', userCount);

  // 2초 지연주니까 새로고침 했을 때 이전 점들 불러오기 가능.
  setTimeout(() => {
    socket.emit('canvasState', canvasState);
  }, 200);
  
  console.log(`기존 캔버스 상태 전송: ${canvasState.length}개 점`);

  socket.on('point', (data) => {
    canvasState.push(data);
    console.log(`점 저장됨: (${data.x}, ${data.y}) - 총 ${canvasState.length}개`);
    socket.broadcast.emit('point', data);
  });

  socket.on('clearCanvas', () => {
    canvasState.length = 0;
    console.log('캔버스가 초기화되었습니다');
    io.emit('clearCanvas');
  });

  socket.on('disconnect', () => {
    userCount--;
    console.log(`유저 연결 해제: ${socket.id} (총 ${userCount}명)`);
    io.emit('userCount', userCount);
  });
});

server.listen(3000, () => {
  console.log('서버 실행 중: http://localhost:3000');
});
