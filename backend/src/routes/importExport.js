import express from 'express';
import {
  exportContacts,
  importContacts,
  downloadTemplate,
  upload
} from '../controllers/importExportController.js';

const router = express.Router();

// GET /api/contacts/export - Download contacts CSV
router.get('/export', exportContacts);

// POST /api/contacts/import - Upload and import CSV
router.post('/import', upload.single('csvFile'), importContacts);

// GET /api/contacts/template - Download blank CSV template
router.get('/template', downloadTemplate);

export default router;