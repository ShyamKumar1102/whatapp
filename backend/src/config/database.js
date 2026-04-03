import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, PutCommand, GetCommand,
  ScanCommand, UpdateCommand, DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

// ── Table names ───────────────────────────────────────────────
export const TABLES = {
  USERS:           process.env.DYNAMO_TABLE_USERS          || 'crm_users',
  CONTACTS:        process.env.DYNAMO_TABLE_CONTACTS       || 'crm_contacts',
  CONVERSATIONS:   process.env.DYNAMO_TABLE_CONVERSATIONS  || 'crm_conversations',
  MESSAGES:        process.env.DYNAMO_TABLE_MESSAGES       || 'crm_messages',
  NOTES:           process.env.DYNAMO_TABLE_NOTES          || 'crm_notes',
  REMINDERS:       process.env.DYNAMO_TABLE_REMINDERS      || 'crm_reminders',
  CAMPAIGNS:       process.env.DYNAMO_TABLE_CAMPAIGNS      || 'crm_campaigns',
  PIPELINE_STAGES: process.env.DYNAMO_TABLE_PIPELINE       || 'crm_pipeline_stages',
};

export const generateId = () => uuidv4();

// ── DynamoDB client ───────────────────────────────────────────
const USE_DYNAMO = !!(
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

let docClient = null;

if (USE_DYNAMO) {
  const raw = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  docClient = DynamoDBDocumentClient.from(raw, {
    marshallOptions:   { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
  });
  console.log(`✅ DynamoDB connected — region: ${process.env.AWS_REGION}`);
} else {
  console.log('⚠️  AWS credentials not set — using in-memory store');
}

// ══════════════════════════════════════════════════════════════
// CORE DB HELPERS — auto-switch DynamoDB ↔ in-memory
// ══════════════════════════════════════════════════════════════

export const dbPut = async (table, item) => {
  if (USE_DYNAMO) {
    await docClient.send(new PutCommand({ TableName: table, Item: item }));
    return item;
  }
  if (!mem[table]) mem[table] = [];
  const idx = mem[table].findIndex(i => i.id === item.id);
  if (idx >= 0) mem[table][idx] = item; else mem[table].push(item);
  return item;
};

export const dbGet = async (table, id) => {
  if (USE_DYNAMO) {
    const res = await docClient.send(new GetCommand({ TableName: table, Key: { id } }));
    return res.Item || null;
  }
  return mem[table]?.find(i => i.id === id) || null;
};

export const dbScan = async (table, filterFn = null) => {
  if (USE_DYNAMO) {
    const res   = await docClient.send(new ScanCommand({ TableName: table }));
    const items = res.Items || [];
    return filterFn ? items.filter(filterFn) : items;
  }
  const items = mem[table] || [];
  return filterFn ? items.filter(filterFn) : [...items];
};

export const dbDelete = async (table, id) => {
  if (USE_DYNAMO) {
    await docClient.send(new DeleteCommand({ TableName: table, Key: { id } }));
    return true;
  }
  if (!mem[table]) return false;
  const idx = mem[table].findIndex(i => i.id === id);
  if (idx >= 0) mem[table].splice(idx, 1);
  return true;
};

export const dbUpdate = async (table, id, updates) => {
  if (USE_DYNAMO) {
    const keys = Object.keys(updates);
    if (!keys.length) return dbGet(table, id);
    const expr   = 'SET ' + keys.map((k, i) => `#k${i} = :v${i}`).join(', ');
    const names  = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
    const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
    const res = await docClient.send(new UpdateCommand({
      TableName:                 table,
      Key:                       { id },
      UpdateExpression:          expr,
      ExpressionAttributeNames:  names,
      ExpressionAttributeValues: values,
      ReturnValues:              'ALL_NEW',
    }));
    return res.Attributes;
  }
  if (!mem[table]) return null;
  const idx = mem[table].findIndex(i => i.id === id);
  if (idx < 0) return null;
  mem[table][idx] = { ...mem[table][idx], ...updates };
  return mem[table][idx];
};

// ══════════════════════════════════════════════════════════════
// CONVERSATION HELPERS — per-customer storage
//
// DynamoDB structure:
//   crm_conversations  — one item per customer
//     id              : UUID (partition key)
//     contact_id      : contact UUID
//     contact_phone   : phone number (for fast lookup by phone)
//     last_message    : last message text
//     last_message_at : ISO timestamp
//     unread_count    : number of unread messages
//     status          : open | pending | resolved
//
//   crm_messages — one item per message
//     id              : UUID (partition key)
//     conversation_id : which conversation this belongs to
//     contact_phone   : phone (for per-customer queries)
//     sender          : 'agent' | 'contact'
//     content         : message text
//     type            : text | image | document | audio
//     status          : sent | delivered | read | received
//     meta_message_id : WhatsApp message ID from Meta
//     created_at      : ISO timestamp
// ══════════════════════════════════════════════════════════════

// Find conversation by customer phone number
export const getConversationByPhone = async (phone) => {
  const convs = await dbScan(TABLES.CONVERSATIONS, c => c.contact_phone === phone);
  return convs[0] || null;
};

// Get all messages for a conversation sorted oldest → newest
export const getMessagesByConversation = async (conversationId) => {
  const msgs = await dbScan(
    TABLES.MESSAGES,
    m => m.conversation_id === conversationId || m.chatId === conversationId
  );
  return msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

// Update conversation's last message preview
export const updateConversationLastMessage = async (conversationId, content, incrementUnread = false) => {
  const conv = await dbGet(TABLES.CONVERSATIONS, conversationId);
  if (!conv) return;
  const updates = {
    last_message:    content,
    last_message_at: new Date().toISOString(),
    updated_at:      new Date().toISOString(),
  };
  if (incrementUnread) {
    updates.unread_count = (conv.unread_count || 0) + 1;
  }
  return dbUpdate(TABLES.CONVERSATIONS, conversationId, updates);
};

// ══════════════════════════════════════════════════════════════
// IN-MEMORY FALLBACK DATA
// ══════════════════════════════════════════════════════════════
const mem = {
  [TABLES.USERS]: [
    { id: 'user-1', name: 'Admin',   email: 'admin@crm.com',  password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O', role: 'admin', is_active: true, created_at: new Date().toISOString() },
    { id: 'user-2', name: 'Agent 1', email: 'agent1@crm.com', password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O', role: 'agent', is_active: true, created_at: new Date().toISOString() },
  ],
  [TABLES.CONTACTS]: [
    { id: '1', name: 'Rahul Sharma', phone: '+919876543210', tags: ['VIP','Retail'],     is_online: true,  pipeline_status: 'lead',      stage_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Priya Patel',  phone: '+918765432109', tags: ['New'],              is_online: false, last_seen: '2 hours ago',      pipeline_status: 'prospect',  stage_id: '2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Amit Kumar',   phone: '+917654321098', tags: ['Enterprise'],       is_online: true,  pipeline_status: 'qualified', stage_id: '3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', name: 'Sneha Reddy',  phone: '+916543210987', tags: ['Retail'],           is_online: false, last_seen: '30 min ago',       pipeline_status: 'lead',      stage_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '5', name: 'Vikram Singh', phone: '+915432109876', tags: ['VIP','Enterprise'], is_online: true,  pipeline_status: 'closed',    stage_id: '4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  [TABLES.CONVERSATIONS]: [
    { id: '1', contact_id: '1', contact_phone: '+919876543210', status: 'open',    assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, unread_count: 0, last_message: 'Perfect! We have a plan built for retail.', last_message_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', contact_id: '2', contact_phone: '+918765432109', status: 'pending', assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, unread_count: 1, last_message: 'Can you send me the pricing details?',      last_message_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', contact_id: '3', contact_phone: '+917654321098', status: 'open',    assigned_agent: null,     channel: 'whatsapp', pushed_to_admin: false, unread_count: 0, last_message: '',                                          last_message_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  [TABLES.MESSAGES]: [
    { id: 'm1', conversation_id: '1', chatId: '1', contact_phone: '+919876543210', content: 'Hi! I am interested in your CRM solutions.',             sender: 'contact', status: 'read',      type: 'text', timestamp: '10:00 AM', created_at: new Date(Date.now() - 900000).toISOString() },
    { id: 'm2', conversation_id: '1', chatId: '1', contact_phone: '+919876543210', content: 'Hello Rahul! Happy to help. What are you looking for?', sender: 'agent',   status: 'read',      type: 'text', timestamp: '10:02 AM', created_at: new Date(Date.now() - 780000).toISOString() },
    { id: 'm3', conversation_id: '1', chatId: '1', contact_phone: '+919876543210', content: 'I need a CRM for my retail business with WhatsApp.',    sender: 'contact', status: 'read',      type: 'text', timestamp: '10:05 AM', created_at: new Date(Date.now() - 600000).toISOString() },
    { id: 'm4', conversation_id: '1', chatId: '1', contact_phone: '+919876543210', content: 'Perfect! We have a plan built for retail.',             sender: 'agent',   status: 'delivered', type: 'text', timestamp: '10:06 AM', created_at: new Date(Date.now() - 480000).toISOString() },
    { id: 'm5', conversation_id: '2', chatId: '2', contact_phone: '+918765432109', content: 'Can you send me the pricing details?',                  sender: 'contact', status: 'received',  type: 'text', timestamp: '09:30 AM', created_at: new Date(Date.now() - 300000).toISOString() },
  ],
  [TABLES.NOTES]:    [{ id: 'n1', conversation_id: '1', agent_id: 'user-2', note: 'Customer interested in retail plan.', created_at: new Date().toISOString() }],
  [TABLES.REMINDERS]: [
    { id: 'r1', title: 'Follow up with Rahul',  description: 'Check on product demo feedback', due_date: new Date(Date.now() + 86400000).toISOString(),  status: 'pending', priority: 'high',   contact_id: '1', agent_id: 'user-2', created_at: new Date().toISOString() },
    { id: 'r2', title: 'Send proposal to Amit', description: 'Enterprise plan proposal',       due_date: new Date(Date.now() + 172800000).toISOString(), status: 'pending', priority: 'medium', contact_id: '3', agent_id: 'user-2', created_at: new Date().toISOString() },
  ],
  [TABLES.CAMPAIGNS]: [
    { id: 'c1', name: 'Welcome Campaign', template_name: 'welcome_message', status: 'sent',  contact_count: 120, sent_count: 118, created_at: new Date().toISOString() },
    { id: 'c2', name: 'Diwali Offer',     template_name: 'diwali_sale',     status: 'draft', contact_count: 500, sent_count: 0,   created_at: new Date().toISOString() },
  ],
  [TABLES.PIPELINE_STAGES]: [
    { id: '1', name: 'New Lead',   color: 'blue',   position: 1 },
    { id: '2', name: 'Qualified',  color: 'yellow', position: 2 },
    { id: '3', name: 'Proposal',   color: 'orange', position: 3 },
    { id: '4', name: 'Closed Won', color: 'green',  position: 4 },
  ],
};
