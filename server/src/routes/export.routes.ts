import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, idParamValidation } from '../middlewares/validation.middleware';

const router = Router();

router.get('/:id', authenticate, validate(idParamValidation), exportController.get.bind(exportController));

export default router;
