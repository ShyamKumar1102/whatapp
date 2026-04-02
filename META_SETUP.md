# Meta WhatsApp Business API — Setup Guide

Follow these steps exactly to connect real WhatsApp messages to your CRM.

---

## Step 1 — Create a Meta Developer Account

1. Go to https://developers.facebook.com
2. Click **Get Started** → log in with your Facebook account
3. Accept the developer terms

---

## Step 2 — Create a Meta App

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Select **Business** as the app type → click Next
4. Enter an app name (e.g. `My CRM`) and your business email
5. Click **Create App**

---

## Step 3 — Add WhatsApp to Your App

1. Inside your app dashboard, scroll to find **WhatsApp** → click **Set Up**
2. You will land on the **WhatsApp Getting Started** page
3. You will see a **Temporary Access Token** — copy it (valid 24 hours)
4. You will see a **Phone Number ID** — copy it
5. You will see a **WhatsApp Business Account ID** — copy it

---

## Step 4 — Set Your .env

Open `backend/.env` and fill in:

```env
META_VERIFY_TOKEN=my_crm_webhook_verify_token_2024
META_ACCESS_TOKEN=your_temporary_or_permanent_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_WABA_ID=your_whatsapp_business_account_id_here
```

---

## Step 5 — Expose Your Backend with ngrok

Meta requires a **public HTTPS URL** for the webhook.
Since you are running locally, use ngrok:

```bash
# Install ngrok (one time)
npm install -g ngrok

# Authenticate (get token from https://dashboard.ngrok.com)
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Expose your backend
ngrok http 5000
```

Copy the HTTPS URL shown, e.g. `https://abc123.ngrok-free.app`

---

## Step 6 — Register the Webhook in Meta

1. In your Meta App dashboard → **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. Set:
   - **Callback URL**: `https://abc123.ngrok-free.app/webhook`
   - **Verify Token**: `my_crm_webhook_verify_token_2024`
4. Click **Verify and Save**
   - Meta will call `GET /webhook` — your backend responds with the challenge ✅
5. Under **Webhook Fields**, click **Manage** and subscribe to:
   - `messages`
   - `message_status_updates` (or `statuses`)

---

## Step 7 — Add a Test Phone Number

1. In **WhatsApp** → **API Setup**
2. Under **To**, click **Manage phone number list**
3. Add your personal WhatsApp number (with country code, e.g. `+919876543210`)
4. Enter the OTP sent to your WhatsApp

---

## Step 8 — Send a Test Message

1. In **API Setup**, click **Send Message** to send a template message to your test number
2. You should receive it on WhatsApp ✅
3. Now reply from your WhatsApp — it should appear in the CRM Chats page in real-time ✅

---

## Step 9 — Get a Permanent Token (Production)

The temporary token expires in 24 hours. For production:

1. Go to https://business.facebook.com
2. **Settings** → **System Users** → **Add**
3. Create a System User with **Admin** role
4. Click **Generate New Token** → select your app → grant `whatsapp_business_messaging` permission
5. Copy the permanent token → paste into `META_ACCESS_TOKEN` in `.env`

---

## Step 10 — Go Live (Remove Test Restrictions)

By default, you can only message numbers added to your test list.
To message anyone:

1. Meta App Dashboard → **App Review** → **Permissions and Features**
2. Request `whatsapp_business_messaging` permission
3. Submit for review (requires business verification)
4. Once approved, you can message any WhatsApp number

---

## Message Flow Summary

```
Customer sends WhatsApp message
        ↓
Meta Cloud API
        ↓  POST /webhook
Backend (Node.js)
        ↓  saves message
        ↓  io.emit('new_message')
CRM Frontend (React)
        ↓  agent sees message in real-time
Agent types reply → clicks Send
        ↓
Backend POST → Meta Graph API
        ↓
Customer receives reply on WhatsApp
```

---

## Supported Message Types (Incoming)

| Type       | What CRM shows         |
|------------|------------------------|
| text       | Message text           |
| image      | 📷 Image               |
| document   | 📎 filename.pdf        |
| audio      | 🎤 Voice message       |
| video      | 🎥 Video               |
| location   | 📍 lat, lng            |
| sticker    | 🎨 Sticker             |
| reaction   | emoji reaction         |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Webhook verification fails | Check `META_VERIFY_TOKEN` matches exactly in `.env` and Meta console |
| Messages not appearing | Check ngrok is running and URL is correct in Meta console |
| Token expired | Generate a new temporary token or use a permanent System User token |
| Can only message test numbers | Complete Meta Business Verification and app review |
| `Error 131030` | Phone number not in test list — add it in API Setup |
