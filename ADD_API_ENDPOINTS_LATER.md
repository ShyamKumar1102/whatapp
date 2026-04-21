# Add API Endpoints for Lambda + CRM Integration

## What needs to be added back to `backend/src/server.js`

### 1. Twilio Webhook — `/twilio/webhook`
Receives customer messages from `prasham-whatsapp` and saves to CRM dashboard.

```js
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
```

---

### 2. AI Status Check — `/api/conversations/ai-status`
Lambda calls this to check if agent has taken over a chat (AI should stop).

```js
// ── AI Status check (for Lambda) ─────────────────────────────────
app.get('/api/conversations/ai-status', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ ai_disabled: false });
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const conv = await getConversationByPhone(normalizedPhone) || await getConversationByPhone(phone);
    res.json({ ai_disabled: conv?.ai_disabled || false });
  } catch (err) { res.json({ ai_disabled: false }); }
});
```

---

### 3. External Message API — `/api/external/message`
Lambda calls this to push AI reply into CRM dashboard.

```js
// ── External Message API (for Lambda to push AI replies to CRM) ────────
app.post('/api/external/message', async (req, res) => {
  try {
    const { phone: rawPhone, content, sender = 'ai' } = req.body;
    if (!rawPhone || !content) return res.status(400).json({ success: false, message: 'phone and content required' });

    const phoneWithPlus    = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
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
    console.log(`📥 [External] ${sender} message saved for [${phoneWithPlus}]: ${content.slice(0, 60)}`);
    res.json({ success: true, data: message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
```

---

## Where to add in server.js

Add all 3 endpoints **before** the `// ── AI Takeover` section.

---

## Also needed in prasham-whatsapp

In `receiveController.js` — add CRM forwarding line after line 115:
```js
axios.post("http://localhost:5000/twilio/webhook", req.body, {headers:{"Content-Type":"application/json"},timeout:5000}).catch(function(e){console.error("[CRM] Forward error:",e.message);});
```

---

## Lambda code needed

Lambda must call `forward_to_crm` after generating AI reply:
```python
def forward_to_crm(phone, content, sender="ai"):
    try:
        crm_data = json.dumps({"phone": phone, "content": content, "sender": sender}).encode("utf-8")
        crm_req = urllib.request.Request(
            "http://51.20.126.140/api/external/message",
            data=crm_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(crm_req, timeout=5)
        print("CRM forward success")
    except Exception as e:
        print("CRM forward error:", e)
```

---

## Flow after adding back

```
Customer sends WhatsApp message
        ↓
Twilio → prasham-whatsapp
        ↓
        ├── Forwards to Lambda (AI reply to customer)
        └── Forwards to CRM /twilio/webhook (customer message in dashboard)
        ↓
Lambda generates AI reply
        ↓
Lambda calls /api/external/message (AI reply in dashboard)
        ↓
Agent sees both customer message + AI reply in CRM ✅
Agent can Take Over → AI stops ✅
Agent replies manually → customer receives ✅
```
