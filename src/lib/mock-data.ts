export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  tags: string[];
  lastSeen?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

export interface Chat {
  id: string;
  contact: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  assignedAgent?: string;
  isTyping?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sent' | 'pending';
  contactCount: number;
  sentCount: number;
  scheduledAt?: string;
  createdAt: string;
  template?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  body: string;
  createdAt: string;
}

export const contacts: Contact[] = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', tags: ['VIP', 'Retail'], isOnline: true },
  { id: '2', name: 'Priya Patel', phone: '+91 87654 32109', tags: ['New'], isOnline: false, lastSeen: '2 hours ago' },
  { id: '3', name: 'Amit Kumar', phone: '+91 76543 21098', tags: ['Enterprise'], isOnline: true },
  { id: '4', name: 'Sneha Reddy', phone: '+91 65432 10987', tags: ['Retail'], isOnline: false, lastSeen: '30 min ago' },
  { id: '5', name: 'Vikram Singh', phone: '+91 54321 09876', tags: ['VIP', 'Enterprise'], isOnline: true },
  { id: '6', name: 'Ananya Gupta', phone: '+91 43210 98765', tags: ['New'], isOnline: false, lastSeen: '1 hour ago' },
  { id: '7', name: 'Rajesh Nair', phone: '+91 32109 87654', tags: ['Retail'], isOnline: false, lastSeen: '5 hours ago' },
  { id: '8', name: 'Meera Joshi', phone: '+91 21098 76543', tags: ['Enterprise', 'VIP'], isOnline: true },
];

export const chats: Chat[] = [
  { id: '1', contact: contacts[0], lastMessage: 'Thanks for the update! Will check it out.', lastMessageTime: '2 min ago', unreadCount: 3, assignedAgent: 'Agent 1' },
  { id: '2', contact: contacts[1], lastMessage: 'Can you send me the pricing details?', lastMessageTime: '15 min ago', unreadCount: 1 },
  { id: '3', contact: contacts[2], lastMessage: 'The demo was excellent, let\'s proceed with the setup.', lastMessageTime: '1 hour ago', unreadCount: 0, assignedAgent: 'Agent 2' },
  { id: '4', contact: contacts[3], lastMessage: 'Order confirmed! When will it be delivered?', lastMessageTime: '3 hours ago', unreadCount: 0 },
  { id: '5', contact: contacts[4], lastMessage: 'Looking forward to our business partnership!', lastMessageTime: '5 hours ago', unreadCount: 2, assignedAgent: 'Agent 1' },
  { id: '6', contact: contacts[5], lastMessage: 'Hi, I need help setting up my account', lastMessageTime: 'Yesterday', unreadCount: 0 },
  { id: '7', contact: contacts[6], lastMessage: 'Payment completed successfully, thank you!', lastMessageTime: 'Yesterday', unreadCount: 0, assignedAgent: 'Agent 3' },
  { id: '8', contact: contacts[7], lastMessage: 'Please share the implementation timeline', lastMessageTime: '2 days ago', unreadCount: 0 },
];

export const messages: Message[] = [
  { id: '1', chatId: '1', content: 'Hi! I\'m interested in your CRM solutions.', timestamp: '10:00 AM', sender: 'contact', status: 'read', type: 'text' },
  { id: '2', chatId: '1', content: 'Hello Rahul! Thank you for your interest. I\'d be happy to help you with our CRM solutions.', timestamp: '10:02 AM', sender: 'user', status: 'read', type: 'text' },
  { id: '3', chatId: '1', content: 'What features do you offer for small businesses?', timestamp: '10:05 AM', sender: 'contact', status: 'read', type: 'text' },
  { id: '4', chatId: '1', content: 'We offer contact management, automated messaging, analytics, and integration with WhatsApp Business API. Let me send you our feature list.', timestamp: '10:06 AM', sender: 'user', status: 'delivered', type: 'text' },
  { id: '5', chatId: '1', content: 'That sounds perfect for our needs!', timestamp: '10:10 AM', sender: 'contact', status: 'read', type: 'text' },
  { id: '6', chatId: '1', content: 'Great! We have a special 20% discount for new customers this month 🎉', timestamp: '10:12 AM', sender: 'user', status: 'delivered', type: 'text' },
  { id: '7', chatId: '1', content: 'Thanks for the update! Will check it out.', timestamp: '10:15 AM', sender: 'contact', status: 'read', type: 'text' },
];

export const campaigns: Campaign[] = [
  { id: '1', name: 'Diwali Sale 2024', status: 'sent', contactCount: 1250, sentCount: 1230, createdAt: '2024-10-15', template: 'diwali_sale' },
  { id: '2', name: 'New Year Greetings', status: 'scheduled', contactCount: 2000, sentCount: 0, scheduledAt: '2025-01-01', createdAt: '2024-12-20', template: 'new_year' },
  { id: '3', name: 'Product Launch Announcement', status: 'draft', contactCount: 500, sentCount: 0, createdAt: '2024-12-28', template: 'product_launch' },
  { id: '4', name: 'Feedback Collection', status: 'pending', contactCount: 800, sentCount: 0, createdAt: '2024-12-25', template: 'feedback' },
  { id: '5', name: 'Holiday Offers', status: 'sent', contactCount: 3000, sentCount: 2980, createdAt: '2024-12-24', template: 'holiday_offers' },
];

export const templates: Template[] = [
  { id: '1', name: 'Welcome Message', category: 'Marketing', language: 'English', status: 'approved', body: 'Hello {{1}}! Welcome to our service. We\'re excited to have you on board! 🎉', createdAt: '2024-11-01' },
  { id: '2', name: 'Order Confirmation', category: 'Utility', language: 'English', status: 'approved', body: 'Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}', createdAt: '2024-11-15' },
  { id: '3', name: 'Payment Reminder', category: 'Utility', language: 'English', status: 'pending', body: 'Dear {{1}}, your payment of ₹{{2}} is due on {{3}}. Please make the payment to avoid late fees.', createdAt: '2024-12-01' },
  { id: '4', name: 'Promotional Offer', category: 'Marketing', language: 'English', status: 'rejected', body: 'Hi {{1}}! Get flat {{2}}% off on all products. Use code: {{3}}. Limited time offer!', createdAt: '2024-12-10' },
  { id: '5', name: 'Appointment Reminder', category: 'Utility', language: 'English', status: 'approved', body: 'Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}. Reply YES to confirm.', createdAt: '2024-12-15' },
];

export const dashboardStats = {
  totalMessages: 12450,
  activeChats: 28,
  campaigns: 15,
  responseTime: '2.5 min',
  messagesGrowth: 12.5,
  chatsGrowth: 8.3,
  campaignsGrowth: -3.2,
  responseTimeGrowth: -15.0,
};

export const chartData = [
  { name: 'Mon', sent: 420, received: 380 },
  { name: 'Tue', sent: 380, received: 340 },
  { name: 'Wed', sent: 510, received: 460 },
  { name: 'Thu', sent: 470, received: 420 },
  { name: 'Fri', sent: 540, received: 490 },
  { name: 'Sat', sent: 320, received: 280 },
  { name: 'Sun', sent: 280, received: 250 },
];

export const agentPerformance = [
  { name: 'Agent 1', chats: 45, avgResponse: '1.8 min', satisfaction: 94 },
  { name: 'Agent 2', chats: 38, avgResponse: '2.1 min', satisfaction: 91 },
  { name: 'Agent 3', chats: 32, avgResponse: '3.0 min', satisfaction: 87 },
  { name: 'Agent 4', chats: 28, avgResponse: '2.5 min', satisfaction: 90 },
];
