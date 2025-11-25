import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/rbac.middleware';
import { validate, registerValidation, loginValidation } from '../middlewares/validation.middleware';

const router = Router();

// Public routes
router.post('/register', validate(registerValidation), authController.register.bind(authController));
router.post('/login', validate(loginValidation), authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.me.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

// Admin routes
router.patch('/users/:id', authenticate, requireAdmin, authController.updateUser.bind(authController));

export default router;
