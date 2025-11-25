import prisma from '../utils/prisma';
import { CreateQuestionInput, UpdateQuestionInput, UserRole, ManagerPermission } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class QuestionService {
  /**
   * Create a new question for a campaign
   */
  async createQuestion(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    input: CreateQuestionInput
  ) {
    await this.checkEditPermission(campaignId, userId, userRole);

    // Get the highest order number
    const lastQuestion = await prisma.question.findFirst({
      where: { campaignId },
      orderBy: { order: 'desc' },
    });

    const question = await prisma.question.create({
      data: {
        campaignId,
        questionText: input.questionText,
        type: input.type,
        options: input.options,
        required: input.required ?? false,
        order: input.order ?? (lastQuestion?.order ?? 0) + 1,
      },
    });

    return question;
  }

  /**
   * Get all questions for a campaign
   */
  async getQuestionsByCampaign(campaignId: string) {
    const questions = await prisma.question.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    });

    return questions;
  }

  /**
   * Update a question
   */
  async updateQuestion(
    questionId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateQuestionInput
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    await this.checkEditPermission(question.campaignId, userId, userRole);

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: input,
    });

    return updated;
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string, userId: string, userRole: UserRole) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    await this.checkEditPermission(question.campaignId, userId, userRole);

    await prisma.question.delete({
      where: { id: questionId },
    });

    return { message: 'Question deleted successfully' };
  }

  /**
   * Reorder questions
   */
  async reorderQuestions(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    questionOrders: { id: string; order: number }[]
  ) {
    await this.checkEditPermission(campaignId, userId, userRole);

    // Update all questions in a transaction
    await prisma.$transaction(
      questionOrders.map(q =>
        prisma.question.update({
          where: { id: q.id },
          data: { order: q.order },
        })
      )
    );

    return this.getQuestionsByCampaign(campaignId);
  }

  /**
   * Check if user has permission to edit campaign questions
   */
  private async checkEditPermission(campaignId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return true;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        managers: {
          where: { userId },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.creatorId === userId) {
      return true;
    }

    const isManager = campaign.managers.some(m => m.permissions.includes(ManagerPermission.EDIT_CAMPAIGN));
    if (isManager) {
      return true;
    }

    throw new ForbiddenError('You do not have permission to edit this campaign');
  }
}

export const questionService = new QuestionService();
