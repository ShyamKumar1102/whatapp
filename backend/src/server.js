import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import rateLimit      from 'express-rate-limit';
import { createServer } from 'http';
import { Server }     from 'socket.io';
import dotenv         from 'dotenv';
import multer         from 'multer';
import path           from 'path';
import fs             from 'fs';
import { fileURLToPath } from 'url';
import { TABLES, dbPut, dbGet, dbScan, dbDelete, dbUpdate, generateId, getConversationByPhone, getMessagesByConversation, updateConversationLastMessage } from './config/database.js';
import { register, login, getMe, protect } from './middleware/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

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
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Campaign image upload ─────────────────────────────────────
app.post('/api/campaigns/upload-image', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// ── Templates ───────────────────────────────────────────────
app.get('/api/templates', protect, async (req, res) => {
  try {
    // Try Meta API first if credentials set
    if (process.env.META_ACCESS_TOKEN && process.env.META_WABA_ID) {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.META_WABA_ID}/message_templates?fields=name,status,category,language,components&limit=50`, {
        headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
      });
      const metaData = await metaRes.json();
      if (metaData.data) {
        const templates = metaData.data.map(t => ({
          id: t.id, name: t.name, category: t.category,
          language: t.language, status: t.status?.toLowerCase(),
          body: t.components?.find(c => c.type === 'BODY')?.text || '',
          created_at: new Date().toISOString(),
        }));
        return res.json({ success: true, data: templates });
      }
    }
    // Fallback to DynamoDB stored templates
    const data = await dbScan('crm_templates').catch(() => []);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/templates', protect, async (req, res) => {
  try {
    const { name, category, language, body } = req.body;
    if (!name || !body) return res.status(400).json({ success: false, message: 'Name and body required' });
    const t = { id: generateId(), name, category: category || 'Marketing', language: language || 'English', body, status: 'pending', created_at: new Date().toISOString() };
    await dbPut('crm_templates', t);
    res.status(201).json({ success: true, data: t });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/templates/:id', protect, async (req, res) => {
  try {
    await dbDelete('crm_templates', req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/templates/submit-meta', protect, async (req, res) => {
  try {
    const { name, category, language, body } = req.body;
    if (!name || !body) return res.status(400).json({ success: false, message: 'Name and body required' });
    if (!process.env.META_ACCESS_TOKEN || !process.env.META_WABA_ID)
      return res.status(400).json({ success: false, message: 'META_ACCESS_TOKEN and META_WABA_ID not set. Add them in Settings.' });
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.META_WABA_ID}/message_templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, category, language,
        components: [{ type: 'BODY', text: body }],
      }),
    });
    const metaData = await metaRes.json();
    if (metaData.error) return res.status(400).json({ success: false, message: metaData.error.message });
    // Save to DynamoDB too
    const t = { id: metaData.id || generateId(), name, category, language, body, status: 'pending', meta_id: metaData.id, created_at: new Date().toISOString() };
    await dbPut('crm_templates', t);
    res.json({ success: true, data: t, metaId: metaData.id, status: 'pending' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
// ── Settings ─────────────────────────────────────────────────
app.post('/api/settings', protect, async (req, res) => {
  try {
    const { META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_VERIFY_TOKEN } = req.body;
    // Apply to current session
    if (META_ACCESS_TOKEN)    process.env.META_ACCESS_TOKEN    = META_ACCESS_TOKEN;
    if (META_PHONE_NUMBER_ID) process.env.META_PHONE_NUMBER_ID = META_PHONE_NUMBER_ID;
    if (META_VERIFY_TOKEN)    process.env.META_VERIFY_TOKEN    = META_VERIFY_TOKEN;
    // Persist to .env file
    const envPath = new URL('../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf8'); } catch { /* file may not exist */ }
    const setEnvVar = (content, key, value) => {
      if (!value) return content;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      return regex.test(content) ? content.replace(regex, `${key}=${value}`) : content + `\n${key}=${value}`;
    };
    if (META_ACCESS_TOKEN)    envContent = setEnvVar(envContent, 'META_ACCESS_TOKEN',    META_ACCESS_TOKEN);
    if (META_PHONE_NUMBER_ID) envContent = setEnvVar(envContent, 'META_PHONE_NUMBER_ID', META_PHONE_NUMBER_ID);
    if (META_VERIFY_TOKEN)    envContent = setEnvVar(envContent, 'META_VERIFY_TOKEN',    META_VERIFY_TOKEN);
    fs.writeFileSync(envPath, envContent, 'utf8');
    res.json({ success: true, message: 'Settings saved permanently' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

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
      } else {
        contact.is_online = true;
        contact.name = name;
        await dbUpdate(TABLES.CONTACTS, contact.id, { is_online: true, name, updated_at: new Date().toISOString() });
      }

      // Upsert conversation — one per customer phone number
      let conv = await getConversationByPhone(phone);
      if (!conv) {
        conv = {
          id:              generateId(),
          contact_id:      contact.id,
          contact_phone:   phone,
          status:          'open',
          channel:         'whatsapp',
          pushed_to_admin: false,
          unread_count:    1,
          last_message:    content,
          last_message_at: new Date().toISOString(),
          created_at:      new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        };
        await dbPut(TABLES.CONVERSATIONS, conv);
        io.emit('conversation_created', { ...conv, contact });
      } else {
        // Update last message and increment unread
        await updateConversationLastMessage(conv.id, content, true);
        conv.unread_count = (conv.unread_count || 0) + 1;
      }

      // Save message — stored with conversation_id + contact_phone for per-customer queries
      const message = {
        id:              generateId(),
        chatId:          conv.id,
        conversation_id: conv.id,
        contact_phone:   phone,
        content,
        type:            metaMsg.type,
        sender:          'contact',
        status:          'received',
        meta_message_id: metaMsg.id,
        timestamp:       new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at:      new Date().toISOString(),
      };
      await dbPut(TABLES.MESSAGES, message);`n  await updateConversationLastMessage(chatId, content, false);
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
    id: generateId(), chatId, conversation_id: chatId, contact_phone: contact?.phone || '', content, type,
    sender: 'agent', status: 'sent',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: new Date().toISOString(),
  };
  await dbPut(TABLES.MESSAGES, message);`n  await updateConversationLastMessage(chatId, content, false);

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

app.get('/api/messages/chart', protect, async (req, res) => {
  try {
    const msgs = await dbScan(TABLES.MESSAGES);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const map  = {};
    days.forEach(d => { map[d] = { name: d, sent: 0, received: 0 }; });
    msgs.forEach(m => {
      const day = days[new Date(m.created_at).getDay()];
      if (!map[day]) return;
      if (m.sender === 'agent')   map[day].sent++;
      if (m.sender === 'contact') map[day].received++;
    });
    const ordered = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => map[d]);
    res.json({ success: true, data: ordered });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/messages/:chatId', protect, async (req, res) => {
  try {
    const msgs = await dbScan(TABLES.MESSAGES, m => m.chatId === req.params.chatId || m.conversation_id === req.params.chatId);
    msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json({ success: true, data: msgs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Contacts ──────────────────────────────────────────────────

// ── Contacts Export ─────────────────────────────────────────────
app.get('/api/contacts/export', protect, async (req, res) => {
  try {
    const contacts = await dbScan(TABLES.CONTACTS);
    const rows = ['name,phone,tags,status'];
    contacts.forEach(c => {
      const tags = (c.tags || []).join(';');
      rows.push(`"${c.name || ''}","${c.phone || ''}","${tags}","${c.is_online ? 'online' : 'offline'}"`);
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_${Date.now()}.csv`);
    res.send(rows.join('\n'));
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/contacts/template', protect, (req, res) => {
  const csv = 'name,phone,tags\n"John Doe","+919876543210","VIP;Retail"\n"Jane Smith","+918765432109","New"';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.csv');
  res.send(csv);
});

