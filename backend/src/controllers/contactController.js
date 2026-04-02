import { db, generateId } from '../config/database.js';

export const getContacts = (req, res) => {
  res.json({ success: true, data: db.contacts });
};

export const getContact = (req, res) => {
  const contact = db.contacts.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: contact });
};

export const createContact = (req, res) => {
  const { name, phone, tags } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' });
  const contact = { id: generateId(), name, phone, tags: tags || [], is_online: false, created_at: new Date(), updated_at: new Date() };
  db.contacts.push(contact);
  res.status(201).json({ success: true, data: contact, message: 'Contact created successfully' });
};

export const updateContact = (req, res) => {
  const index = db.contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  db.contacts[index] = { ...db.contacts[index], ...req.body, updated_at: new Date() };
  res.json({ success: true, data: db.contacts[index], message: 'Contact updated successfully' });
};

export const deleteContact = (req, res) => {
  const index = db.contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  db.contacts.splice(index, 1);
  res.json({ success: true, message: 'Contact deleted successfully' });
};
