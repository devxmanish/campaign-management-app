import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique shareable link for a campaign
 */
export function generateShareableLink(): string {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

/**
 * Generate a unique respondent token
 */
export function generateRespondentToken(): string {
  return uuidv4();
}

/**
 * Sanitize user object for response (remove sensitive fields)
 */
export function sanitizeUser<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Calculate pagination offset
 */
export function calculatePagination(page: number = 1, limit: number = 10): { skip: number; take: number } {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  
  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
}

/**
 * Format pagination response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10
) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  
  return {
    data,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    },
  };
}

/**
 * Parse boolean from query string
 */
export function parseBooleanQuery(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
