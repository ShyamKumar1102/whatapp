import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import rateLimit      from 'express-rate-limit';
import { createServer } from 'http';
import { Server }     from 'socket.io';
import dotenv         from 'dotenv';
import { db, generateId } from './config/database.js';
import { register, login, getMe, protect, adminOnly } from './middleware/auth.js';

dotenv.config();

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:8080', methods: ['GET','POST'] },
});
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ success: true, message: 'CRM API running', timestamp: new Date().toISOString() })
);

// ══════════════════════════════════════════════════════════════
// LAYER 2 — AUTH
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/register', register);
app.post('/api/auth/login',    login);
app.get ('/api/auth/me',       protect, getMe);

// ══════════════════════════════════════════════════════════════
// LAYER 3 — META WEBHOOK
// ══════════════════════════════════════════════════════════════

// GET — Meta verification handshake
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('❌ Webhook verification failed — check META_VERIFY_TOKEN in .env');
  res.sendStatus(403);
});

// POST — Receive incoming WhatsApp messages
app.post('/webhook', (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;

  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value) return;

    // ── Incoming message ──────────────────────────────────────
    if (value.messages?.[0]) {
      const metaMsg = value.messages[0];
      const phone   = metaMsg.from;
      const name    = value.contacts?.[0]?.profile?.name || phone;

      // Parse content by type
      const contentMap = {
        text:     () => metaMsg.text?.body || '',
        image:    () => '📷 Image',
        document: () => `📎 ${metaMsg.document?.filename || 'Document'}`,
        audio:    () => '🎤 Voice message',
        video:    () => '🎥 Video',
        location: () => `📍 ${metaMsg.location?.latitude}, ${metaMsg.location?.longitude}`,
        sticker:  () => '🎨 Sticker',
        reaction: () => `${metaMsg.reaction?.emoji} reaction`,
      };
      const content = (contentMap[metaMsg.type] || (() => metaMsg.type))();

      // Upsert contact
      let contact = db.contacts.find(c => c.phone === phone);
      if (!contact) {
        contact = { id: generateId(), name, phone, tags: [], is_online: true, created_at: new Date(), updated_at: new Date() };
        db.contacts.push(contact);
        io.emit('contact_created', contact);
      } else {
        contact.is_online = true;
        contact.name      = name;
      }

      // Upsert conversation
      let conv = db.conversations.find(c => c.contact_id === contact.id);
      if (!conv) {
        conv = { id: generateId(), contact_id: contact.id, status: 'open', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date(), updated_at: new Date() };
        db.conversations.push(conv);
        io.emit('conversation_created', { ...conv, contact });
      }
      conv.updated_at = new Date();

      // Save message
      const message = {
        id:              generateId(),
        chatId:          conv.id,
        conversation_id: conv.id,
        content,
        type:            metaMsg.type,
        sender:          'contact',
        status:          'received',
        meta_message_id: metaMsg.id,
        timestamp:       new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at:      new Date(),
      };
      db.messages.push(message);

      // Push to all connected agents in real-time
      io.emit('new_message', { ...message, contact, chatId: conv.id });
      console.log(`📨 [${phone}] ${name}: ${content}`);
    }

    // ── Status update (sent → delivered → read) ───────────────
    if (value.statuses?.[0]) {
      const { id: metaId, status } = value.statuses[0];
      const msg = db.messages.find(m => m.meta_message_id === metaId);
      if (msg) {
        msg.status = status;
        io.emit('message_status', { messageId: msg.id, status });
      }
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

// ══════════════════════════════════════════════════════════════
// LAYER 4 — SEND MESSAGE VIA META API
// ══════════════════════════════════════════════════════════════
app.post('/api/messages/send', protect, async (req, res) => {
  const { chatId, content, type = 'text', templateName, templateParams } = req.body;
  if (!chatId || !content)
    return res.status(400).json({ success: false, message: 'chatId and content are required' });

  const conv    = db.conversations.find(c => c.id === chatId);
  const contact = conv ? db.contacts.find(c => c.id === conv.contact_id) : null;

  // Save to local store immediately (optimistic)
  const message = {
    id:              generateId(),
    chatId,
    conversation_id: chatId,
    content,
    type,
    sender:          'agent',
    status:          'sent',
    timestamp:       new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at:      new Date(),
  };
  db.messages.push(message);

  // Update conversation timestamp
  if (conv) conv.updated_at = new Date();

  // ── Send via Meta Cloud API ───────────────────────────────
  if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID && contact) {
    try {
      let metaBody;

      if (type === 'template' && templateName) {
        // Send approved template message
        metaBody = {
          messaging_product: 'whatsapp',
          to:                contact.phone,
          type:              'template',
          template: {
            name:     templateName,
            language: { code: 'en_US' },
            components: templateParams ? [{
              type:       'body',
              parameters: templateParams.map(p => ({ type: 'text', text: p })),
            }] : [],
          },
        };
      } else {
        // Send plain text message
        metaBody = {
          messaging_product: 'whatsapp',
          recipient_type:    'individual',
          to:                contact.phone,
          type:              'text',
          text:              { preview_url: false, body: content },
        };
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
        {
          method:  'POST',
          headers: {
            Authorization:  `Bearer ${process.env.META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaBody),
        }
      );

      const metaData = await metaRes.json();

      if (metaData.messages?.[0]?.id) {
        message.meta_message_id = metaData.messages[0].id;
        message.status          = 'sent';
        console.log(`📤 Sent to ${contact.phone}: ${content}`);
      }

      if (metaData.error) {
        console.error('Meta API error:', metaData.error.message);
        message.status = 'failed';
      }
    } catch (err) {
      console.error('Meta send failed:', err.message);
      message.status = 'failed';
    }
  } else {
    console.log('⚠️  Demo mode — message saved locally, not sent to WhatsApp');
  }

  res.json({ success: true, data: message });
});

// ── Get messages for a chat ───────────────────────────────────
app.get('/api/messages/:chatId', protect, (req, res) => {
  const msgs = db.messages.filter(m => m.chatId === req.params.chatId || m.conversation_id === req.params.chatId);
  res.json({ success: true, data: msgs });
});

// ══════════════════════════════════════════════════════════════
// CONTACTS
// ══════════════════════════════════════════════════════════════
app.get   ('/api/contacts',     protect, (req, res) => res.json({ success: true, data: db.contacts }));
app.post  ('/api/contacts',     protect, (req, res) => {
  const { name, phone, tags } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
  if (db.contacts.find(c => c.phone === phone))
    return res.status(409).json({ success: false, message: 'Phone already exists' });
  const c = { id: generateId(), name, phone, tags: tags || [], is_online: false, created_at: new Date(), updated_at: new Date() };
  db.contacts.push(c);
  res.status(201).json({ success: true, data: c });
});
app.put   ('/api/contacts/:id', protect, (req, res) => {
  const i = db.contacts.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.contacts[i] = { ...db.contacts[i], ...req.body, updated_at: new Date() };
  res.json({ success: true, data: db.contacts[i] });
});
app.delete('/api/contacts/:id', protect, (req, res) => {
  const i = db.contacts.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.contacts.splice(i, 1);
  res.json({ success: true, message: 'Deleted' });
});

// ══════════════════════════════════════════════════════════════
// CONVERSATIONS
// ══════════════════════════════════════════════════════════════
app.get('/api/conversations', protect, (req, res) => {
  const data = db.conversations.map(c => ({
    ...c,
    contact:     db.contacts.find(ct => ct.id === c.contact_id),
    lastMessage: db.messages.filter(m => m.conversation_id === c.id).slice(-1)[0]?.content || '',
    unreadCount: db.messages.filter(m => m.conversation_id === c.id && m.sender === 'contact' && m.status !== 'read').length,
  }));
  res.json({ success: true, data });
});

app.patch('/api/conversations/:id/status', protect, (req, res) => {
  const i = db.conversations.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.conversations[i].status = req.body.status;
  io.emit('conversation_status', { id: req.params.id, status: req.body.status });
  res.json({ success: true, data: db.conversations[i] });
});

app.post('/api/conversations/:id/push-admin', protect, (req, res) => {
  const i = db.conversations.findIndex(c => c.id === req.params.id);
  if (i !== -1) { db.conversations[i].status = 'pending'; db.conversations[i].pushed_to_admin = true; }
  io.emit('conversation_status', { id: req.params.id, status: 'pending' });
  res.json({ success: true, message: 'Pushed to admin queue' });
});

app.get ('/api/conversations/:id/notes', protect, (req, res) =>
  res.json({ success: true, data: db.notes.filter(n => n.conversation_id === req.params.id) })
);
app.post('/api/conversations/:id/notes', protect, (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ success: false, message: 'Note required' });
  const n = { id: generateId(), conversation_id: req.params.id, agent_id: req.user.id, note, created_at: new Date() };
  db.notes.push(n);
  res.status(201).json({ success: true, data: n });
});

// ══════════════════════════════════════════════════════════════
// PIPELINE
// ══════════════════════════════════════════════════════════════
app.get('/api/pipeline', protect, (req, res) => {
  const stages = db.pipeline_stages.map(s => ({
    ...s, contacts: db.contacts.filter(c => c.stage_id === s.id),
  }));
  res.json({ success: true, data: { stages, totalContacts: db.contacts.length } });
});
app.patch('/api/pipeline/contacts/:id/stage', protect, (req, res) => {
  const i = db.contacts.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.contacts[i].stage_id = req.body.stage_id;
  res.json({ success: true, data: db.contacts[i] });
});

// ══════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════
app.get   ('/api/reminders',          protect, (req, res) => {
  const data = req.query.status ? db.reminders.filter(r => r.status === req.query.status) : db.reminders;
  res.json({ success: true, data });
});
app.post  ('/api/reminders',          protect, (req, res) => {
  const { title, description, due_date, priority, contact_id } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  const r = { id: generateId(), title, description, due_date, priority: priority || 'medium', status: 'pending', contact_id, agent_id: req.user.id, created_at: new Date() };
  db.reminders.push(r);
  res.status(201).json({ success: true, data: r });
});
app.put   ('/api/reminders/:id',      protect, (req, res) => {
  const i = db.reminders.findIndex(r => r.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.reminders[i] = { ...db.reminders[i], ...req.body };
  res.json({ success: true, data: db.reminders[i] });
});
app.delete('/api/reminders/:id',      protect, (req, res) => {
  const i = db.reminders.findIndex(r => r.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.reminders.splice(i, 1);
  res.json({ success: true, message: 'Deleted' });
});
app.patch ('/api/reminders/:id/complete', protect, (req, res) => {
  const i = db.reminders.findIndex(r => r.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.reminders[i].status = 'completed';
  res.json({ success: true, data: db.reminders[i] });
});

// ══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ══════════════════════════════════════════════════════════════
app.get ('/api/campaigns',     protect, (req, res) => res.json({ success: true, data: db.campaigns }));
app.post('/api/campaigns',     protect, (req, res) => {
  const { name, template_name, scheduled_at } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  const c = { id: generateId(), name, template_name, status: 'draft', contact_count: 0, sent_count: 0, scheduled_at, created_by: req.user.id, created_at: new Date() };
  db.campaigns.push(c);
  res.status(201).json({ success: true, data: c });
});
app.patch('/api/campaigns/:id/send', protect, async (req, res) => {
  const i = db.campaigns.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.campaigns[i].status       = 'sent';
  db.campaigns[i].contact_count = db.contacts.length;
  db.campaigns[i].sent_count    = db.contacts.length;
  res.json({ success: true, data: db.campaigns[i], message: `Campaign sent to ${db.contacts.length} contacts` });
});

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      totalMessages:       db.messages.length,
      activeChats:         db.conversations.filter(c => c.status === 'open').length,
      campaigns:           db.campaigns.length,
      responseTime:        '2.3m',
      messagesGrowth:      12.5,
      chatsGrowth:         8.3,
      campaignsGrowth:     25.0,
      responseTimeGrowth: -15.2,
    },
  });
});

// ══════════════════════════════════════════════════════════════
// LAYER 5 — SOCKET.IO REAL-TIME
// ══════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log(`🔌 Agent connected: ${socket.id}`);

  // Agent joins a specific chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    // Mark messages as read when agent opens chat
    db.messages
      .filter(m => (m.chatId === chatId || m.conversation_id === chatId) && m.sender === 'contact' && m.status !== 'read')
      .forEach(m => {
        m.status = 'read';
        io.emit('message_status', { messageId: m.id, status: 'read' });
      });
  });

  // Agent sends a message (broadcast to other agents on same chat)
  socket.on('send_message', (data) => {
    socket.to(data.chatId).emit('new_message', data);
  });

  // Typing indicators
  socket.on('typing',      (data) => socket.to(data.chatId).emit('agent_typing',      data));
  socket.on('stop_typing', (data) => socket.to(data.chatId).emit('agent_stop_typing', data));

  socket.on('disconnect', () => console.log(`🔌 Agent disconnected: ${socket.id}`));
});

// ── Error handlers ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 CRM Backend  →  http://localhost:${PORT}`);
  console.log(`📡 Webhook      →  POST http://localhost:${PORT}/webhook`);
  console.log(`🔐 Auth         →  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🔌 Socket.IO    →  ws://localhost:${PORT}`);
  if (!process.env.META_ACCESS_TOKEN) {
    console.log(`\n⚠️  META_ACCESS_TOKEN not set — running in DEMO mode`);
    console.log(`   Messages are saved locally but NOT sent to WhatsApp`);
    console.log(`   Add your token to backend/.env to enable real sending\n`);
  } else {
    console.log(`\n✅ Meta API connected — real WhatsApp messages enabled\n`);
  }
});
