import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import rateLimit      from 'express-rate-limit';
import { createServer } from 'http';
import { Server }     from 'socket.io';
import dotenv         from 'dotenv';
import { TABLES, dbPut, dbGet, dbScan, dbDelete, dbUpdate, generateId } from './config/database.js';
import { register, login, getMe, protect } from './middleware/auth.js';

dotenv.config();

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT || 5000;

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:8080', methods: ['GET','POST'] },
});
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ success: true, message: 'CRM API running', timestamp: new Date().toISOString() })
);

// ── Auth ──────────────────────────────────────────────────────
app.post('/api/auth/register', register);
app.post('/api/auth/login',    login);
app.get ('/api/auth/me',       protect, getMe);

// ── Meta Webhook ──────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value) return;

    if (value.messages?.[0]) {
      const metaMsg = value.messages[0];
      const phone   = metaMsg.from;
      const name    = value.contacts?.[0]?.profile?.name || phone;
      const contentMap = {
        text:     () => metaMsg.text?.body || '',
        image:    () => '📷 Image',
        document: () => `📎 ${metaMsg.document?.filename || 'Document'}`,
        audio:    () => '🎤 Voice message',
        video:    () => '🎥 Video',
        location: () => `📍 ${metaMsg.location?.latitude}, ${metaMsg.location?.longitude}`,
        sticker:  () => '🎨 Sticker',
      };
      const content = (contentMap[metaMsg.type] || (() => metaMsg.type))();

      // Upsert contact
      const contacts = await dbScan(TABLES.CONTACTS, c => c.phone === phone);
      let contact = contacts[0];
      if (!contact) {
        contact = { id: generateId(), name, phone, tags: [], is_online: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        await dbPut(TABLES.CONTACTS, contact);
        io.emit('contact_created', contact);
      }

      // Upsert conversation
      const convs = await dbScan(TABLES.CONVERSATIONS, c => c.contact_id === contact.id);
      let conv = convs[0];
      if (!conv) {
        conv = { id: generateId(), contact_id: contact.id, status: 'open', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        await dbPut(TABLES.CONVERSATIONS, conv);
        io.emit('conversation_created', { ...conv, contact });
      }

      const message = {
        id: generateId(), chatId: conv.id, conversation_id: conv.id,
        content, type: metaMsg.type, sender: 'contact', status: 'received',
        meta_message_id: metaMsg.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString(),
      };
      await dbPut(TABLES.MESSAGES, message);
      io.emit('new_message', { ...message, contact, chatId: conv.id });
      console.log(`📨 [${phone}] ${name}: ${content}`);
    }

    if (value.statuses?.[0]) {
      const { id: metaId, status } = value.statuses[0];
      const msgs = await dbScan(TABLES.MESSAGES, m => m.meta_message_id === metaId);
      if (msgs[0]) {
        await dbUpdate(TABLES.MESSAGES, msgs[0].id, { status });
        io.emit('message_status', { messageId: msgs[0].id, status });
      }
    }
  } catch (err) { console.error('Webhook error:', err.message); }
});

// ── Send Message ──────────────────────────────────────────────
app.post('/api/messages/send', protect, async (req, res) => {
  const { chatId, content, type = 'text', templateName, templateParams } = req.body;
  if (!chatId || !content)
    return res.status(400).json({ success: false, message: 'chatId and content are required' });

  const conv    = await dbGet(TABLES.CONVERSATIONS, chatId);
  const contact = conv ? (await dbGet(TABLES.CONTACTS, conv.contact_id)) : null;

  const message = {
    id: generateId(), chatId, conversation_id: chatId, content, type,
    sender: 'agent', status: 'sent',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: new Date().toISOString(),
  };
  await dbPut(TABLES.MESSAGES, message);

  if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID && contact) {
    try {
      const metaBody = type === 'template' && templateName
        ? { messaging_product: 'whatsapp', to: contact.phone, type: 'template', template: { name: templateName, language: { code: 'en_US' }, components: templateParams ? [{ type: 'body', parameters: templateParams.map(p => ({ type: 'text', text: p })) }] : [] } }
        : { messaging_product: 'whatsapp', recipient_type: 'individual', to: contact.phone, type: 'text', text: { preview_url: false, body: content } };

      const metaRes  = await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(metaBody),
      });
      const metaData = await metaRes.json();
      if (metaData.messages?.[0]?.id) {
        message.meta_message_id = metaData.messages[0].id;
        await dbUpdate(TABLES.MESSAGES, message.id, { meta_message_id: metaData.messages[0].id });
        console.log(`📤 Sent to ${contact.phone}: ${content}`);
      }
      if (metaData.error) { console.error('Meta API error:', metaData.error.message); message.status = 'failed'; }
    } catch (err) { console.error('Meta send failed:', err.message); }
  }
  res.json({ success: true, data: message });
});

