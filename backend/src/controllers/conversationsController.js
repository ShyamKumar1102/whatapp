import { db, generateId } from '../config/database.js';

export const getConversation = (req, res) => {
  const conversation = db.conversations.find(c => c.id === req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  const messages = db.messages.filter(m => m.conversation_id === req.params.id);
  const contact = db.contacts.find(c => c.id === conversation.contact_id);
  res.json({ success: true, data: { ...conversation, messages, contact } });
};

export const sendMessage = (req, res) => {
  const { content, type } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
  const message = { id: generateId(), conversation_id: req.params.id, content, sender: 'agent', status: 'sent', type: type || 'text', created_at: new Date() };
  db.messages.push(message);
  res.status(201).json({ success: true, data: message });
};

export const updateConversationStatus = (req, res) => {
  const index = db.conversations.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Conversation not found' });
  db.conversations[index].status = req.body.status;
  db.conversations[index].updated_at = new Date();
  res.json({ success: true, data: db.conversations[index], message: 'Status updated' });
};

export const assignAgent = (req, res) => {
  const index = db.conversations.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Conversation not found' });
  db.conversations[index].assigned_agent = req.body.agent;
  res.json({ success: true, data: db.conversations[index], message: 'Agent assigned' });
};

export const addNote = (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ success: false, message: 'Note content is required' });
  const newNote = { id: generateId(), conversation_id: req.params.id, note, agent_id: 1, created_at: new Date() };
  db.notes.push(newNote);
  res.status(201).json({ success: true, data: newNote });
};

export const getNotes = (req, res) => {
  const notes = db.notes.filter(n => n.conversation_id === req.params.id);
  res.json({ success: true, data: notes });
};

export const pushToAdmin = (req, res) => {
  const index = db.conversations.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Conversation not found' });
  db.conversations[index].status = 'pending';
  db.conversations[index].pushed_to_admin = true;
  db.conversations[index].updated_at = new Date();
  res.json({ success: true, message: 'Conversation pushed to admin queue' });
};
