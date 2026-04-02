import express from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contactController.js';

const router = express.Router();

// GET /api/contacts - Get all contacts
router.get('/', getContacts);

// GET /api/contacts/:id - Get single contact
router.get('/:id', getContact);

// POST /api/contacts - Create new contact
router.post('/', createContact);

// PUT /api/contacts/:id - Update contact
router.put('/:id', updateContact);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', deleteContact);

export default router;