import { db, generateId } from '../config/database.js';
import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage() });

export const exportContacts = (req, res) => {
  const headers = 'id,name,phone,tags,is_online\n';
  const rows = db.contacts.map(c =>
    `${c.id},"${c.name}","${c.phone}","${(c.tags || []).join(';')}",${c.is_online}`
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
  res.send(headers + rows);
};

export const importContacts = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const csv = req.file.buffer.toString('utf8');
    const lines = csv.split('\n').filter(Boolean);
    const headers = lines[0].split(',');
    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const contact = {
        id: generateId(),
        name: values[1]?.replace(/"/g, '') || '',
        phone: values[2]?.replace(/"/g, '') || '',
        tags: values[3]?.replace(/"/g, '').split(';').filter(Boolean) || [],
        is_online: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      if (contact.name && contact.phone) {
        db.contacts.push(contact);
        imported.push(contact);
      }
    }
    res.json({ success: true, message: `${imported.length} contacts imported`, data: imported });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error parsing CSV', error: error.message });
  }
};

export const downloadTemplate = (req, res) => {
  const template = 'name,phone,tags\n"John Doe","+91 98765 43210","VIP;Retail"\n"Jane Smith","+91 87654 32109","New"';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.csv');
  res.send(template);
};
