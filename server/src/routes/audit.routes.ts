import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/rbac.middleware';
import { validate, paginationValidation } from '../middlewares/validation.middleware';

const router = Router();

// Get all audit logs (super admin only)
router.get('/', authenticate, requireSuperAdmin, validate(paginationValidation), auditController.getAllLogs.bind(auditController));

export default router;
