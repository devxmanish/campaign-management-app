import { Request, Response, NextFunction } from 'express';
import { questionService } from '../services/question.service';
import { CreateQuestionInput, UpdateQuestionInput } from '../types';

export class QuestionController {
  /**
   * Create a new question
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const input: CreateQuestionInput = {
        questionText: req.body.questionText,
        type: req.body.type,
        options: req.body.options,
        required: req.body.required,
        order: req.body.order,
      };

      const question = await questionService.createQuestion(campaignId, userId, userRole, input);

      res.status(201).json({
        success: true,
        data: question,
        message: 'Question created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all questions for a campaign
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;

      const questions = await questionService.getQuestionsByCampaign(campaignId);

      res.json({
        success: true,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a question
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { qid } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      
      const input: UpdateQuestionInput = {
        questionText: req.body.questionText,
        type: req.body.type,
        options: req.body.options,
        required: req.body.required,
        order: req.body.order,
      };

      const question = await questionService.updateQuestion(qid, userId, userRole, input);

      res.json({
        success: true,
        data: question,
        message: 'Question updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a question
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { qid } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await questionService.deleteQuestion(qid, userId, userRole);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder questions
   */
  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: campaignId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { orders } = req.body;

      const questions = await questionService.reorderQuestions(campaignId, userId, userRole, orders);

      res.json({
        success: true,
        data: questions,
        message: 'Questions reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
