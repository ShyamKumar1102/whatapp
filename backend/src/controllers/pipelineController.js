import { TABLES, dbScan, dbUpdate, dbPut, generateId } from '../config/database.js';

export const getPipeline = async (req, res) => {
  const stages = await dbScan(TABLES.PIPELINE_STAGES);
  const contacts = await dbScan(TABLES.CONTACTS);
  const sorted = stages.sort((a, b) => a.position - b.position);
  const data = sorted.map(s => ({ ...s, contacts: contacts.filter(c => c.stage_id === s.id) }));
  res.json({ success: true, data: { stages: data, totalContacts: contacts.length } });
};

export const getStages = async (req, res) => {
  const data = await dbScan(TABLES.PIPELINE_STAGES);
  res.json({ success: true, data });
};

export const createStage = async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Stage name is required' });
  const stages = await dbScan(TABLES.PIPELINE_STAGES);
  const stage = { id: generateId(), name, color: color || 'grey', position: stages.length + 1 };
  await dbPut(TABLES.PIPELINE_STAGES, stage);
  res.status(201).json({ success: true, data: stage, message: 'Stage created successfully' });
};

export const moveContactToStage = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { stage_id: req.body.stage_id, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: updated, message: 'Contact moved successfully' });
};

export const updateContactPipelineStatus = async (req, res) => {
  const updated = await dbUpdate(TABLES.CONTACTS, req.params.id, { pipeline_status: req.body.pipeline_status, updated_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: updated, message: 'Status updated successfully' });
};
