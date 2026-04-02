import express from 'express';
import {
  getPipeline,
  getStages,
  createStage,
  moveContactToStage,
  updateContactPipelineStatus
} from '../controllers/pipelineController.js';

const router = express.Router();

// GET /api/pipeline - Get stages with contacts
router.get('/', getPipeline);

// GET /api/pipeline/stages - Get all stages
router.get('/stages', getStages);

// POST /api/pipeline/stages - Create new stage
router.post('/stages', createStage);

// PATCH /api/contacts/:id/stage - Move contact to stage
router.patch('/contacts/:id/stage', moveContactToStage);

// PATCH /api/contacts/:id/pipeline-status - Update contact pipeline status
router.patch('/contacts/:id/pipeline-status', updateContactPipelineStatus);

export default router;