const csvUpload = multer({ dest: path.join(__dirname, '../../uploads/'), limits: { fileSize: 2 * 1024 * 1024 } });
app.post('/api/contacts/import', protect, csvUpload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    fs.unlinkSync(req.file.path);
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const header = lines[0].toLowerCase();
    if (!header.includes('name') || !header.includes('phone'))
      return res.status(400).json({ success: false, message: 'CSV must have name and phone columns' });
    const imported = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const name = cols[0]; const phone = cols[1];
      if (!name || !phone) continue;
      const tags = cols[2] ? cols[2].split(';').map(t => t.trim()).filter(Boolean) : [];
      const existing = await dbScan(TABLES.CONTACTS, c => c.phone === phone);
      if (!existing.length) {
        const contact = { id: generateId(), name, phone, tags, is_online: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        await dbPut(TABLES.CONTACTS, contact);
        imported.push(contact);
      }
    }
    res.json({ success: true, message: `${imported.length} contacts imported`, data: imported });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/contacts', protect, async (req, res) => {
  try {
    const data = await dbScan(TABLES.CONTACTS);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/contacts', protect, async (req, res) => {
  try {
    const { name, phone, tags } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    const existing = await dbScan(TABLES.CONTACTS, c => c.phone === phone);
    if (existing.length) return res.status(409).json({ success: false, message: 'Phone already exists' });
    const contact = { id: generateId(), name, phone, tags: tags || [], is_online: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut(TABLES.CONTACTS, contact);
    res.status(201).json({ success: true, data: contact });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/contacts/:id', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/contacts/:id', protect, async (req, res) => {
  try {
    await dbDelete(TABLES.CONTACTS, req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Agents ───────────────────────────────────────────────────
app.get('/api/agents', protect, async (req, res) => {
  try {
    const users = await dbScan(TABLES.USERS, u => u.is_active);
    res.json({ success: true, data: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, is_active: u.is_active })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/agents/:id', protect, async (req, res) => {
  try {
    await dbUpdate(TABLES.USERS, req.params.id, { is_active: false });
    res.json({ success: true, message: 'Agent deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/conversations/:id/assign', protect, async (req, res) => {
  try {
    const { agent_id } = req.body;
    const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { assigned_agent: agent_id, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    io.emit('conversation_assigned', { id: req.params.id, agent_id });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Conversations ─────────────────────────────────────────────
app.get('/api/conversations', protect, async (req, res) => {
  try {
    const convs = await dbScan(TABLES.CONVERSATIONS);
    const data  = await Promise.all(convs.map(async c => {
      const contact  = await dbGet(TABLES.CONTACTS, c.contact_id);
      const msgs     = await dbScan(TABLES.MESSAGES, m => m.conversation_id === c.id);
      const sorted   = msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return { ...c, contact, lastMessage: sorted.slice(-1)[0]?.content || '', unreadCount: msgs.filter(m => m.sender === 'contact' && m.status !== 'read').length };
    }));
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/conversations/:id/status', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: req.body.status, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    io.emit('conversation_status', { id: req.params.id, status: req.body.status });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/conversations/:id/push-admin', protect, async (req, res) => {
  try {
    await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: 'pending', pushed_to_admin: true, updated_at: new Date().toISOString() });
    io.emit('conversation_status', { id: req.params.id, status: 'pending' });
    res.json({ success: true, message: 'Pushed to admin queue' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/conversations/:id/label', protect, async (req, res) => {
  try {
    const { label } = req.body;
    const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { label: label || null, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    io.emit('conversation_label', { id: req.params.id, label });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/conversations/:id/notes', protect, async (req, res) => {
  try {
    const notes = await dbScan(TABLES.NOTES, n => n.conversation_id === req.params.id);
    res.json({ success: true, data: notes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/conversations/:id/notes', protect, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note required' });
    const n = { id: generateId(), conversation_id: req.params.id, agent_id: req.user.id, note, created_at: new Date().toISOString() };
    await dbPut(TABLES.NOTES, n);
    res.status(201).json({ success: true, data: n });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Pipeline ──────────────────────────────────────────────────
app.get('/api/pipeline', protect, async (req, res) => {
  try {
    const stages   = await dbScan(TABLES.PIPELINE_STAGES);
    const contacts = await dbScan(TABLES.CONTACTS);
    const sorted   = stages.sort((a, b) => a.position - b.position);
    const data     = sorted.map(s => ({ ...s, contacts: contacts.filter(c => c.stage_id === s.id) }));
    res.json({ success: true, data: { stages: data, totalContacts: contacts.length } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/pipeline/contacts/:id/stage', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { stage_id: req.body.stage_id, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Reminders ─────────────────────────────────────────────────
app.get('/api/reminders', protect, async (req, res) => {
  try {
    const all  = await dbScan(TABLES.REMINDERS);
    const data = req.query.status ? all.filter(r => r.status === req.query.status) : all;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/reminders', protect, async (req, res) => {
  try {
    const { title, description, due_date, priority, contact_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const r = { id: generateId(), title, description: description || '', due_date: due_date || null, priority: priority || 'medium', status: 'pending', contact_id: contact_id || null, agent_id: req.user.id, created_at: new Date().toISOString() };
    await dbPut(TABLES.REMINDERS, r);
    res.status(201).json({ success: true, data: r });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/reminders/:id', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/reminders/:id', protect, async (req, res) => {
  try {
    await dbDelete(TABLES.REMINDERS, req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/reminders/:id/complete', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, { status: 'completed' });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Campaigns ─────────────────────────────────────────────────
app.get('/api/campaigns', protect, async (req, res) => {
  try {
    const data = await dbScan(TABLES.CAMPAIGNS);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/campaigns', protect, async (req, res) => {
  try {
    const { name, template_name, scheduled_at } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const c = { id: generateId(), name, template_name: template_name || '', status: 'draft', contact_count: 0, sent_count: 0, scheduled_at: scheduled_at || null, created_by: req.user.id, created_at: new Date().toISOString() };
    await dbPut(TABLES.CAMPAIGNS, c);
    res.status(201).json({ success: true, data: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/campaigns/:id', protect, async (req, res) => {
  try {
    const updated = await dbUpdate(TABLES.CAMPAIGNS, req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/campaigns/:id', protect, async (req, res) => {
  try {
    await dbDelete(TABLES.CAMPAIGNS, req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/campaigns/:id/send', protect, async (req, res) => {
  try {
    const campaign = await dbGet(TABLES.CAMPAIGNS, req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found' });
    const allContacts = await dbScan(TABLES.CONTACTS);
    const { contact_ids } = req.body;
    const contacts = contact_ids?.length ? allContacts.filter(c => contact_ids.includes(c.id)) : allContacts;

    if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID) {
      for (const contact of contacts) {
        try {
          let metaBody;
          if (campaign.image_url) {
            metaBody = { messaging_product: 'whatsapp', recipient_type: 'individual', to: contact.phone, type: 'image', image: { link: campaign.image_url, caption: campaign.message || campaign.name } };
          } else if (campaign.message) {
            metaBody = { messaging_product: 'whatsapp', recipient_type: 'individual', to: contact.phone, type: 'text', text: { body: campaign.message } };
          } else if (campaign.template_name) {
            metaBody = { messaging_product: 'whatsapp', to: contact.phone, type: 'template', template: { name: campaign.template_name, language: { code: 'en_US' } } };
          }
          if (metaBody) {
            await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(metaBody),
            });
          }
        } catch { /* continue */ }
      }
    }
    const updated = await dbUpdate(TABLES.CAMPAIGNS, req.params.id, { status: 'sent', contact_count: contacts.length, sent_count: contacts.length });
    res.json({ success: true, data: updated, message: `Campaign sent to ${contacts.length} contacts` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Dashboard ─────────────────────────────────────────────────
app.get('/api/dashboard/stats', protect, async (req, res) => {
  try {
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
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Run this to fix it:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 CRM Backend  →  http://localhost:${PORT}`);
  console.log(`📡 Webhook      →  POST http://localhost:${PORT}/webhook`);
  console.log(`🔐 Auth         →  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🔌 Socket.IO    →  ws://localhost:${PORT}\n`);
});
