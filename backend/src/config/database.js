// In-memory store — replaced by PostgreSQL in production (see schema.sql)
export const db = {
  users: [
    // Default admin — password: Admin@1234
    {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@crm.com',
      password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
    },
    {
      id: 'user-2',
      name: 'Agent 1',
      email: 'agent1@crm.com',
      password_hash: '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O',
      role: 'agent',
      is_active: true,
      created_at: new Date(),
    },
  ],
  contacts: [
    { id: '1', name: 'Rahul Sharma',  phone: '+919876543210', tags: ['VIP', 'Retail'],       is_online: true,  pipeline_status: 'lead',      stage_id: 1, created_at: new Date(), updated_at: new Date() },
    { id: '2', name: 'Priya Patel',   phone: '+918765432109', tags: ['New'],                  is_online: false, last_seen: '2 hours ago',      pipeline_status: 'prospect',  stage_id: 2, created_at: new Date(), updated_at: new Date() },
    { id: '3', name: 'Amit Kumar',    phone: '+917654321098', tags: ['Enterprise'],           is_online: true,  pipeline_status: 'qualified', stage_id: 3, created_at: new Date(), updated_at: new Date() },
    { id: '4', name: 'Sneha Reddy',   phone: '+916543210987', tags: ['Retail'],               is_online: false, last_seen: '30 min ago',       pipeline_status: 'lead',      stage_id: 1, created_at: new Date(), updated_at: new Date() },
    { id: '5', name: 'Vikram Singh',  phone: '+915432109876', tags: ['VIP', 'Enterprise'],   is_online: true,  pipeline_status: 'closed',    stage_id: 4, created_at: new Date(), updated_at: new Date() },
  ],
  conversations: [
    { id: '1', contact_id: '1', status: 'open',    assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date(), updated_at: new Date() },
    { id: '2', contact_id: '2', status: 'pending', assigned_agent: 'user-2', channel: 'whatsapp', pushed_to_admin: false, created_at: new Date(), updated_at: new Date() },
    { id: '3', contact_id: '3', status: 'open',    assigned_agent: null,     channel: 'whatsapp', pushed_to_admin: false, created_at: new Date(), updated_at: new Date() },
  ],
  messages: [
    { id: 'm1', conversation_id: '1', chatId: '1', content: 'Hi! I am interested in your CRM solutions.',              sender: 'contact', status: 'read',      type: 'text', timestamp: '10:00 AM', created_at: new Date() },
    { id: 'm2', conversation_id: '1', chatId: '1', content: 'Hello Rahul! Happy to help. What are you looking for?',  sender: 'agent',   status: 'read',      type: 'text', timestamp: '10:02 AM', created_at: new Date() },
    { id: 'm3', conversation_id: '1', chatId: '1', content: 'I need a CRM for my retail business with WhatsApp.',     sender: 'contact', status: 'read',      type: 'text', timestamp: '10:05 AM', created_at: new Date() },
    { id: 'm4', conversation_id: '1', chatId: '1', content: 'Perfect! We have a plan built exactly for retail. Let me send you the details.', sender: 'agent', status: 'delivered', type: 'text', timestamp: '10:06 AM', created_at: new Date() },
    { id: 'm5', conversation_id: '2', chatId: '2', content: 'Can you send me the pricing details?',                   sender: 'contact', status: 'received',  type: 'text', timestamp: '09:30 AM', created_at: new Date() },
  ],
  notes: [
    { id: 'n1', conversation_id: '1', agent_id: 'user-2', note: 'Customer is interested in the retail plan. Follow up with pricing.', created_at: new Date() },
  ],
  pipeline_stages: [
    { id: 1, name: 'New Lead',    color: 'blue',   position: 1 },
    { id: 2, name: 'Qualified',   color: 'yellow', position: 2 },
    { id: 3, name: 'Proposal',    color: 'orange', position: 3 },
    { id: 4, name: 'Closed Won',  color: 'green',  position: 4 },
  ],
  reminders: [
    { id: 'r1', title: 'Follow up with Rahul',   description: 'Check on product demo feedback', due_date: new Date(Date.now() + 86400000),  status: 'pending', priority: 'high',   contact_id: '1', agent_id: 'user-2', created_at: new Date() },
    { id: 'r2', title: 'Send proposal to Amit',  description: 'Enterprise plan proposal',       due_date: new Date(Date.now() + 172800000), status: 'pending', priority: 'medium', contact_id: '3', agent_id: 'user-2', created_at: new Date() },
  ],
  campaigns: [
    { id: 'c1', name: 'Welcome Campaign', template_name: 'welcome_message', status: 'sent',  contact_count: 120, sent_count: 118, created_at: new Date() },
    { id: 'c2', name: 'Diwali Offer',     template_name: 'diwali_sale',     status: 'draft', contact_count: 500, sent_count: 0,   scheduled_at: null, created_at: new Date() },
  ],
};

let _id = 200;
export const generateId = () => String(++_id);
