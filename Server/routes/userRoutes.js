import express from 'express';
import { getTeamMembers, inviteTeamMember } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all routes in this router
router.use(authenticateToken);

router.get('/', getTeamMembers);
router.post('/invite', inviteTeamMember);

export default router;
