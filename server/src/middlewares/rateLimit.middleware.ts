import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes
 * Allows 10 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for AI generation routes
 * Allows 20 requests per hour per IP
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    error: 'Too many AI generation requests, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Allows 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for public form submissions
 * Allows 5 submissions per minute per IP
 */
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Too many submissions, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
