import express from 'express';
import { getAiSuggestion } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect the AI suggest route
router.post('/suggest', authenticateToken, getAiSuggestion);

export default router;
