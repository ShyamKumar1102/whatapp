import express from 'express';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder
} from '../controllers/remindersController.js';

const router = express.Router();

// GET /api/reminders - Get all reminders with optional status filter
router.get('/', getReminders);

// POST /api/reminders - Create new reminder
router.post('/', createReminder);

// PUT /api/reminders/:id - Update reminder
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', deleteReminder);

// PATCH /api/reminders/:id/complete - Mark reminder as complete
router.patch('/:id/complete', completeReminder);

export default router;