app.get('/api/messages/:chatId', protect, async (req, res) => {
  const msgs = await dbScan(TABLES.MESSAGES, m => m.chatId === req.params.chatId || m.conversation_id === req.params.chatId);
  msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json({ success: true, data: msgs });
});

// ── Contacts ──────────────────────────────────────────────────
app.get('/api/contacts', protect, async (req, res) => {
  const data = await dbScan(TABLES.CONTACTS);
  res.json({ success: true, data });
});

app.post('/api/contacts', protect, async (req, res) => {
  const { name, phone, tags } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
  const existing = await dbScan(TABLES.CONTACTS, c => c.phone === phone);
  if (existing.length) return res.status(409).json({ success: false, message: 'Phone already exists' });
  const contact = { id: generateId(), name, phone, tags: tags || [], is_online: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await dbPut(TABLES.CONTACTS, contact);
  res.status(201).json({ success: true, data: contact });
});

app.put('/api/contacts/:id', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated });
});

app.delete('/api/contacts/:id', protect, async (req, res) => {
  await dbDelete(TABLES.CONTACTS, req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ── Conversations ─────────────────────────────────────────────
app.get('/api/conversations', protect, async (req, res) => {
  const convs = await dbScan(TABLES.CONVERSATIONS);
  const data  = await Promise.all(convs.map(async c => {
    const contact  = await dbGet(TABLES.CONTACTS, c.contact_id);
    const msgs     = await dbScan(TABLES.MESSAGES, m => m.conversation_id === c.id);
    const sorted   = msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { ...c, contact, lastMessage: sorted.slice(-1)[0]?.content || '', unreadCount: msgs.filter(m => m.sender === 'contact' && m.status !== 'read').length };
  }));
  res.json({ success: true, data });
});

app.patch('/api/conversations/:id/status', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: req.body.status, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  io.emit('conversation_status', { id: req.params.id, status: req.body.status });
  res.json({ success: true, data: updated });
});

app.post('/api/conversations/:id/push-admin', protect, async (req, res) => {
  await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: 'pending', pushed_to_admin: true, updated_at: new Date().toISOString() });
  io.emit('conversation_status', { id: req.params.id, status: 'pending' });
  res.json({ success: true, message: 'Pushed to admin queue' });
});

app.get('/api/conversations/:id/notes', protect, async (req, res) => {
  const notes = await dbScan(TABLES.NOTES, n => n.conversation_id === req.params.id);
  res.json({ success: true, data: notes });
});

app.post('/api/conversations/:id/notes', protect, async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ success: false, message: 'Note required' });
  const n = { id: generateId(), conversation_id: req.params.id, agent_id: req.user.id, note, created_at: new Date().toISOString() };
  await dbPut(TABLES.NOTES, n);
  res.status(201).json({ success: true, data: n });
});

// ── Pipeline ──────────────────────────────────────────────────
app.get('/api/pipeline', protect, async (req, res) => {
  const stages   = await dbScan(TABLES.PIPELINE_STAGES);
  const contacts = await dbScan(TABLES.CONTACTS);
  const sorted   = stages.sort((a, b) => a.position - b.position);
  const data     = sorted.map(s => ({ ...s, contacts: contacts.filter(c => c.stage_id === s.id) }));
  res.json({ success: true, data: { stages: data, totalContacts: contacts.length } });
});

app.patch('/api/pipeline/contacts/:id/stage', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { stage_id: req.body.stage_id, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated });
});

// ── Reminders ─────────────────────────────────────────────────
app.get('/api/reminders', protect, async (req, res) => {
  const all  = await dbScan(TABLES.REMINDERS);
  const data = req.query.status ? all.filter(r => r.status === req.query.status) : all;
  res.json({ success: true, data });
});

