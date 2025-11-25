import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service';
import { CreateCampaignInput, UpdateCampaignInput, CampaignStatus } from '../types';

export class CampaignController {
  /**
   * Create a new campaign
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: CreateCampaignInput = {
        title: req.body.title,
        description: req.body.description,
        visibility: req.body.visibility,
        organizationId: req.body.organizationId,
      };

      const campaign = await campaignService.createCampaign(userId, input);

      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all campaigns
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const filters = {
        status: req.query.status as CampaignStatus | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const campaigns = await campaignService.listCampaigns(userId, userRole, filters);

      res.json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single campaign
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const campaign = await campaignService.getCampaignById(id, userId, userRole);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a campaign
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const input: UpdateCampaignInput = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        visibility: req.body.visibility,
        allowManagerViewRespondentDetails: req.body.allowManagerViewRespondentDetails,
        scheduledPublishAt: req.body.scheduledPublishAt,
      };

      const campaign = await campaignService.updateCampaign(id, userId, userRole, input);

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a campaign
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await campaignService.deleteCampaign(id, userId, userRole);

      res.json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish a campaign
   */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const campaign = await campaignService.publishCampaign(id, userId, userRole);

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign published successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close a campaign
   */
  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const campaign = await campaignService.closeCampaign(id, userId, userRole);

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign closed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign by shareable link (public)
   */
  async getByShareableLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { link } = req.params;

      const campaign = await campaignService.getCampaignByShareableLink(link);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign analytics
   */
  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const analytics = await campaignService.getCampaignAnalytics(id, userId, userRole);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const campaignController = new CampaignController();
