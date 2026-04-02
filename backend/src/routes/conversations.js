import express from 'express';
import {
  getConversation,
  sendMessage,
  updateConversationStatus,
  assignAgent,
  addNote,
  getNotes,
  pushToAdmin
} from '../controllers/conversationsController.js';

const router = express.Router();

// GET /api/conversations/:id - Get conversation details and messages
router.get('/:id', getConversation);

// POST /api/conversations/:id/messages - Send message
router.post('/:id/messages', sendMessage);

// PATCH /api/conversations/:id/status - Update conversation status
router.patch('/:id/status', updateConversationStatus);

// PATCH /api/conversations/:id/agent - Assign agent
router.patch('/:id/agent', assignAgent);

// POST /api/conversations/:id/notes - Add internal note
router.post('/:id/notes', addNote);

// GET /api/conversations/:id/notes - Get internal notes
router.get('/:id/notes', getNotes);

// POST /api/conversations/:id/push-admin - Push to admin
router.post('/:id/push-admin', pushToAdmin);

export default router;