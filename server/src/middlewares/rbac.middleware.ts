import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
}

/**
 * Check if user is an admin (SUPER_ADMIN or ADMIN)
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.ADMIN) {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}

/**
 * Check if user is a super admin
 */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return next(new ForbiddenError('Super admin access required'));
  }

  next();
}

/**
 * Check if user can create campaigns (SUPER_ADMIN, ADMIN, or CAMPAIGN_CREATOR)
 */
export function canCreateCampaign(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAMPAIGN_CREATOR];
  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return next(new ForbiddenError('You do not have permission to create campaigns'));
  }

  next();
}
