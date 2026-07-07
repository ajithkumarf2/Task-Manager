import express from 'express';
import { getAiSuggestion } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protect AI suggest route with authentication
router.post('/suggest', authenticateToken, getAiSuggestion);

export default router;
