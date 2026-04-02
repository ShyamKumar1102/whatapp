# WhatsApp CRM

A production-ready WhatsApp CRM built with React + Node.js + Socket.IO + Meta WhatsApp Business Cloud API.

## Quick Start (Local Development)

### 1. Frontend
```bash
npm install
npm run dev        # runs on http://localhost:8080
```

### 2. Backend
```bash
cd backend
npm install
npm run dev        # runs on http://localhost:5000
```

---

## Connect Real WhatsApp Messages

### Step 1 — Get Meta Credentials
1. Go to https://developers.facebook.com
2. Create an App → Business → WhatsApp
3. Copy your **Phone Number ID** and **Temporary Access Token**
4. For production, generate a **Permanent System User Token** in Business Manager

### Step 2 — Set backend/.env
```
META_VERIFY_TOKEN=my_crm_webhook_verify_token_2024
META_ACCESS_TOKEN=your_permanent_access_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Step 3 — Expose Webhook (Local Testing)
Meta requires a public HTTPS URL. Use ngrok:
```bash
npx ngrok http 5000
# Copy the https URL e.g. https://abc123.ngrok.io
```

### Step 4 — Register Webhook in Meta
1. Meta Developer Console → WhatsApp → Configuration
2. Webhook URL: `https://abc123.ngrok.io/webhook`
3. Verify Token: `my_crm_webhook_verify_token_2024`
4. Subscribe to: `messages`, `message_status_updates`

### Step 5 — Test
Send a WhatsApp message to your test number.
It will appear in the CRM Chats page in real-time via Socket.IO.

---

## Production (AWS EC2)

See the EC2 deployment guide for full setup with:
- Nginx reverse proxy
- PM2 process manager
- Let's Encrypt SSL
- UFW firewall + fail2ban

---

## Architecture

```
WhatsApp User
     │  sends message
     ▼
Meta Cloud API
     │  POST /webhook
     ▼
Node.js Backend (Express)
     │  saves to DB / in-memory
     │  emits via Socket.IO
     ▼
React Frontend (CRM Dashboard)
     │  agent replies
     ▼
Node.js Backend
     │  POST to Meta Graph API
     ▼
WhatsApp User receives reply
```

## Features
- ✅ Real-time messaging via Socket.IO
- ✅ Meta WhatsApp Business Cloud API integration
- ✅ Webhook receiver for incoming messages
- ✅ Message status tracking (sent/delivered/read)
- ✅ Contact management
- ✅ Sales pipeline (Kanban)
- ✅ Reminders
- ✅ Campaign management
- ✅ Message templates
- ✅ Analytics dashboard
- ✅ Internal notes per conversation
- ✅ Push to admin queue
- ✅ Dark mode
