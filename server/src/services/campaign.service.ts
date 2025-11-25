import prisma from '../utils/prisma';
import { 
  CreateCampaignInput, 
  UpdateCampaignInput, 
  CampaignAnalytics,
  UserRole, 
  CampaignStatus,
  ManagerPermission 
} from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { generateShareableLink, calculatePagination, formatPaginatedResponse } from '../utils/helpers';

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(creatorId: string, input: CreateCampaignInput) {
    const campaign = await prisma.campaign.create({
      data: {
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        creatorId,
        organizationId: input.organizationId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string, userId: string, userRole: UserRole) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            respondents: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Check access
    await this.checkCampaignAccess(campaign, userId, userRole);

    return campaign;
  }

  /**
   * List campaigns for a user
   */
  async listCampaigns(
    userId: string,
    userRole: UserRole,
    filters: {
      status?: CampaignStatus;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { skip, take } = calculatePagination(filters.page, filters.limit);

    // Build where clause based on role
    let where: Record<string, unknown> = {};

    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Admins see all campaigns
      where = {};
    } else if (userRole === UserRole.CAMPAIGN_CREATOR) {
      // Creators see their own campaigns
      where = { creatorId: userId };
    } else if (userRole === UserRole.CAMPAIGN_MANAGER) {
      // Managers see campaigns they're assigned to
      where = {
        managers: {
          some: {
            userId,
            acceptedAt: { not: null },
          },
        },
      };
    } else {
      // Others see only public published campaigns
      where = {
        visibility: 'PUBLIC',
        status: CampaignStatus.PUBLISHED,
      };
    }

    // Add status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Add search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              respondents: true,
              questions: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return formatPaginatedResponse(campaigns, total, filters.page, filters.limit);
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateCampaignInput
  ) {
    const campaign = await this.getCampaignById(campaignId, userId, userRole);

    // Only creator or admin can update
    if (campaign.creatorId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      const isManager = campaign.managers.some(
        m => m.userId === userId && m.permissions.includes(ManagerPermission.EDIT_CAMPAIGN)
      );
      if (!isManager) {
        throw new ForbiddenError('You do not have permission to update this campaign');
      }
    }

    // Only admin can update allowManagerViewRespondentDetails
    if (input.allowManagerViewRespondentDetails !== undefined) {
      if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
        throw new ForbiddenError('Only admins can change respondent details visibility');
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: input,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Publish campaign
   */
  async publishCampaign(campaignId: string, userId: string, userRole: UserRole) {
    const campaign = await this.getCampaignById(campaignId, userId, userRole);

    if (campaign.creatorId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to publish this campaign');
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestError('Only draft campaigns can be published');
    }

    // Check if campaign has questions
    if (campaign.questions.length === 0) {
      throw new BadRequestError('Campaign must have at least one question to be published');
    }

    const shareableLink = generateShareableLink();

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.PUBLISHED,
        shareableLink,
      },
    });

    return updated;
  }

  /**
   * Close campaign
   */
  async closeCampaign(campaignId: string, userId: string, userRole: UserRole) {
    const campaign = await this.getCampaignById(campaignId, userId, userRole);

    if (campaign.creatorId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to close this campaign');
    }

    if (campaign.status !== CampaignStatus.PUBLISHED) {
      throw new BadRequestError('Only published campaigns can be closed');
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string, userId: string, userRole: UserRole) {
    const campaign = await this.getCampaignById(campaignId, userId, userRole);

    if (campaign.creatorId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to delete this campaign');
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Get campaign by shareable link (for public access)
   */
  async getCampaignByShareableLink(shareableLink: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { shareableLink },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.PUBLISHED) {
      throw new BadRequestError('This campaign is not accepting responses');
    }

    return campaign;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, userId: string, userRole: UserRole): Promise<CampaignAnalytics> {
    await this.getCampaignById(campaignId, userId, userRole);

    const [totalResponses, respondents, questions] = await Promise.all([
      prisma.respondent.count({
        where: { campaignId, submittedAt: { not: null } },
      }),
      prisma.respondent.findMany({
        where: { campaignId, submittedAt: { not: null } },
        select: {
          submittedAt: true,
          createdAt: true,
        },
      }),
      prisma.question.findMany({
        where: { campaignId },
        include: {
          responses: true,
        },
      }),
    ]);

    // Calculate responses by day
    const responsesByDay: Record<string, number> = {};
    respondents.forEach(r => {
      if (r.submittedAt) {
        const date = r.submittedAt.toISOString().split('T')[0];
        responsesByDay[date] = (responsesByDay[date] || 0) + 1;
      }
    });

    // Calculate question stats
    const questionStats = questions.map(q => {
      const responses = q.responses;
      const distribution: Record<string, number> = {};
      
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOX' || q.type === 'RATING') {
        responses.forEach(r => {
          const answer = String(r.answer);
          distribution[answer] = (distribution[answer] || 0) + 1;
        });
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        type: q.type,
        responseCount: responses.length,
        distribution: Object.keys(distribution).length > 0 ? distribution : undefined,
      };
    });

    // Calculate average time (placeholder - would need actual timing data)
    const averageTimeSeconds = 0;

    // Calculate completion rate (submitted / started)
    const startedCount = await prisma.respondent.count({ where: { campaignId } });
    const completionRate = startedCount > 0 ? (totalResponses / startedCount) * 100 : 0;

    return {
      totalResponses,
      completionRate,
      averageTimeSeconds,
      responsesByDay: Object.entries(responsesByDay).map(([date, count]) => ({ date, count })),
      questionStats,
    };
  }

  /**
   * Check if user has access to campaign
   */
  private async checkCampaignAccess(
    campaign: { creatorId: string; visibility: string; status: string; managers: { userId: string }[] },
    userId: string,
    userRole: UserRole
  ) {
    // Super admin and admin can access all
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return true;
    }

    // Creator can access their own campaigns
    if (campaign.creatorId === userId) {
      return true;
    }

    // Manager can access assigned campaigns
    const isManager = campaign.managers.some(m => m.userId === userId);
    if (isManager) {
      return true;
    }

    // Public published campaigns are accessible
    if (campaign.visibility === 'PUBLIC' && campaign.status === 'PUBLISHED') {
      return true;
    }

    throw new ForbiddenError('You do not have access to this campaign');
  }
}

export const campaignService = new CampaignService();
