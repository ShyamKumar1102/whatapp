import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// ── Table names ───────────────────────────────────────────────
export const TABLES = {
  USERS:          process.env.DYNAMO_TABLE_USERS          || 'crm_users',
  CONTACTS:       process.env.DYNAMO_TABLE_CONTACTS       || 'crm_contacts',
  CONVERSATIONS:  process.env.DYNAMO_TABLE_CONVERSATIONS  || 'crm_conversations',
  MESSAGES:       process.env.DYNAMO_TABLE_MESSAGES       || 'crm_messages',
  NOTES:          process.env.DYNAMO_TABLE_NOTES          || 'crm_notes',
  REMINDERS:      process.env.DYNAMO_TABLE_REMINDERS      || 'crm_reminders',
  CAMPAIGNS:      process.env.DYNAMO_TABLE_CAMPAIGNS      || 'crm_campaigns',
  PIPELINE_STAGES:process.env.DYNAMO_TABLE_PIPELINE       || 'crm_pipeline_stages',
};

// ── DynamoDB client ───────────────────────────────────────────
const USE_DYNAMO = !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let docClient = null;

if (USE_DYNAMO) {
  const raw = new DynamoDBClient({
    region:      process.env.AWS_REGION,
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
  console.log('⚠️  AWS credentials not set — using in-memory store (set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env)');
}

export const generateId = () => uuidv4();

// ══════════════════════════════════════════════════════════════
// DB HELPERS — auto-switch between DynamoDB and in-memory
// ══════════════════════════════════════════════════════════════

export const dbPut = async (table, item) => {
  if (USE_DYNAMO) {
    await docClient.send(new PutCommand({ TableName: table, Item: item }));
    return item;
  }
  // in-memory fallback
  const arr = mem[table];
  if (!arr) return item;
  const idx = arr.findIndex(i => i.id === item.id);
  if (idx >= 0) arr[idx] = item; else arr.push(item);
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
    const res = await docClient.send(new ScanCommand({ TableName: table }));
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
  const arr = mem[table];
  if (!arr) return false;
  const idx = arr.findIndex(i => i.id === id);
  if (idx >= 0) arr.splice(idx, 1);
  return true;
};

export const dbUpdate = async (table, id, updates) => {
  if (USE_DYNAMO) {
    const keys   = Object.keys(updates);
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
  const arr = mem[table];
  if (!arr) return null;
  const idx = arr.findIndex(i => i.id === id);
  if (idx < 0) return null;
  arr[idx] = { ...arr[idx], ...updates };
  return arr[idx];
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
    { id: '1', name: 'Rahul Sharma', phone: '+919876543210', tags: ['VIP','Retail'],     is_online: true,  pipeline_status: 'lead',     stage_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Priya Patel',  phone: '+918765432109', tags: ['New'],              is_online: false, last_seen: '2 hours ago',     pipeline_status: 'prospect', stage_id: '2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Amit Kumar',   phone: '+917654321098', tags: ['Enterprise'],       is_online: true,  pipeline_status: 'qualified', stage_id: '3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', name: 'Sneha Reddy',  phone: '+916543210987', tags: ['Retail'],           is_online: false, last_seen: '30 min ago',      pipeline_status: 'lead',     stage_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '5', name: 'Vikram Singh', phone: '+915432109876', tags: ['VIP','Enterprise'], is_online: true,  pipeline_status: 'closed',    stage_id: '4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  [TABLES.CONVERSATIONS]: [
    { id: '1', contact_id: '1', status: 'open',    assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', contact_id: '2', status: 'pending', assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', contact_id: '3', status: 'open',    assigned_agent: null,     channel: 'whatsapp', pushed_to_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  [TABLES.MESSAGES]: [
    { id: 'm1', conversation_id: '1', chatId: '1', content: 'Hi! I am interested in your CRM solutions.',             sender: 'contact', status: 'read',      type: 'text', timestamp: '10:00 AM', created_at: new Date().toISOString() },
    { id: 'm2', conversation_id: '1', chatId: '1', content: 'Hello Rahul! Happy to help. What are you looking for?', sender: 'agent',   status: 'read',      type: 'text', timestamp: '10:02 AM', created_at: new Date().toISOString() },
    { id: 'm3', conversation_id: '1', chatId: '1', content: 'I need a CRM for my retail business with WhatsApp.',    sender: 'contact', status: 'read',      type: 'text', timestamp: '10:05 AM', created_at: new Date().toISOString() },
    { id: 'm4', conversation_id: '1', chatId: '1', content: 'Perfect! We have a plan built for retail.',             sender: 'agent',   status: 'delivered', type: 'text', timestamp: '10:06 AM', created_at: new Date().toISOString() },
    { id: 'm5', conversation_id: '2', chatId: '2', content: 'Can you send me the pricing details?',                  sender: 'contact', status: 'received',  type: 'text', timestamp: '09:30 AM', created_at: new Date().toISOString() },
  ],
  [TABLES.NOTES]: [
    { id: 'n1', conversation_id: '1', agent_id: 'user-2', note: 'Customer interested in retail plan. Follow up with pricing.', created_at: new Date().toISOString() },
  ],
  [TABLES.REMINDERS]: [
    { id: 'r1', title: 'Follow up with Rahul',  description: 'Check on product demo feedback', due_date: new Date(Date.now() + 86400000).toISOString(),  status: 'pending', priority: 'high',   contact_id: '1', agent_id: 'user-2', created_at: new Date().toISOString() },
    { id: 'r2', title: 'Send proposal to Amit', description: 'Enterprise plan proposal',       due_date: new Date(Date.now() + 172800000).toISOString(), status: 'pending', priority: 'medium', contact_id: '3', agent_id: 'user-2', created_at: new Date().toISOString() },
  ],
  [TABLES.CAMPAIGNS]: [
    { id: 'c1', name: 'Welcome Campaign', template_name: 'welcome_message', status: 'sent',  contact_count: 120, sent_count: 118, created_at: new Date().toISOString() },
    { id: 'c2', name: 'Diwali Offer',     template_name: 'diwali_sale',     status: 'draft', contact_count: 500, sent_count: 0,   scheduled_at: null, created_at: new Date().toISOString() },
  ],
  [TABLES.PIPELINE_STAGES]: [
    { id: '1', name: 'New Lead',   color: 'blue',   position: 1 },
    { id: '2', name: 'Qualified',  color: 'yellow', position: 2 },
    { id: '3', name: 'Proposal',   color: 'orange', position: 3 },
    { id: '4', name: 'Closed Won', color: 'green',  position: 4 },
  ],
};
