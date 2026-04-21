const fs = require('fs');
const file = '/home/ec2-user/crm/backend/src/server.js';
let c = fs.readFileSync(file, 'utf8');

const endpoints = `
// ── Twilio Webhook ────────────────────────────────────────────
app.post('/twilio/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const { From, Body, ProfileName, WaId, MessageSid } = req.body;
    if (!From || !Body) return;
    const phone = From.replace('whatsapp:', '');
    const name  = ProfileName || WaId || phone;
    await processIncomingMessage({ phone, name, content: Body, type: 'text', messageId: MessageSid });
  } catch (err) { console.error('Twilio webhook error:', err.message); }
});

// ── AI Status check (for Lambda) ─────────────────────────────────
app.get('/api/conversations/ai-status', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ ai_disabled: false });
    const normalizedPhone = phone.startsWith('+') ? phone : \`+\${phone}\`;
    const conv = await getConversationByPhone(normalizedPhone) || await getConversationByPhone(phone);
    res.json({ ai_disabled: conv?.ai_disabled || false });
  } catch (err) { res.json({ ai_disabled: false }); }
});

// ── External Message API (for Lambda to push AI replies to CRM) ────────
app.post('/api/external/message', async (req, res) => {
  try {
    const { phone: rawPhone, content, sender = 'ai' } = req.body;
    if (!rawPhone || !content) return res.status(400).json({ success: false, message: 'phone and content required' });

    const phoneWithPlus    = rawPhone.startsWith('+') ? rawPhone : \`+\${rawPhone}\`;
    const phoneWithoutPlus = rawPhone.replace('+', '');

    let contact = (await dbScan(TABLES.CONTACTS, c => c.phone === phoneWithPlus || c.phone === phoneWithoutPlus || c.phone === rawPhone))[0];
    let conv = await getConversationByPhone(phoneWithPlus) || await getConversationByPhone(phoneWithoutPlus) || await getConversationByPhone(rawPhone);

    if (!contact) {
      contact = { id: generateId(), name: phoneWithPlus, phone: phoneWithPlus, tags: [], is_online: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await dbPut(TABLES.CONTACTS, contact);
      io.emit('contact_created', contact);
    }
    if (!conv) {
      conv = { id: generateId(), contact_id: contact.id, contact_phone: phoneWithPlus, status: 'open', channel: 'whatsapp', pushed_to_admin: false, unread_count: 0, last_message: content, last_message_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await dbPut(TABLES.CONVERSATIONS, conv);
      io.emit('conversation_created', { ...conv, contact });
    }

    const message = {
      id:              generateId(),
      chatId:          conv.id,
      conversation_id: conv.id,
      contact_phone:   phoneWithPlus,
      content,
      type:            'text',
      sender,
      ai_generated:    sender === 'ai',
      status:          'sent',
      timestamp:       new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at:      new Date().toISOString(),
    };
    await dbPut(TABLES.MESSAGES, message);
    await updateConversationLastMessage(conv.id, content);
    io.emit('new_message', { ...message, contact, chatId: conv.id });
    console.log(\`📥 [External] \${sender} message saved for [\${phoneWithPlus}]: \${content.slice(0, 60)}\`);
    res.json({ success: true, data: message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

`;

c = c.replace('// ── AI Takeover', endpoints + '// ── AI Takeover');
fs.writeFileSync(file, c);
console.log('done');
