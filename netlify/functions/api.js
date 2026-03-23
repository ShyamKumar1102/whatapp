const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

let cachedDb = null;

const agentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  passwordHash: String,
  businessName: String,
  role: { type: String, default: 'agent' },
  method: { type: String, default: 'email' },
  createdAt: { type: Date, default: Date.now }
});

const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 1) return cachedDb;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });
  return cachedDb;
}

function sanitizeString(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\$\.]/g, '').trim();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const { password } = req.body;

    if (!email || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const agent = await Agent.findOne({ email: { $eq: email } });
    if (!agent) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const isValid = await bcrypt.compare(password, agent.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { agentId: agent._id, email: agent.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      accessToken: token,
      refreshToken: token,
      agent: {
        agentId: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const email = sanitizeString(req.body.email);
    const { password } = req.body;
    const businessName = sanitizeString(req.body.businessName || req.body.name);

    if (!name || !email || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email and password required' });
    }

    const exists = await Agent.findOne({ email: { $eq: email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ name, email, passwordHash, businessName });

    const token = jwt.sign(
      { agentId: agent._id, email: agent.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      agent: { agentId: agent._id, name: agent.name, email: agent.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.user.agentId);
    if (!agent) return res.status(404).json({ error: 'User not found' });
    res.json({
      agent: {
        agentId: agent._id,
        email: agent.email,
        name: agent.name,
        role: agent.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/conversations', authMiddleware, async (req, res) => {
  res.json({ conversations: [], total: 0 });
});

app.get('/api/analytics/overview', authMiddleware, (req, res) => {
  res.json({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    responseRate: 0
  });
});

app.get('/api/whatsapp/verification-status', authMiddleware, (req, res) => {
  res.json({
    meta_verification_status: 'pending',
    webhook_verified: false,
    whatsapp_number_status: 'pending',
    can_send_messages: false,
    phone_number: 'Not configured',
    business_account_id: 'Not configured',
    last_message_received_at: null,
    blocking_issues: [],
    non_blocking_issues: ['Configure WhatsApp Business API']
  });
});

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database connection failed' })
    };
  }
  
  return serverless(app)(event, context);
};