app.post('/api/reminders', protect, async (req, res) => {
  const { title, description, due_date, priority, contact_id } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  const r = { id: generateId(), title, description: description || '', due_date: due_date || null, priority: priority || 'medium', status: 'pending', contact_id: contact_id || null, agent_id: req.user.id, created_at: new Date().toISOString() };
  await dbPut(TABLES.REMINDERS, r);
  res.status(201).json({ success: true, data: r });
});

app.put('/api/reminders/:id', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated });
});

app.delete('/api/reminders/:id', protect, async (req, res) => {
  await dbDelete(TABLES.REMINDERS, req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

app.patch('/api/reminders/:id/complete', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, { status: 'completed' });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated });
});

// ── Campaigns ─────────────────────────────────────────────────
app.get('/api/campaigns', protect, async (req, res) => {
  const data = await dbScan(TABLES.CAMPAIGNS);
  res.json({ success: true, data });
});

app.post('/api/campaigns', protect, async (req, res) => {
  const { name, template_name, scheduled_at } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  const c = { id: generateId(), name, template_name: template_name || '', status: 'draft', contact_count: 0, sent_count: 0, scheduled_at: scheduled_at || null, created_by: req.user.id, created_at: new Date().toISOString() };
  await dbPut(TABLES.CAMPAIGNS, c);
  res.status(201).json({ success: true, data: c });
});

app.put('/api/campaigns/:id', protect, async (req, res) => {
  const updated = await dbUpdate(TABLES.CAMPAIGNS, req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated });
});

app.delete('/api/campaigns/:id', protect, async (req, res) => {
  await dbDelete(TABLES.CAMPAIGNS, req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

app.patch('/api/campaigns/:id/send', protect, async (req, res) => {
  const contacts = await dbScan(TABLES.CONTACTS);
  const updated  = await dbUpdate(TABLES.CAMPAIGNS, req.params.id, { status: 'sent', contact_count: contacts.length, sent_count: contacts.length });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: updated, message: `Campaign sent to ${contacts.length} contacts` });
});

// ── Dashboard ─────────────────────────────────────────────────
app.get('/api/dashboard/stats', protect, async (req, res) => {
  const [messages, conversations, campaigns] = await Promise.all([
    dbScan(TABLES.MESSAGES),
    dbScan(TABLES.CONVERSATIONS),
    dbScan(TABLES.CAMPAIGNS),
  ]);
  res.json({
    success: true,
    data: {
      totalMessages:      messages.length,
      activeChats:        conversations.filter(c => c.status === 'open').length,
      campaigns:          campaigns.length,
      responseTime:       '2.3m',
      messagesGrowth:     12.5,
      chatsGrowth:        8.3,
      campaignsGrowth:    25.0,
      responseTimeGrowth: -15.2,
    },
  });
});

// ── Socket.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Agent connected: ${socket.id}`);
  socket.on('join_chat', async (chatId) => {
    socket.join(chatId);
    const msgs = await dbScan(TABLES.MESSAGES, m => (m.chatId === chatId || m.conversation_id === chatId) && m.sender === 'contact' && m.status !== 'read');
    for (const m of msgs) {
      await dbUpdate(TABLES.MESSAGES, m.id, { status: 'read' });
      io.emit('message_status', { messageId: m.id, status: 'read' });
    }
  });
  socket.on('send_message', (data) => socket.to(data.chatId).emit('new_message', data));
  socket.on('typing',       (data) => socket.to(data.chatId).emit('agent_typing', data));
  socket.on('stop_typing',  (data) => socket.to(data.chatId).emit('agent_stop_typing', data));
  socket.on('disconnect',   () => console.log(`🔌 Agent disconnected: ${socket.id}`));
});

app.use((err, req, res, _next) => res.status(500).json({ success: false, message: 'Internal server error' }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

server.listen(PORT, () => {
  console.log(`\n🚀 CRM Backend  →  http://localhost:${PORT}`);
  console.log(`📡 Webhook      →  POST http://localhost:${PORT}/webhook`);
  console.log(`🔐 Auth         →  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🔌 Socket.IO    →  ws://localhost:${PORT}\n`);
});
