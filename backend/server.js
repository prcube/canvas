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
const canvasState = []; // 점과 선 데이터를 모두 저장

io.on('connection', (socket) => {
  userCount++;
  console.log(`새 유저 접속: ${socket.id} (총 ${userCount}명)`);
  
  io.emit('userCount', userCount);

  // 2초 안주니까 기존 정보를 못 불러옴.
  setTimeout(() => {
    // console.log('전송할 canvasState:', canvasState)
    // console.log('canvasState 타입:', typeof canvasState)
    // console.log('canvasState 배열 여부:', Array.isArray(canvasState))
    
    socket.emit('canvasState', canvasState);
    // console.log(`기존 캔버스 상태 전송: ${canvasState.length}개`);
  }, 200);

  // 점 데이터 처리
  socket.on('point', (data) => {
    canvasState.push(data);
    console.log(`점 저장됨: (${data.x}, ${data.y}) - 총 ${canvasState.length}개`);
    socket.broadcast.emit('point', data);
  });

  // 선 데이터 처리 추가
  socket.on('line', (data) => {
    canvasState.push(data);
    console.log(`선 저장됨: (${data.startX}, ${data.startY}) > (${data.endX}, ${data.endY}) - 총 ${canvasState.length}개`);
    socket.broadcast.emit('line', data);
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
