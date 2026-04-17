# WhatsApp CRM — ChatGPT Auto-Reply Architecture

```
Customer sends WhatsApp message
        ↓
Meta Cloud API
        ↓
POST /webhook → AWS EC2 (51.20.126.140)
        ↓
Node.js saves message to DynamoDB
        ↓
Calls OpenAI ChatGPT API
        ↓
ChatGPT generates smart reply
        ↓
Reply sent back via Meta Graph API
        ↓
Customer receives AI reply on WhatsApp
        ↓
Agent sees full conversation in CRM Dashboard
        ↓
Agent can click "Take Over" to reply manually
```

---

## What Agent Sees in Dashboard

```
Chats Page
┌──────────────────────────────────────┐
│ 🤖 Rahul Sharma        Just now  [2] │  ← AI is handling
│    "Thanks for the info!"            │
├──────────────────────────────────────┤
│ 👨 Priya Patel         5 min ago    │  ← Agent is handling
│    "I need a demo"                   │
└──────────────────────────────────────┘

Chat Window
┌──────────────────────────────────────┐
│ Customer: Hi what is your price?     │
│                                      │
│      🤖 AI: Hello! Price is ₹999 ✓✓ │
│                                      │
│ Customer: Tell me more               │
│                                      │
│      🤖 AI: We have 3 plans... ✓✓   │
│                                      │
│         [ Take Over from AI ]        │
└──────────────────────────────────────┘
```

---

## Message Types Saved in Database

| Sender | Meaning |
|--------|---------|
| `contact` | Customer's message |
| `ai` | ChatGPT auto-reply |
| `agent` | Human agent reply |

---

## Simple One Line

> Customer WhatsApp → Meta → EC2 → ChatGPT → Reply → Customer  
> Agent watches everything live and can take over anytime.
