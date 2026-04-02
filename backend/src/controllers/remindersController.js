import { db, generateId } from '../config/database.js';

export const getReminders = (req, res) => {
  const { status } = req.query;
  const reminders = status ? db.reminders.filter(r => r.status === status) : db.reminders;
  res.json({ success: true, data: reminders });
};

export const createReminder = (req, res) => {
  const { title, description, due_date, priority, contact_id } = req.body;
  if (!title || !due_date) return res.status(400).json({ success: false, message: 'Title and due date are required' });
  const reminder = { id: generateId(), title, description, due_date: new Date(due_date), priority: priority || 'medium', status: 'pending', contact_id, created_at: new Date() };
  db.reminders.push(reminder);
  res.status(201).json({ success: true, data: reminder, message: 'Reminder created successfully' });
};

export const updateReminder = (req, res) => {
  const index = db.reminders.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });
  db.reminders[index] = { ...db.reminders[index], ...req.body };
  res.json({ success: true, data: db.reminders[index], message: 'Reminder updated successfully' });
};

export const deleteReminder = (req, res) => {
  const index = db.reminders.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });
  db.reminders.splice(index, 1);
  res.json({ success: true, message: 'Reminder deleted successfully' });
};

export const completeReminder = (req, res) => {
  const index = db.reminders.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });
  db.reminders[index].status = 'completed';
  res.json({ success: true, data: db.reminders[index], message: 'Reminder marked as complete' });
};
