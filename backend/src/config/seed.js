import { connectDB } from './database.js';
import { Contact, Chat, Message, Pipeline, PipelineActivity } from '../models/index.js';

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    await PipelineActivity.destroy({ where: {} });
    await Pipeline.destroy({ where: {} });
    await Message.destroy({ where: {} });
    await Chat.destroy({ where: {} });
    await Contact.destroy({ where: {} });

    // Seed Contacts
    const contacts = await Contact.bulkCreate([
      {
        name: 'John Smith',
        phone: '+1234567890',
        email: 'john.smith@example.com',
        status: 'active',
        tags: ['customer', 'vip'],
        notes: 'Important client from TechCorp'
      },
      {
        name: 'Sarah Johnson',
        phone: '+1234567891',
        email: 'sarah.johnson@startup.com',
        status: 'active',
        tags: ['lead', 'startup'],
        notes: 'Interested in marketing automation'
      },
      {
        name: 'Mike Wilson',
        phone: '+1234567892',
        email: 'mike.wilson@global.com',
        status: 'active',
        tags: ['enterprise', 'decision-maker'],
        notes: 'CTO at Global Solutions'
      },
      {
        name: 'Emma Davis',
        phone: '+1234567893',
        email: 'emma.davis@local.com',
        status: 'active',
        tags: ['small-business'],
        notes: 'Local business owner'
      },
      {
        name: 'Alex Brown',
        phone: '+1234567894',
        email: 'alex.brown@company.com',
        status: 'active',
        tags: ['prospect'],
        notes: 'Potential customer'
      }
    ]);

    console.log(`✅ Created ${contacts.length} contacts`);

    // Seed Pipeline Deals
    const pipelines = await Pipeline.bulkCreate([
      {
        title: 'Enterprise Software License',
        company: 'TechCorp Inc.',
        contact_person: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1234567890',
        value: 45000.00,
        stage: 'proposal',
        priority: 'high',
        probability: 75,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        assigned_to: 'Sales Team',
        source: 'Website',
        tags: ['enterprise', 'software'],
        notes: 'Large enterprise deal with high potential'
      },
      {
        title: 'Marketing Automation Setup',
        company: 'StartupXYZ',
        contact_person: 'Sarah Johnson',
        email: 'sarah.johnson@startup.com',
        phone: '+1234567891',
        value: 12500.00,
        stage: 'qualified',
        priority: 'medium',
        probability: 60,
        expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        assigned_to: 'Marketing Team',
        source: 'Referral',
        tags: ['marketing', 'automation'],
        notes: 'Startup looking for marketing automation solution'
      },
      {
        title: 'Cloud Migration Project',
        company: 'Global Solutions',
        contact_person: 'Mike Wilson',
        email: 'mike.wilson@global.com',
        phone: '+1234567892',
        value: 78000.00,
        stage: 'negotiation',
        priority: 'high',
        probability: 85,
        expected_close_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        assigned_to: 'Technical Team',
        source: 'Cold Outreach',
        tags: ['cloud', 'migration'],
        notes: 'Complex cloud migration project'
      },
      {
        title: 'CRM Integration',
        company: 'Local Business',
        contact_person: 'Emma Davis',
        email: 'emma.davis@local.com',
        phone: '+1234567893',
        value: 8900.00,
        stage: 'lead',
        priority: 'low',
        probability: 25,
        expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        assigned_to: 'Sales Team',
        source: 'Social Media',
        tags: ['crm', 'integration'],
        notes: 'Small business CRM needs'
      },
      {
        title: 'E-commerce Platform',
        company: 'Online Store Co.',
        contact_person: 'Alex Brown',
        email: 'alex.brown@company.com',
        phone: '+1234567894',
        value: 25000.00,
        stage: 'closed_won',
        priority: 'medium',
        probability: 100,
        expected_close_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        assigned_to: 'Development Team',
        source: 'Partner',
        tags: ['ecommerce', 'platform'],
        notes: 'Successfully closed e-commerce deal'
      }
    ]);

    console.log(`✅ Created ${pipelines.length} pipeline deals`);

    // Seed Pipeline Activities
    const activities = [];
    for (const pipeline of pipelines) {
      activities.push({
        pipeline_id: pipeline.id,
        action: 'Deal created',
        description: `New deal "${pipeline.title}" created`,
        user: pipeline.assigned_to,
        new_value: { stage: pipeline.stage, value: pipeline.value }
      });

      if (pipeline.stage !== 'lead') {
        activities.push({
          pipeline_id: pipeline.id,
          action: 'Stage changed',
          description: `Deal moved to ${pipeline.stage}`,
          user: pipeline.assigned_to,
          old_value: { stage: 'lead' },
          new_value: { stage: pipeline.stage }
        });
      }
    }

    await PipelineActivity.bulkCreate(activities);
    console.log(`✅ Created ${activities.length} pipeline activities`);

    // Seed Chats
    const chats = [];
    for (let i = 0; i < contacts.length; i++) {
      const chat = await Chat.create({
        contact_id: contacts[i].id,
        status: i % 3 === 0 ? 'resolved' : 'active',
        assigned_agent: i % 2 === 0 ? 'Agent Smith' : 'Agent Johnson',
        last_message: `Sample message from ${contacts[i].name}`,
        last_message_time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        unread_count: Math.floor(Math.random() * 5)
      });
      chats.push(chat);
    }

    console.log(`✅ Created ${chats.length} chats`);

    // Seed Messages
    const messages = [];
    for (const chat of chats) {
      const messageCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          chat_id: chat.id,
          content: `Sample message ${i + 1} for chat ${chat.id}`,
          type: 'text',
          sender: i % 2 === 0 ? 'contact' : 'agent',
          status: 'read',
          created_at: new Date(Date.now() - (messageCount - i) * 60 * 60 * 1000)
        });
      }
    }

    await Message.bulkCreate(messages);
    console.log(`✅ Created ${messages.length} messages`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();