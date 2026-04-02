import express from 'express';
import {
  getPipeline,
  getStages,
  createStage,
  moveContactToStage,
  updateContactPipelineStatus
} from '../controllers/pipelineController.js';

const router = express.Router();

// GET /api/pipeline - Get pipeline with all stages and contacts
router.get('/', getPipeline);

// GET /api/pipeline/stages - Get all stages
router.get('/stages', getStages);

// POST /api/pipeline/stages - Create new stage
router.post('/stages', createStage);

// PUT /api/pipeline/contacts/:id/move - Move contact to a stage
router.put('/contacts/:id/move', moveContactToStage);

// PUT /api/pipeline/contacts/:id/status - Update contact pipeline status
router.put('/contacts/:id/status', updateContactPipelineStatus);

export default router;
