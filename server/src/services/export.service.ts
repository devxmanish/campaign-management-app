import prisma from '../utils/prisma';
import { UserRole, ManagerPermission } from '../types';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { calculatePagination, formatPaginatedResponse } from '../utils/helpers';

export class ExportService {
  /**
   * Generate an export for a campaign
   */
  async generateExport(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    format: 'csv' | 'json' = 'csv'
  ) {
    const canViewDetails = await this.checkExportPermission(campaignId, userId, userRole);

    // Get all responses
    const respondents = await prisma.respondent.findMany({
      where: { campaignId, submittedAt: { not: null } },
      include: {
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    // Get questions for headers
    const questions = await prisma.question.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    });

    // Build export data
    const data = respondents.map(r => {
      const row: Record<string, unknown> = {
        respondentId: r.id,
        submittedAt: r.submittedAt?.toISOString(),
        anonymous: r.anonymous,
      };

      // Add identifiable fields if allowed
      if (canViewDetails && r.identifiableFields) {
        const fields = r.identifiableFields as Record<string, unknown>;
        row.name = fields.name || '';
        row.email = fields.email || '';
        row.phone = fields.phone || '';
      }

      // Add responses
      for (const q of questions) {
        const response = r.responses.find(res => res.questionId === q.id);
        row[q.questionText] = response?.answer || '';
      }

      return row;
    });

    // Generate file content
    let content: string;
    if (format === 'csv') {
      content = this.generateCSV(data, questions, canViewDetails);
    } else {
      content = JSON.stringify(data, null, 2);
    }

    // Save export record
    const filePath = `/exports/${campaignId}_${Date.now()}.${format}`;
    const exportRecord = await prisma.export.create({
      data: {
        campaignId,
        filePath,
        generatedBy: userId,
        format,
      },
    });

    return {
      id: exportRecord.id,
      filePath,
      format,
      content,
      recordCount: data.length,
      createdAt: exportRecord.createdAt,
    };
  }

  /**
   * Get exports for a campaign
   */
  async getCampaignExports(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    filters: { page?: number; limit?: number } = {}
  ) {
    await this.checkExportPermission(campaignId, userId, userRole);

    const { skip, take } = calculatePagination(filters.page, filters.limit);

    const [exports, total] = await Promise.all([
      prisma.export.findMany({
        where: { campaignId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.export.count({ where: { campaignId } }),
    ]);

    return formatPaginatedResponse(exports, total, filters.page, filters.limit);
  }

  /**
   * Get export by ID
   */
  async getExportById(exportId: string, userId: string, userRole: UserRole) {
    const exportRecord = await prisma.export.findUnique({
      where: { id: exportId },
      include: {
        campaign: true,
      },
    });

    if (!exportRecord) {
      throw new NotFoundError('Export not found');
    }

    await this.checkExportPermission(exportRecord.campaignId, userId, userRole);

    return exportRecord;
  }

  /**
   * Generate CSV content
   */
  private generateCSV(
    data: Record<string, unknown>[],
    questions: { questionText: string }[],
    includeDetails: boolean
  ): string {
    if (data.length === 0) {
      return '';
    }

    // Build headers
    const headers = ['respondentId', 'submittedAt', 'anonymous'];
    if (includeDetails) {
      headers.push('name', 'email', 'phone');
    }
    headers.push(...questions.map(q => q.questionText));

    // Build rows
    const rows = data.map(row => {
      return headers.map(h => {
        const value = row[h];
        if (value === null || value === undefined) return '';
        const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Check if user has permission to export
   */
  private async checkExportPermission(
    campaignId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
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

    const manager = campaign.managers[0];
    if (manager && manager.permissions.includes(ManagerPermission.VIEW_RESULTS)) {
      return campaign.allowManagerViewRespondentDetails;
    }

    throw new ForbiddenError('You do not have permission to export this campaign');
  }
}

export const exportService = new ExportService();
