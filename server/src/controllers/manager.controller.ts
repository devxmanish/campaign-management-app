import { Request, Response, NextFunction } from 'express';
import { managerService } from '../services/manager.service';
import { InviteManagerInput, UpdateManagerPermissionsInput } from '../types';

export class ManagerController {
  /**
   * Invite a manager to a campaign
   */
  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const input: InviteManagerInput = {
        email: req.body.email,
        permissions: req.body.permissions,
      };

      const manager = await managerService.inviteManager(campaignId, userId, userRole, input);

      res.status(201).json({
        success: true,
        data: manager,
        message: 'Manager invited successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept manager invitation
   */
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;

      const manager = await managerService.acceptInvitation(campaignId, userId);

      res.json({
        success: true,
        data: manager,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all managers for a campaign
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const managers = await managerService.getCampaignManagers(campaignId, userId, userRole);

      res.json({
        success: true,
        data: managers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update manager permissions
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId, managerId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const input: UpdateManagerPermissionsInput = {
        permissions: req.body.permissions,
      };

      const manager = await managerService.updateManagerPermissions(
        campaignId,
        managerId,
        userId,
        userRole,
        input
      );

      res.json({
        success: true,
        data: manager,
        message: 'Manager permissions updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove manager from campaign
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId, managerId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await managerService.removeManager(campaignId, managerId, userId, userRole);

      res.json({
        success: true,
        message: 'Manager removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending invitations for current user
   */
  async pendingInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const invitations = await managerService.getPendingInvitations(userId);

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const managerController = new ManagerController();
