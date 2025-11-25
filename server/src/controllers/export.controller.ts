import { Request, Response, NextFunction } from 'express';
import { exportService } from '../services/export.service';

export class ExportController {
  /**
   * Generate an export for a campaign
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const format = (req.query.format as 'csv' | 'json') || 'csv';

      const exportData = await exportService.generateExport(campaignId, userId, userRole, format);

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exports for a campaign
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const exports = await exportService.getCampaignExports(campaignId, userId, userRole, filters);

      res.json({
        success: true,
        data: exports,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get export by ID
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: exportId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const exportData = await exportService.getExportById(exportId, userId, userRole);

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const exportController = new ExportController();
