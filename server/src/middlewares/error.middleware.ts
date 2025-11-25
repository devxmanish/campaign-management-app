import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    };

    // Include validation errors if present
    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: `A record with this ${prismaError.meta?.target?.join(', ') || 'value'} already exists`,
        statusCode: 409,
      });
    }

    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
        statusCode: 404,
      });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      statusCode: 401,
    });
  }

  // Default to 500 Internal Server Error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    statusCode: 500,
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404,
  });
}
