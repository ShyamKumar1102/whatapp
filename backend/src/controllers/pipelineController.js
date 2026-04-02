import { db, generateId } from '../config/database.js';

export const getPipeline = (req, res) => {
  const stagesWithContacts = db.pipeline_stages.map(stage => ({
    ...stage,
    contacts: db.contacts.filter(c => c.stage_id === stage.id)
  }));
  res.json({ success: true, data: { stages: stagesWithContacts, totalContacts: db.contacts.length } });
};

export const getStages = (req, res) => {
  res.json({ success: true, data: db.pipeline_stages });
};

export const createStage = (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Stage name is required' });
  const stage = { id: generateId(), name, color: color || 'grey', position: db.pipeline_stages.length + 1 };
  db.pipeline_stages.push(stage);
  res.status(201).json({ success: true, data: stage, message: 'Stage created successfully' });
};

export const moveContactToStage = (req, res) => {
  const index = db.contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  db.contacts[index] = { ...db.contacts[index], stage_id: req.body.stage_id, updated_at: new Date() };
  res.json({ success: true, data: db.contacts[index], message: 'Contact moved successfully' });
};

export const updateContactPipelineStatus = (req, res) => {
  const index = db.contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  db.contacts[index] = { ...db.contacts[index], pipeline_status: req.body.pipeline_status, updated_at: new Date() };
  res.json({ success: true, data: db.contacts[index], message: 'Status updated successfully' });
};
