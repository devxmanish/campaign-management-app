import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

export class AIController {
  /**
   * Generate questions using AI
   */
  async generateQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, numberOfQuestions, questionTypes } = req.body;

      const questions = await aiService.generateQuestions(
        topic,
        numberOfQuestions || 5,
        questionTypes
      );

      res.json({
        success: true,
        data: questions,
        message: 'Questions generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate campaign description using AI
   */
  async generateDescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { title } = req.body;

      const description = await aiService.generateDescription(title);

      res.json({
        success: true,
        data: { description },
        message: 'Description generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
