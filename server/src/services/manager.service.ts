import prisma from '../utils/prisma';
import { InviteManagerInput, UpdateManagerPermissionsInput, UserRole, ManagerPermission } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';

export class ManagerService {
  /**
   * Invite a manager to a campaign
   */
  async inviteManager(
    campaignId: string,
    inviterId: string,
    inviterRole: UserRole,
    input: InviteManagerInput
  ) {
    // Check if inviter has permission
    await this.checkInvitePermission(campaignId, inviterId, inviterRole);

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      // In a real app, would send an invitation email
      // For now, create a placeholder user that needs to register
      throw new NotFoundError('User not found. Please ask them to register first.');
    }

    // Check if already a manager
    const existingManager = await prisma.campaignManager.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: user.id,
        },
      },
    });

    if (existingManager) {
      throw new ConflictError('User is already a manager for this campaign');
    }

    // Check if user is the campaign creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (campaign?.creatorId === user.id) {
      throw new BadRequestError('Campaign creator cannot be added as a manager');
    }

    // Create the manager entry
    const manager = await prisma.campaignManager.create({
      data: {
        campaignId,
        userId: user.id,
        invitedById: inviterId,
        permissions: input.permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return manager;
  }

  /**
   * Accept manager invitation
   */
  async acceptInvitation(campaignId: string, userId: string) {
    const manager = await prisma.campaignManager.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
    });

    if (!manager) {
      throw new NotFoundError('Invitation not found');
    }

    if (manager.acceptedAt) {
      throw new BadRequestError('Invitation already accepted');
    }

    const updated = await prisma.campaignManager.update({
      where: { id: manager.id },
      data: { acceptedAt: new Date() },
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
    });

    return updated;
  }

  /**
   * Get managers for a campaign
   */
  async getCampaignManagers(campaignId: string, userId: string, userRole: UserRole) {
    await this.checkViewPermission(campaignId, userId, userRole);

    const managers = await prisma.campaignManager.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return managers;
  }

  /**
   * Update manager permissions
   */
  async updateManagerPermissions(
    campaignId: string,
    managerId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateManagerPermissionsInput
  ) {
    await this.checkInvitePermission(campaignId, userId, userRole);

    const manager = await prisma.campaignManager.findFirst({
      where: {
        id: managerId,
        campaignId,
      },
    });

    if (!manager) {
      throw new NotFoundError('Manager not found');
    }

    const updated = await prisma.campaignManager.update({
      where: { id: managerId },
      data: { permissions: input.permissions },
      include: {
        user: {
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
   * Remove manager from campaign
   */
  async removeManager(
    campaignId: string,
    managerId: string,
    userId: string,
    userRole: UserRole
  ) {
    await this.checkInvitePermission(campaignId, userId, userRole);

    const manager = await prisma.campaignManager.findFirst({
      where: {
        id: managerId,
        campaignId,
      },
    });

    if (!manager) {
      throw new NotFoundError('Manager not found');
    }

    await prisma.campaignManager.delete({
      where: { id: managerId },
    });

    return { message: 'Manager removed successfully' };
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: string) {
    const invitations = await prisma.campaignManager.findMany({
      where: {
        userId,
        acceptedAt: null,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return invitations;
  }

  /**
   * Check if user has permission to invite managers
   */
  private async checkInvitePermission(campaignId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return true;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.creatorId === userId) {
      return true;
    }

    throw new ForbiddenError('You do not have permission to manage campaign team');
  }

  /**
   * Check if user has permission to view managers
   */
  private async checkViewPermission(campaignId: string, userId: string, userRole: UserRole) {
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

    if (campaign.creatorId === userId || campaign.managers.length > 0) {
      return true;
    }

    throw new ForbiddenError('You do not have permission to view campaign team');
  }
}

export const managerService = new ManagerService();
