import { config } from 'dotenv';
config();

// dynamic import so dotenv runs first
const { TABLES, dbPut, generateId } = await import('./database.js');

const now = new Date().toISOString();

const contacts = [
  { id: generateId(), name: 'Rahul Sharma',  phone: '+919876543210', tags: ['VIP','Retail'],      is_online: true,  pipeline_status: 'lead',     stage_id: '1', created_at: now, updated_at: now },
  { id: generateId(), name: 'Priya Patel',   phone: '+918765432109', tags: ['New'],               is_online: false, last_seen: '2 hours ago',    pipeline_status: 'prospect', stage_id: '2', created_at: now, updated_at: now },
  { id: generateId(), name: 'Amit Kumar',    phone: '+917654321098', tags: ['Enterprise'],        is_online: true,  pipeline_status: 'qualified',stage_id: '3', created_at: now, updated_at: now },
  { id: generateId(), name: 'Sneha Reddy',   phone: '+916543210987', tags: ['Retail'],            is_online: false, last_seen: '30 min ago',     pipeline_status: 'lead',     stage_id: '1', created_at: now, updated_at: now },
  { id: generateId(), name: 'Vikram Singh',  phone: '+915432109876', tags: ['VIP','Enterprise'],  is_online: true,  pipeline_status: 'closed',   stage_id: '4', created_at: now, updated_at: now },
];

const stages = [
  { id: '1', name: 'New Lead',   color: 'blue',   position: 1 },
  { id: '2', name: 'Qualified',  color: 'yellow', position: 2 },
  { id: '3', name: 'Proposal',   color: 'orange', position: 3 },
  { id: '4', name: 'Closed Won', color: 'green',  position: 4 },
];

const run = async () => {
  console.log('\n🌱 Seeding DynamoDB...\n');

  for (const s of stages) {
    await dbPut(TABLES.PIPELINE_STAGES, s);
    console.log(`✅ Stage: ${s.name}`);
  }

  const convIds = [];
  for (const c of contacts) {
    await dbPut(TABLES.CONTACTS, c);
    console.log(`✅ Contact: ${c.name}`);

    const convId = generateId();
    convIds.push({ convId, contact: c });
    await dbPut(TABLES.CONVERSATIONS, {
      id: convId, contact_id: c.id, status: 'open',
      channel: 'whatsapp', pushed_to_admin: false,
      created_at: now, updated_at: now,
    });
  }

  for (const { convId, contact } of convIds.slice(0, 2)) {
    await dbPut(TABLES.MESSAGES, {
      id: generateId(), chatId: convId, conversation_id: convId,
      content: `Hi! I am interested in your services.`,
      sender: 'contact', status: 'read', type: 'text',
      timestamp: '10:00 AM', created_at: now,
    });
    await dbPut(TABLES.MESSAGES, {
      id: generateId(), chatId: convId, conversation_id: convId,
      content: `Hello ${contact.name}! Happy to help. What are you looking for?`,
      sender: 'agent', status: 'delivered', type: 'text',
      timestamp: '10:02 AM', created_at: now,
    });
  }

  // Seed admin user (password: admin123)
  await dbPut(TABLES.USERS, {
    id: 'user-1', name: 'Admin', email: 'admin@crm.com',
    password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O',
    role: 'admin', is_active: true, created_at: now,
  });
  await dbPut(TABLES.USERS, {
    id: 'user-2', name: 'Agent 1', email: 'agent1@crm.com',
    password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O',
    role: 'agent', is_active: true, created_at: now,
  });

  console.log('\n✅ Seed complete! Login: admin@crm.com / admin123\n');
  process.exit(0);
};

run().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
