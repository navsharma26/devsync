import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import initSocket from './socket/index.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (process.env.CLIENT_URL === '*') return true;
  return false;
};

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.io real-time engine
initSocket(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    app: 'DevSync API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connectedSockets: io.engine.clientsCount,
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port) => {
  const listener = httpServer.listen(port);

  listener.once('listening', () => {
    console.log(`=========================================`);
    console.log(`🚀 DevSync Server running on port ${port}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🌐 CORS configured for: ${allowedOrigins.join(', ')}`);
    console.log(`=========================================`);
  });

  listener.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n⚠️  [DevSync Server] Port ${port} is currently in use.`);
      console.warn(`   (Note: On macOS, Port 5000 is reserved by AirPlay Receiver by default.`);
      console.warn(`    To free port 5000: System Settings > General > AirDrop & AirPlay > Toggle AirPlay Receiver OFF.)\n`);
      const nextPort = port === 5000 ? 5002 : port + 1;
      console.log(`⚡ [DevSync Server] Retrying on available port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('❌ [DevSync Server] Server error:', err);
    }
  });
};

startServer(DEFAULT_PORT);
