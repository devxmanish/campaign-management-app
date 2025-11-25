import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { canCreateCampaign } from '../middlewares/rbac.middleware';
import { aiRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Generate questions with AI (rate limited)
router.post(
  '/generate-questions',
  aiRateLimiter,
  authenticate,
  canCreateCampaign,
  aiController.generateQuestions.bind(aiController)
);

// Generate description with AI (rate limited)
router.post(
  '/generate-description',
  aiRateLimiter,
  authenticate,
  canCreateCampaign,
  aiController.generateDescription.bind(aiController)
);

export default router;
