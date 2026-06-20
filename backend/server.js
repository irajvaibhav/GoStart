// server.js
// entry point - sets up express, connects DB, mounts routes, starts socket.io

const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// uploads/ is gitignored on purpose (we don't want user photos in git), but
// that means it doesn't exist at all on a fresh deploy - multer tries to
// write into it and crashes with a 500 if the folder isn't there. create it
// once on startup if missing.
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
// socket.io needs the raw node http server (not the express app) to attach
// its websocket upgrade handling - this is why we wrap app in http.createServer
// instead of just calling app.listen() like a plain express app would
const server = http.createServer(app);

// socket.io with cors so frontend can connect from any origin
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/match', require('./routes/match'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/credits', require('./routes/credits'));

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Gostart Backend' });
});

// ---- Socket.IO for real-time chat ----
// simple setup: user joins their match room, messages broadcast to that room

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // user joins a match room so they only get messages for that conversation
  socket.on('joinMatch', (matchId) => {
    socket.join(matchId);
    console.log(`socket ${socket.id} joined room ${matchId}`);
  });

  // when a message is sent, broadcast to everyone in the match room.
  // this does NOT save to the database - ChatScreen.js calls the REST
  // endpoint (POST /api/chat/messages/:matchId) separately for that. this
  // socket event is purely "push it to whoever else is in this room right now".
  socket.on('sendMessage', (data) => {
    // data = { matchId, sender, text, createdAt }
    // io.to() sends to EVERYONE in the room, including whoever just sent it -
    // ChatScreen.js filters out its own message client-side since it already
    // showed it optimistically
    io.to(data.matchId).emit('newMessage', data);
  });

  // typing indicator
  socket.on('typing', (data) => {
    // data = { matchId, userId }
    // socket.to() (vs io.to() above) excludes the sender automatically -
    // you don't need to see your own "typing..." indicator
    socket.to(data.matchId).emit('userTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// connect to DB then start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Gostart backend running on port ${PORT}`);
  });
});
