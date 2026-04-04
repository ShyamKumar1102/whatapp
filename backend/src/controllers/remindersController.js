import { TABLES, dbScan, dbPut, dbUpdate, dbDelete, generateId } from '../config/database.js';

export const getReminders = async (req, res) => {
  const { status } = req.query;
  const all = await dbScan(TABLES.REMINDERS);
  const data = status ? all.filter(r => r.status === status) : all;
  res.json({ success: true, data });
};

export const createReminder = async (req, res) => {
  const { title, description, due_date, priority, contact_id, type, amount } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
  const reminder = { id: generateId(), title, description: description || '', due_date: due_date || null, priority: priority || 'medium', status: 'pending', contact_id: contact_id || null, agent_id: req.user?.id || 'unknown', type: type || 'general', amount: amount || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await dbPut(TABLES.REMINDERS, reminder);
  res.status(201).json({ success: true, data: reminder, message: 'Reminder created successfully' });
};

export const updateReminder = async (req, res) => {
  const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Reminder not found' });
  res.json({ success: true, data: updated, message: 'Reminder updated successfully' });
};

export const deleteReminder = async (req, res) => {
  await dbDelete(TABLES.REMINDERS, req.params.id);
  res.json({ success: true, message: 'Reminder deleted successfully' });
};

export const completeReminder = async (req, res) => {
  const updated = await dbUpdate(TABLES.REMINDERS, req.params.id, { status: 'completed' });
  if (!updated) return res.status(404).json({ success: false, message: 'Reminder not found' });
  res.json({ success: true, data: updated, message: 'Reminder marked as complete' });
};
