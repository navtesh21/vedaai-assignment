import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { setupWebSocket } from './websocket/wsManager';
import assignmentRoutes from './routes/assignment';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT || '5000', 10);

async function start() {
  await connectDB();
  await connectRedis();

  // WebSocket setup requires Redis to be initialized
  setupWebSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);

export { server };
