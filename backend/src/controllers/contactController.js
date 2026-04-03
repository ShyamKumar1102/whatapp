import { TABLES, dbScan, dbGet, dbPut, dbUpdate, dbDelete, generateId } from '../config/database.js';

export const getContacts = async (req, res) => {
  const data = await dbScan(TABLES.CONTACTS);
  res.json({ success: true, data });
};

export const getContact = async (req, res) => {
  const contact = await dbGet(TABLES.CONTACTS, req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: contact });
};

export const createContact = async (req, res) => {
  const { name, phone, tags } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' });
  const existing = await dbScan(TABLES.CONTACTS, c => c.phone === phone);
  if (existing.length) return res.status(409).json({ success: false, message: 'Phone already exists' });
  const contact = { id: generateId(), name, phone, tags: tags || [], is_online: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await dbPut(TABLES.CONTACTS, contact);
  res.status(201).json({ success: true, data: contact, message: 'Contact created successfully' });
};

export const updateContact = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { ...req.body, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: updated, message: 'Contact updated successfully' });
};

export const deleteContact = async (req, res) => {
  await dbDelete(TABLES.CONTACTS, req.params.id);
  res.json({ success: true, message: 'Contact deleted successfully' });
};
