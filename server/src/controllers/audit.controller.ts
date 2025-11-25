import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { AuditAction, AuditTargetType } from '../types';

export class AuditController {
  /**
   * Get audit logs for a campaign
   */
  async getCampaignLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        action: req.query.action as AuditAction | undefined,
      };

      const logs = await auditService.getCampaignAuditLogs(campaignId, userId, userRole, filters);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all audit logs (admin only)
   */
  async getAllLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        action: req.query.action as AuditAction | undefined,
        targetType: req.query.targetType as AuditTargetType | undefined,
      };

      const logs = await auditService.getAllAuditLogs(userId, userRole, filters);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
