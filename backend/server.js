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

io.on('connection', (socket) => {
  userCount++;
  console.log(`새 유저 접속: ${socket.id} (총 ${userCount}명)`);
  
  io.emit('userCount', userCount);

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('disconnect', () => {
    userCount--;
    console.log(`유저 연결 해제: ${socket.id} (총 ${userCount}명)`);
    io.emit('userCount', userCount);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('서버 실행 중: http://localhost:3000');
});
