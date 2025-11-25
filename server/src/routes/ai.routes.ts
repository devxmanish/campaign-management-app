import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { canCreateCampaign } from '../middlewares/rbac.middleware';

const router = Router();

// Generate questions with AI
router.post(
  '/generate-questions',
  authenticate,
  canCreateCampaign,
  aiController.generateQuestions.bind(aiController)
);

// Generate description with AI
router.post(
  '/generate-description',
  authenticate,
  canCreateCampaign,
  aiController.generateDescription.bind(aiController)
);

export default router;
