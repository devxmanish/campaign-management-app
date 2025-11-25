import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { questionController } from '../controllers/question.controller';
import { responseController } from '../controllers/response.controller';
import { managerController } from '../controllers/manager.controller';
import { exportController } from '../controllers/export.controller';
import { auditController } from '../controllers/audit.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { canCreateCampaign, requireAdmin } from '../middlewares/rbac.middleware';
import { 
  validate, 
  createCampaignValidation, 
  updateCampaignValidation,
  createQuestionValidation,
  inviteManagerValidation,
  submitResponseValidation,
  paginationValidation,
  idParamValidation,
} from '../middlewares/validation.middleware';

const router = Router();

// Public routes
router.get('/public/:link', campaignController.getByShareableLink.bind(campaignController));
router.post('/:id/responses', validate(submitResponseValidation), responseController.submit.bind(responseController));

// Protected campaign routes
router.post(
  '/', 
  authenticate, 
  canCreateCampaign, 
  validate(createCampaignValidation), 
  campaignController.create.bind(campaignController)
);

router.get(
  '/', 
  authenticate, 
  validate(paginationValidation), 
  campaignController.list.bind(campaignController)
);

router.get(
  '/:id', 
  authenticate, 
  validate(idParamValidation), 
  campaignController.get.bind(campaignController)
);

router.patch(
  '/:id', 
  authenticate, 
  validate(updateCampaignValidation), 
  campaignController.update.bind(campaignController)
);

router.delete(
  '/:id', 
  authenticate, 
  validate(idParamValidation), 
  campaignController.delete.bind(campaignController)
);

router.post(
  '/:id/publish', 
  authenticate, 
  validate(idParamValidation), 
  campaignController.publish.bind(campaignController)
);

router.post(
  '/:id/close', 
  authenticate, 
  validate(idParamValidation), 
  campaignController.close.bind(campaignController)
);

router.get(
  '/:id/analytics', 
  authenticate, 
  validate(idParamValidation), 
  campaignController.analytics.bind(campaignController)
);

// Question routes
router.post(
  '/:id/questions', 
  authenticate, 
  validate(createQuestionValidation), 
  questionController.create.bind(questionController)
);

router.get(
  '/:id/questions', 
  optionalAuth, 
  questionController.list.bind(questionController)
);

router.patch(
  '/:id/questions/:qid', 
  authenticate, 
  questionController.update.bind(questionController)
);

router.delete(
  '/:id/questions/:qid', 
  authenticate, 
  questionController.delete.bind(questionController)
);

router.post(
  '/:id/questions/reorder', 
  authenticate, 
  questionController.reorder.bind(questionController)
);

// Response routes
router.get(
  '/:id/responses', 
  authenticate, 
  validate(paginationValidation), 
  responseController.list.bind(responseController)
);

router.get(
  '/:id/responses/:rid', 
  authenticate, 
  responseController.get.bind(responseController)
);

router.delete(
  '/:id/responses/:rid', 
  authenticate, 
  responseController.delete.bind(responseController)
);

// Manager routes
router.post(
  '/:id/managers', 
  authenticate, 
  validate(inviteManagerValidation), 
  managerController.invite.bind(managerController)
);

router.get(
  '/:id/managers', 
  authenticate, 
  managerController.list.bind(managerController)
);

router.post(
  '/:id/managers/accept', 
  authenticate, 
  managerController.accept.bind(managerController)
);

router.patch(
  '/:id/managers/:managerId', 
  authenticate, 
  managerController.update.bind(managerController)
);

router.delete(
  '/:id/managers/:managerId', 
  authenticate, 
  managerController.remove.bind(managerController)
);

// Export routes
router.post(
  '/:id/exports', 
  authenticate, 
  exportController.generate.bind(exportController)
);

router.get(
  '/:id/exports', 
  authenticate, 
  validate(paginationValidation), 
  exportController.list.bind(exportController)
);

// Audit log routes
router.get(
  '/:id/audit-logs', 
  authenticate, 
  requireAdmin, 
  validate(paginationValidation), 
  auditController.getCampaignLogs.bind(auditController)
);

export default router;
