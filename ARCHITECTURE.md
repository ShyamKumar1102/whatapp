# WhatsApp CRM — Complete Architecture & API Documentation

> **Project:** WhatsApp CRM Dashboard  
> **Stack:** React + Node.js + Socket.IO + AWS DynamoDB + Meta WhatsApp Business Cloud API  
> **Live:** http://51.20.126.140  
> **GitHub:** https://github.com/ShyamKumar1102/whatapp

---

## Table of Contents

1. [Architecture Diagram](#architecture-diagram)
2. [Component Overview](#component-overview)
3. [Tech Stack](#tech-stack)
4. [AWS Services](#aws-services)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Socket.IO Events](#socketio-events)
8. [Security](#security)
9. [Deployment](#deployment)
10. [Future Roadmap](#future-roadmap)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USERS / AGENTS                              │
│                  Browser (Desktop) │ Mobile (PWA)                    │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ HTTP / WebSocket
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      AWS EC2 — Nginx (Port 80)                       │
│                                                                      │
│   /              → serves React dist/ (frontend)                     │
│   /api/*         → proxy → Node.js :5000                             │
│   /socket.io/*   → proxy → Node.js :5000                             │
│   /webhook       → proxy → Node.js :5000                             │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│               Node.js + Express + Socket.IO (Port 5000)              │
│                         PM2 Process Manager                          │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Auth APIs  │  │ Contact APIs │  │  Chat APIs │  │ Admin APIs │  │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │Reminder APIs│  │Campaign APIs │  │Template API│  │Pipeline API│  │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────┘  │
└──────────┬──────────────────────────────────────┬────────────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────┐               ┌───────────────────────────┐
│    AWS DynamoDB     │               │  Meta WhatsApp Cloud API  │
│   (eu-north-1)      │               │                           │
│                     │               │  ← POST /webhook          │
│  crm_users          │               │  → Send messages          │
│  crm_contacts       │               │  → Send templates         │
│  crm_conversations  │               │  → Status updates         │
│  crm_messages       │               └───────────────────────────┘
│  crm_reminders      │
│  crm_campaigns      │
│  crm_templates      │
│  crm_pipeline_stages│
│  crm_notes          │
└─────────────────────┘
```

---

## Component Overview

| Component | Technology | Role |
|-----------|-----------|------|
| **Frontend** | React 18 + Vite + TailwindCSS | SPA Dashboard — all pages and UI |
| **State Management** | Zustand | Global state — chats, messages, user, notifications |
| **Real-time Client** | Socket.IO Client | Live messages, typing, status updates |
| **UI Components** | shadcn/ui + Radix UI | Consistent design system |
| **Charts** | Recharts | Dashboard analytics charts |
| **Backend** | Node.js + Express | REST API — all business logic |
| **Real-time Server** | Socket.IO Server | Emit events to connected agents |
| **Process Manager** | PM2 | Auto-restart, startup on reboot |
| **Reverse Proxy** | Nginx | Serve frontend + proxy API/Socket |
| **Database** | AWS DynamoDB | NoSQL — all CRM data |
| **Cloud** | AWS EC2 (Amazon Linux) | Hosts backend + frontend build |
| **WhatsApp** | Meta Business Cloud API | Receive/send WhatsApp messages |
| **Auth** | JWT + bcrypt | Secure authentication |

---

## Tech Stack

### Frontend
```
React 18          — UI framework
Vite              — Build tool
TailwindCSS       — Styling
shadcn/ui         — Component library
Zustand           — State management
Socket.IO Client  — Real-time
React Router v6   — Navigation
Recharts          — Charts
Sonner            — Toast notifications
```

### Backend
```
Node.js 20        — Runtime
Express 4         — HTTP framework
Socket.IO 4       — WebSocket server
JWT               — Authentication tokens
bcryptjs          — Password hashing
Helmet            — Security headers
express-rate-limit — Rate limiting
Multer            — File uploads
dotenv            — Environment config
PM2               — Process management
```

### Database
```
AWS DynamoDB      — NoSQL database (pay per request)
AWS Region        — eu-north-1 (Stockholm)
```

### Infrastructure
```
AWS EC2           — t2.micro (Amazon Linux 2023)
Nginx             — Reverse proxy
GitHub            — Source control + CI
```

---

## AWS Services

### Current Setup (~$10-12/month)
| Service | Usage | Cost |
|---------|-------|------|
| EC2 t2.micro | Backend + Frontend | ~$8/month |
| DynamoDB On-Demand | All CRM data | ~$1-3/month |
| **Total** | | **~$10-12/month** |

### Recommended Production (~$23/month)
| Service | Usage | Cost |
|---------|-------|------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~$15/month |
| DynamoDB On-Demand | Auto scales | ~$5/month |
| S3 + CloudFront | Frontend CDN | ~$2/month |
| Route 53 | Custom domain | ~$0.50/month |
| ACM SSL | HTTPS certificate | FREE |
| **Total** | | **~$23/month** |

### Scale Setup (~$70/month)
| Service | Usage | Cost |
|---------|-------|------|
| EC2 t3.medium | 2 vCPU, 4GB RAM | ~$30/month |
| ALB | Load balancer | ~$16/month |
| ElastiCache Redis | Socket.IO sessions | ~$15/month |
| DynamoDB Provisioned | Predictable cost | ~$10/month |
| **Total** | | **~$70/month** |

---

## Database Schema

### crm_users
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "password_hash": "string",
  "role": "admin | agent",
  "is_active": "boolean",
  "created_at": "ISO timestamp"
}
```

### crm_contacts
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string",
  "tags": ["string"],
  "is_online": "boolean",
  "last_seen": "string",
  "stage_id": "string",
  "pipeline_status": "string",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### crm_conversations
```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "contact_phone": "string",
  "status": "open | pending | resolved",
  "channel": "whatsapp",
  "assigned_agent": "uuid",
  "label": "string | null",
  "pushed_to_admin": "boolean",
  "unread_count": "number",
  "last_message": "string",
  "last_message_at": "ISO timestamp",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### crm_messages
```json
{
  "id": "uuid",
  "chatId": "uuid",
  "conversation_id": "uuid",
  "contact_phone": "string",
  "content": "string",
  "type": "text | image | document | audio | voice",
  "sender": "agent | contact",
  "status": "sent | delivered | read | received",
  "meta_message_id": "string",
  "deleted_for_me": "boolean",
  "deleted_for_everyone": "boolean",
  "timestamp": "HH:MM AM/PM",
  "created_at": "ISO timestamp"
}
```

### crm_reminders
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "type": "general | quotation | invoice | payment",
  "amount": "number | null",
  "due_date": "ISO timestamp | null",
  "priority": "low | medium | high",
  "status": "pending | completed",
  "contact_id": "uuid | null",
  "agent_id": "uuid",
  "created_at": "ISO timestamp"
}
```

### crm_campaigns
```json
{
  "id": "uuid",
  "name": "string",
  "message": "string",
  "template_name": "string",
  "image_url": "string | null",
  "status": "draft | scheduled | sent | pending",
  "contact_count": "number",
  "sent_count": "number",
  "scheduled_at": "ISO timestamp | null",
  "created_by": "uuid",
  "created_at": "ISO timestamp"
}
```

### crm_templates
```json
{
  "id": "uuid",
  "name": "string",
  "category": "Marketing | Utility | Authentication",
  "language": "string",
  "body": "string",
  "status": "approved | pending | rejected",
  "meta_id": "string | null",
  "created_at": "ISO timestamp"
}
```

### crm_pipeline_stages
```json
{
  "id": "uuid",
  "name": "string",
  "color": "string",
  "position": "number"
}
```

### crm_notes
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "agent_id": "uuid",
  "note": "string",
  "created_at": "ISO timestamp"
}
```

---

## API Endpoints

> **Base URL:** `http://51.20.126.140`  
> **Auth:** All endpoints (except `/api/health`, `/api/auth/*`, `/webhook`) require:  
> `Authorization: Bearer <jwt_token>`

---

### 🔐 Authentication

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "admin@crm.com",
  "password": "admin123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "user-1",
    "name": "Admin",
    "email": "admin@crm.com",
    "role": "admin"
  }
}
```

---

#### POST `/api/auth/register`
Register a new agent (admin only in practice).

**Request:**
```json
{
  "name": "Agent Name",
  "email": "agent@crm.com",
  "password": "password123",
  "role": "agent"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "Agent Name", "role": "agent" }
}
```

---

#### GET `/api/auth/me`
Get current logged-in user info.

**Response:**
```json
{
  "success": true,
  "user": { "id": "user-1", "name": "Admin", "email": "admin@crm.com", "role": "admin" }
}
```

---

#### POST `/api/auth/forgot-password`
Reset password — returns temporary password on screen.

**Request:**
```json
{ "email": "admin@crm.com" }
```
**Response:**
```json
{
  "success": true,
  "tempPassword": "abc123XYZ",
  "message": "Password reset successfully"
}
```

---

### 💬 Conversations

#### GET `/api/conversations`
Get all conversations with contact info and last message.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "contact": { "id": "uuid", "name": "Rahul Sharma", "phone": "+919876543210", "is_online": true },
      "status": "open",
      "label": "prospect",
      "pushed_to_admin": false,
      "lastMessage": "Hi, I need help",
      "unreadCount": 2,
      "assigned_agent": "user-2",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/conversations/:id/status`
Update conversation status.

**Request:**
```json
{ "status": "resolved" }
```

---

#### PATCH `/api/conversations/:id/label`
Set a label on a conversation.

**Request:**
```json
{ "label": "prospect" }
```
**Available labels:** `meeting_done`, `meeting_fixed`, `prospect`, `closed_won`, `closed_lost`, `agreed_to_buy`, `junk_load`, `callback_followup`, `not_contacted`

---

#### PATCH `/api/conversations/:id/assign`
Assign conversation to an agent.

**Request:**
```json
{ "agent_id": "user-2" }
```

---

#### POST `/api/conversations/:id/push-admin`
Push conversation to admin queue.

**Response:**
```json
{ "success": true, "message": "Pushed to admin queue" }
```

---

#### GET `/api/conversations/:id/notes`
Get internal notes for a conversation.

---

#### POST `/api/conversations/:id/notes`
Add an internal note.

**Request:**
```json
{ "note": "Customer interested in premium plan" }
```

---

### 📨 Messages

#### GET `/api/messages/:chatId`
Get all messages for a conversation (sorted oldest → newest).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "chatId": "conv-uuid",
      "content": "Hello!",
      "sender": "contact",
      "status": "read",
      "type": "text",
      "timestamp": "10:00 AM",
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/messages/send`
Send a message to a contact via WhatsApp.

**Request:**
```json
{
  "chatId": "conv-uuid",
  "content": "Hello! How can I help you?",
  "type": "text"
}
```
**For template message:**
```json
{
  "chatId": "conv-uuid",
  "content": "Template message",
  "type": "template",
  "templateName": "welcome_message",
  "templateParams": ["John", "Order #123"]
}
```

---

#### GET `/api/messages/chart`
Get message chart data for the week (sent vs received per day).

**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "Mon", "sent": 45, "received": 32 },
    { "name": "Tue", "sent": 38, "received": 28 }
  ]
}
```

---

#### PATCH `/api/messages/:messageId/delete-for-me`
Delete a message only for the current agent.

---

#### DELETE `/api/messages/:messageId`
Delete a message for everyone.

---

### 👥 Contacts

#### GET `/api/contacts`
Get all contacts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rahul Sharma",
      "phone": "+919876543210",
      "tags": ["VIP", "Retail"],
      "is_online": true,
      "stage_id": "1",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/contacts`
Create a new contact.

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "tags": ["New", "Retail"]
}
```

---

#### PUT `/api/contacts/:id`
Update a contact.

**Request:**
```json
{
  "name": "John Doe Updated",
  "tags": ["VIP"]
}
```

---

#### DELETE `/api/contacts/:id`
Delete a contact permanently.

---

#### GET `/api/contacts/export`
Export all contacts as CSV file download.

---

#### GET `/api/contacts/template`
Download CSV import template.

---

#### POST `/api/contacts/import`
Import contacts from CSV file.

**Request:** `multipart/form-data` with field `csvFile`

**CSV Format:**
```
name,phone,tags
"John Doe","+919876543210","VIP;Retail"
"Jane Smith","+918765432109","New"
```

---

### 🔔 Reminders

#### GET `/api/reminders`
Get all reminders. Optional query: `?status=pending`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Follow up with Rahul",
      "description": "Check on demo feedback",
      "type": "payment",
      "amount": 15000,
      "due_date": "2024-01-15T10:00:00.000Z",
      "priority": "high",
      "status": "pending",
      "contact_id": "contact-uuid",
      "agent_id": "user-1",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/reminders`
Create a new reminder.

**Request:**
```json
{
  "title": "Collect payment from Rahul",
  "description": "Invoice #INV-001",
  "type": "payment",
  "amount": 15000,
  "due_date": "2024-01-15T10:00:00.000Z",
  "priority": "high",
  "contact_id": "contact-uuid"
}
```
**Types:** `general` | `quotation` | `invoice` | `payment`

---

#### PUT `/api/reminders/:id`
Update a reminder.

---

#### DELETE `/api/reminders/:id`
Delete a reminder.

---

#### PATCH `/api/reminders/:id/complete`
Mark a reminder as completed.

**Response:**
```json
{ "success": true, "data": { "status": "completed" } }
```

---

### 📢 Campaigns

#### GET `/api/campaigns`
Get all campaigns.

---

#### POST `/api/campaigns`
Create a new campaign.

**Request:**
```json
{
  "name": "Diwali Sale 2024",
  "message": "Get 20% off this Diwali!",
  "template_name": "diwali_sale",
  "scheduled_at": "2024-10-20T09:00:00.000Z"
}
```

---

#### PUT `/api/campaigns/:id`
Update a campaign.

---

#### DELETE `/api/campaigns/:id`
Delete a campaign.

---

#### PATCH `/api/campaigns/:id/send`
Send campaign to all contacts (or specific contacts).

**Request (optional):**
```json
{ "contact_ids": ["uuid1", "uuid2"] }
```
**Response:**
```json
{ "success": true, "message": "Campaign sent to 120 contacts" }
```

---

#### POST `/api/campaigns/upload-image`
Upload campaign image. Returns image URL.

**Request:** `multipart/form-data` with field `image`

**Response:**
```json
{ "success": true, "url": "http://51.20.126.140/uploads/filename.jpg" }
```

---

### 📄 Templates

#### GET `/api/templates`
Get all templates (from Meta API if configured, else from DynamoDB).

---

#### POST `/api/templates`
Create a local template.

**Request:**
```json
{
  "name": "welcome_message",
  "category": "Marketing",
  "language": "en_US",
  "body": "Hello {{1}}! Welcome to our service."
}
```

---

#### DELETE `/api/templates/:id`
Delete a template.

---

#### POST `/api/templates/submit-meta`
Submit template to Meta for approval.

**Request:**
```json
{
  "name": "welcome_message",
  "category": "MARKETING",
  "language": "en_US",
  "body": "Hello {{1}}! Welcome to our service."
}
```
**Response:**
```json
{
  "success": true,
  "metaId": "meta-template-id",
  "status": "pending"
}
```

---

### 🏗️ Pipeline

#### GET `/api/pipeline`
Get all pipeline stages with contacts in each stage.

**Response:**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "id": "1",
        "name": "New Lead",
        "color": "blue",
        "position": 1,
        "contacts": [{ "id": "uuid", "name": "Rahul Sharma" }]
      }
    ],
    "totalContacts": 25
  }
}
```

---

#### PATCH `/api/pipeline/contacts/:id/stage`
Move a contact to a different pipeline stage.

**Request:**
```json
{ "stage_id": "2" }
```

---

### 👤 Agents

#### GET `/api/agents`
Get all active agents/users.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "user-1", "name": "Admin", "email": "admin@crm.com", "role": "admin", "is_active": true }
  ]
}
```

---

#### DELETE `/api/agents/:id`
Deactivate an agent (soft delete).

---

### 📊 Dashboard

#### GET `/api/dashboard/stats`
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 1250,
    "activeChats": 28,
    "campaigns": 5,
    "responseTime": "2.3m",
    "messagesGrowth": 12.5,
    "chatsGrowth": 8.3,
    "campaignsGrowth": 25.0,
    "responseTimeGrowth": -15.2
  }
}
```

---

### ⚙️ Settings

#### POST `/api/settings`
Save Meta API credentials (persists to .env).

**Request:**
```json
{
  "META_ACCESS_TOKEN": "your_token",
  "META_PHONE_NUMBER_ID": "your_phone_id",
  "META_VERIFY_TOKEN": "your_verify_token"
}
```

---

### 🌐 Webhook (Meta WhatsApp)

#### GET `/webhook`
Meta webhook verification (called by Meta during setup).

**Query params:** `hub.mode`, `hub.verify_token`, `hub.challenge`

---

#### POST `/webhook`
Receives incoming WhatsApp messages from Meta.

**Handles:**
- Incoming text, image, document, audio, video, location, sticker messages
- Message status updates (sent → delivered → read)
- Auto-creates contact if new phone number
- Auto-creates conversation if first message
- Emits Socket.IO events to all connected agents

---

### ❤️ Health

#### GET `/api/health`
Check if backend is running.

**Response:**
```json
{
  "success": true,
  "message": "CRM API running",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## Socket.IO Events

### Server → Client (Emitted by backend)

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ id, chatId, content, sender, status, contact }` | New incoming WhatsApp message |
| `message_status` | `{ messageId, status }` | Message status update (delivered/read) |
| `conversation_created` | `{ id, contact, ... }` | New conversation started |
| `conversation_status` | `{ id, status }` | Conversation status changed |
| `conversation_label` | `{ id, label }` | Label assigned to conversation |
| `conversation_assigned` | `{ id, agent_id }` | Conversation assigned to agent |
| `contact_created` | `{ id, name, phone }` | New contact created from WhatsApp |
| `contact_typing` | `{ chatId }` | Customer is typing |
| `agent_typing` | `{ chatId }` | Agent is typing |
| `agent_stop_typing` | `{ chatId }` | Agent stopped typing |

### Client → Server (Emitted by frontend)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_chat` | `chatId` | Join a chat room, marks messages as read |
| `send_message` | `{ chatId, content, ... }` | Send message to chat room |
| `typing` | `{ chatId }` | Agent started typing |
| `stop_typing` | `{ chatId }` | Agent stopped typing |

---

## Security

### Implemented
- ✅ JWT authentication on all protected routes
- ✅ bcrypt password hashing (cost factor 10)
- ✅ Helmet.js HTTP security headers
- ✅ Rate limiting (300 requests / 15 minutes)
- ✅ CORS configured
- ✅ Admin-only route protection
- ✅ Trust proxy for accurate rate limiting behind Nginx

### Recommended
- ⬜ HTTPS via Let's Encrypt (free SSL)
- ⬜ EC2 IAM Role instead of hardcoded AWS keys
- ⬜ DynamoDB encryption at rest
- ⬜ Security Group — restrict to port 80/443 only
- ⬜ AWS WAF for DDoS protection

---

## Deployment

### EC2 Server Info
```
IP:       51.20.126.140
User:     ec2-user
OS:       Amazon Linux 2023
Node:     v20.20.2
PM2:      v6.0.14
Nginx:    v1.28.2
```

### File Structure on EC2
```
/home/ec2-user/crm/
├── dist/              ← React build (served by Nginx)
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   └── middleware/
│   └── .env
├── .env               ← VITE_BACKEND_URL
└── deploy.sh
```

### Deploy Updates
Run `deploy.bat` from your Windows machine:
```batch
deploy.bat
```
This will:
1. Push code to GitHub
2. Pull on EC2
3. Build frontend
4. Install dependencies
5. Restart backend via PM2

### Manual EC2 Commands
```bash
# Check backend status
pm2 list

# View backend logs
pm2 logs crm-backend

# Restart backend
pm2 restart crm-backend

# Rebuild frontend
cd /home/ec2-user/crm && npm run build

# Restart Nginx
sudo systemctl restart nginx
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=*

AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

DYNAMO_TABLE_USERS=crm_users
DYNAMO_TABLE_CONTACTS=crm_contacts
DYNAMO_TABLE_CONVERSATIONS=crm_conversations
DYNAMO_TABLE_MESSAGES=crm_messages
DYNAMO_TABLE_NOTES=crm_notes
DYNAMO_TABLE_REMINDERS=crm_reminders
DYNAMO_TABLE_CAMPAIGNS=crm_campaigns
DYNAMO_TABLE_PIPELINE=crm_pipeline_stages

META_VERIFY_TOKEN=my_crm_webhook_verify_token_2024
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_WABA_ID=

JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
```

### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://51.20.126.140
```

---

## Future Roadmap

### Phase 2 — Production Hardening
- [ ] HTTPS with Let's Encrypt SSL
- [ ] Custom domain via Route 53
- [ ] Frontend on S3 + CloudFront CDN
- [ ] EC2 IAM Role (remove hardcoded AWS keys)
- [ ] CloudWatch monitoring + alerts

### Phase 3 — New Features
- [ ] Quotation / Invoice / Payment tracker
- [ ] Payment collection reminders with amounts
- [ ] WhatsApp quick payment reminder message
- [ ] Dashboard payment summary widget
- [ ] PDF invoice generation
- [ ] Multi-language support

### Phase 4 — Scale
- [ ] Redis for Socket.IO multi-instance
- [ ] Auto Scaling Group
- [ ] DynamoDB point-in-time recovery
- [ ] API versioning (/api/v1/)
- [ ] Request logging with Morgan
- [ ] Mobile app (React Native)

---

## Default Credentials

```
Admin:  admin@crm.com  / admin123
Agent:  agent1@crm.com / admin123
```

> ⚠️ Change these passwords after first login using Forgot Password feature.

---

*Last updated: April 2026*
