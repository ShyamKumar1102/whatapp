import { TABLES, dbScan, dbGet, dbPut, dbUpdate, generateId } from '../config/database.js';

export const getConversation = async (req, res) => {
  const conversation = await dbGet(TABLES.CONVERSATIONS, req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  const messages = await dbScan(TABLES.MESSAGES, m => m.conversation_id === req.params.id);
  const contact = await dbGet(TABLES.CONTACTS, conversation.contact_id);
  res.json({ success: true, data: { ...conversation, messages, contact } });
};

export const sendMessage = async (req, res) => {
  const { content, type } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
  const message = { id: generateId(), conversation_id: req.params.id, chatId: req.params.id, content, sender: 'agent', status: 'sent', type: type || 'text', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), created_at: new Date().toISOString() };
  await dbPut(TABLES.MESSAGES, message);
  res.status(201).json({ success: true, data: message });
};

export const updateConversationStatus = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: req.body.status, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Conversation not found' });
  res.json({ success: true, data: updated, message: 'Status updated' });
};

export const assignAgent = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { assigned_agent: req.body.agent, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Conversation not found' });
  res.json({ success: true, data: updated, message: 'Agent assigned' });
};

export const addNote = async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ success: false, message: 'Note content is required' });
  const newNote = { id: generateId(), conversation_id: req.params.id, note, agent_id: req.user?.id || 'unknown', created_at: new Date().toISOString() };
  await dbPut(TABLES.NOTES, newNote);
  res.status(201).json({ success: true, data: newNote });
};

export const getNotes = async (req, res) => {
  const notes = await dbScan(TABLES.NOTES, n => n.conversation_id === req.params.id);
  res.json({ success: true, data: notes });
};

export const pushToAdmin = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONVERSATIONS, req.params.id, { status: 'pending', pushed_to_admin: true, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Conversation not found' });
  res.json({ success: true, message: 'Conversation pushed to admin queue' });
};
