import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { CreateUserInput, LoginInput, UserRole } from '../types';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateUserInput = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: UserRole.RESPONDENT, // Default role for registration
      };

      const result = await authService.register(input);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input: LoginInput = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await authService.login(input);

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getUserById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, role, active } = req.body;

      const user = await authService.updateUser(id, { name, email, role, active });

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
