import prisma from '../utils/prisma';
import { AuditAction, AuditTargetType, UserRole } from '../types';
import { ForbiddenError } from '../utils/errors';
import { calculatePagination, formatPaginatedResponse } from '../utils/helpers';

export class AuditService {
  /**
   * Create an audit log entry
   */
  async createAuditLog(
    userId: string,
    action: AuditAction,
    targetType: AuditTargetType,
    targetId: string,
    campaignId?: string,
    details?: Record<string, unknown>
  ) {
    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        campaignId,
        details: details as object | undefined,
      },
    });

    return log;
  }

  /**
   * Get audit logs for a campaign
   */
  async getCampaignAuditLogs(
    campaignId: string,
    userId: string,
    userRole: UserRole,
    filters: {
      page?: number;
      limit?: number;
      action?: AuditAction;
    } = {}
  ) {
    // Only admins can view audit logs
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can view audit logs');
    }

    const { skip, take } = calculatePagination(filters.page, filters.limit);

    const where: Record<string, unknown> = { campaignId };
    if (filters.action) {
      where.action = filters.action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
      prisma.auditLog.count({ where }),
    ]);

    return formatPaginatedResponse(logs, total, filters.page, filters.limit);
  }

  /**
   * Get all audit logs (admin only)
   */
  async getAllAuditLogs(
    userId: string,
    userRole: UserRole,
    filters: {
      page?: number;
      limit?: number;
      action?: AuditAction;
      targetType?: AuditTargetType;
    } = {}
  ) {
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Only super admins can view all audit logs');
    }

    const { skip, take } = calculatePagination(filters.page, filters.limit);

    const where: Record<string, unknown> = {};
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return formatPaginatedResponse(logs, total, filters.page, filters.limit);
  }
}

export const auditService = new AuditService();
