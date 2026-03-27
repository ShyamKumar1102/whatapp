const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables from backend folder
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env');
  console.error('📝 Create a .env file with JWT_SECRET (min 32 characters)');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters for security');
}

console.log('✅ Environment variables validated');

// Connect to MongoDB
connectDB();

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const mobileRoutes = require('./routes/mobile');
const gdprRoutes = require('./routes/gdpr');
const templateRoutes = require('./routes/template.routes');

const { authenticateSocket } = require('./middleware/socketAuth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN]
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Trust proxy for rate limiter
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Rate limiting - completely disabled for development
// app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/gdpr', gdprRoutes);

app.use('/api/templates', templateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Status
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name || 'not connected'
    },
    socketio: {
      connected: io.engine.clientsCount || 0
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Debug route to test WhatsApp
app.post('/test-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    console.log('\n🧪 TEST MESSAGE REQUEST!');
    console.log('📞 To:', to);
    console.log('💬 Message:', message);
    
    if (!to || !message) {
      console.log('❌ Missing required fields: to or message');
      return res.status(400).json({ error: 'Missing to or message' });
    }
    
    console.log('🚀 Sending test message via WhatsApp API...');
    const whatsappCloudService = require('./services/whatsappCloudService');
    const result = await whatsappCloudService.sendText(to, message);
    
    console.log('✅ TEST MESSAGE SENT SUCCESSFULLY!');
    console.log('🆔 Message ID:', result.messages[0].id);
    console.log('🟢 Status: Waiting for delivery confirmation...');
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ TEST MESSAGE FAILED!');
    console.error('🔴 Error:', error.message);
    console.error('📊 Details:', error.response?.data);
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

// Direct verification status route
app.get('/api/whatsapp/verification-status', (req, res) => {
  const hasRealTokens = process.env.WHATSAPP_ACCESS_TOKEN && 
                       !process.env.WHATSAPP_ACCESS_TOKEN.includes('your-') &&
                       !process.env.WHATSAPP_ACCESS_TOKEN.includes('PASTE_');
  
  res.json({
    meta_verification_status: 'pending',
    webhook_verified: false,
    whatsapp_number_status: 'pending',
    can_send_messages: false,
    phone_number: 'Not configured',
    business_account_id: 'Not configured',
    last_message_received_at: null,
    blocking_issues: hasRealTokens ? [] : ['Missing real WhatsApp access tokens'],
    non_blocking_issues: ['Configure Meta Developer Console tokens']
  });
});

// Socket.IO authentication and room management
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const { agentId, role } = socket.user;
  
  // Join agent-specific room
  socket.join(`agent:${agentId}`);
  
  // Join admin room if admin
  if (role === 'admin') {
    socket.join('admin');
  }
  
  console.log(`Agent ${agentId} connected`);
  
  socket.on('disconnect', () => {
    console.log(`Agent ${agentId} disconnected`);
  });
});

// Make io available globally
global.io = io;
app.set('io', io);

// Error handling
app.use(errorHandler);

// Start template sync job
try {
  const TemplateSyncJob = require('./jobs/templateSync.job');
  const templateSyncJob = new TemplateSyncJob();
  templateSyncJob.start();
  console.log('✅ Template sync job started');
} catch (error) {
  console.warn('⚠️ Template sync job not available:', error.message);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// Graceful shutdown
const GracefulShutdown = require('./utils/gracefulShutdown');
const gracefulShutdown = new GracefulShutdown(server, io);
gracefulShutdown.register();

module.exports = { app, io };