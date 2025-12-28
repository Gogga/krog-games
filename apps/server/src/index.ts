// KROG Games Platform - Unified backend server
// Will be populated from server/src/ during Phase 3

import express, { Application } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app: Application = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api/games', (req, res) => {
  res.json({
    games: [
      { id: 'chess', name: 'KROG Chess', available: true },
      { id: 'shogi', name: 'KROG Shogi', available: false },
      { id: 'go', name: 'KROG Go', available: false }
    ]
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Game handlers will be registered here
  // Chess handlers from @krog/chess-server
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`KROG Games server running on port ${PORT}`);
});

export { app, io, httpServer };
