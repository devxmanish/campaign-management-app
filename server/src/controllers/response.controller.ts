import { Request, Response, NextFunction } from 'express';
import { responseService } from '../services/response.service';
import { SubmitResponseInput } from '../types';

export class ResponseController {
  /**
   * Submit a response to a campaign
   */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      
      const input: SubmitResponseInput = {
        answers: req.body.answers,
        identifiableFields: req.body.identifiableFields,
        consentGiven: req.body.consentGiven,
      };

      const result = await responseService.submitResponse(campaignId, input);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all responses for a campaign
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        includeDetails: req.query.includeDetails === 'true',
      };

      const responses = await responseService.getCampaignResponses(campaignId, userId, userRole, filters);

      res.json({
        success: true,
        data: responses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single response
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { rid } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const response = await responseService.getResponseById(rid, userId, userRole);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a response
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { rid } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await responseService.deleteResponse(rid, userId, userRole);

      res.json({
        success: true,
        message: 'Response deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const responseController = new ResponseController();
