import prisma from '../utils/prisma';
import { SubmitResponseInput, UserRole, ManagerPermission } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { generateRespondentToken, calculatePagination, formatPaginatedResponse } from '../utils/helpers';

export class ResponseService {
  /**
   * Submit a response to a campaign
   */
  async submitResponse(campaignId: string, input: SubmitResponseInput) {
    // Get campaign and questions
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        questions: true,
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== 'PUBLISHED') {
      throw new BadRequestError('This campaign is not accepting responses');
    }

    // Validate required questions
    const requiredQuestions = campaign.questions.filter(q => q.required);
    const answeredQuestionIds = input.answers.map(a => a.questionId);
    
    for (const q of requiredQuestions) {
      if (!answeredQuestionIds.includes(q.id)) {
        throw new BadRequestError(`Question "${q.questionText}" is required`);
      }
    }

    // Create respondent
    const respondent = await prisma.respondent.create({
      data: {
        campaignId,
        respondentToken: generateRespondentToken(),
        anonymous: !input.identifiableFields,
        identifiableFields: input.identifiableFields || undefined,
        consentGiven: input.consentGiven ?? false,
        submittedAt: new Date(),
      },
    });

    // Create responses
    await prisma.response.createMany({
      data: input.answers.map(a => ({
        respondentId: respondent.id,
        questionId: a.questionId,
        answer: a.answer as object,
      })),
    });

    return {
      success: true,
      respondentToken: respondent.respondentToken,
      message: 'Response submitted successfully',
    };
  }

  /**
   * Get responses for a campaign
   */
  async getCampaignResponses(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    filters: {
      page?: number;
      limit?: number;
      includeDetails?: boolean;
    } = {}
  ) {
    const canViewDetails = await this.checkCanViewRespondentDetails(campaignId, userId, userRole);
    const { skip, take } = calculatePagination(filters.page, filters.limit);

    const [respondents, total] = await Promise.all([
      prisma.respondent.findMany({
        where: { campaignId, submittedAt: { not: null } },
        skip,
        take,
        orderBy: { submittedAt: 'desc' },
        include: {
          responses: {
            include: {
              question: true,
            },
          },
        },
      }),
      prisma.respondent.count({
        where: { campaignId, submittedAt: { not: null } },
      }),
    ]);

    // Filter out identifiable fields if not allowed
    const sanitizedRespondents = respondents.map(r => ({
      id: r.id,
      respondentToken: r.respondentToken,
      submittedAt: r.submittedAt,
      anonymous: r.anonymous,
      consentGiven: r.consentGiven,
      identifiableFields: canViewDetails && filters.includeDetails ? r.identifiableFields : null,
      responses: r.responses.map(res => ({
        questionId: res.questionId,
        questionText: res.question.questionText,
        questionType: res.question.type,
        answer: res.answer,
      })),
    }));

    return formatPaginatedResponse(sanitizedRespondents, total, filters.page, filters.limit);
  }

  /**
   * Get a single response
   */
  async getResponseById(
    respondentId: string,
    userId: string,
    userRole: UserRole
  ) {
    const respondent = await prisma.respondent.findUnique({
      where: { id: respondentId },
      include: {
        campaign: true,
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!respondent) {
      throw new NotFoundError('Response not found');
    }

    const canViewDetails = await this.checkCanViewRespondentDetails(
      respondent.campaignId,
      userId,
      userRole
    );

    return {
      id: respondent.id,
      respondentToken: respondent.respondentToken,
      submittedAt: respondent.submittedAt,
      anonymous: respondent.anonymous,
      consentGiven: respondent.consentGiven,
      identifiableFields: canViewDetails ? respondent.identifiableFields : null,
      responses: respondent.responses.map(res => ({
        questionId: res.questionId,
        questionText: res.question.questionText,
        questionType: res.question.type,
        answer: res.answer,
      })),
    };
  }

  /**
   * Delete a response
   */
  async deleteResponse(respondentId: string, userId: string, userRole: UserRole) {
    const respondent = await prisma.respondent.findUnique({
      where: { id: respondentId },
      include: { campaign: true },
    });

    if (!respondent) {
      throw new NotFoundError('Response not found');
    }

    // Check permission
    const campaign = respondent.campaign;
    if (
      campaign.creatorId !== userId &&
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenError('You do not have permission to delete this response');
    }

    await prisma.respondent.delete({
      where: { id: respondentId },
    });

    return { message: 'Response deleted successfully' };
  }

  /**
   * Check if user can view respondent details
   */
  private async checkCanViewRespondentDetails(
    campaignId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    // Super admin and admin can always view
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
      return false;
    }

    // Creator can view if campaign allows
    if (campaign.creatorId === userId) {
      return true;
    }

    // Manager can only view if:
    // 1. They have manage_respondents permission
    // 2. Campaign allows manager to view respondent details
    const manager = campaign.managers[0];
    if (
      manager &&
      manager.permissions.includes(ManagerPermission.MANAGE_RESPONDENTS) &&
      campaign.allowManagerViewRespondentDetails
    ) {
      return true;
    }

    return false;
  }
}

export const responseService = new ResponseService();
