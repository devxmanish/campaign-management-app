import { Router } from 'express';
import { managerController } from '../controllers/manager.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Get pending invitations for current user
router.get('/invitations', authenticate, managerController.pendingInvitations.bind(managerController));

export default router;
