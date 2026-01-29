import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error in development
  if (config.isDev) {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }

    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if (err.code === '11000' || (err as { code?: number }).code === 11000) {
    res.status(409).json({
      message: 'Resource already exists',
      code: 'DUPLICATE_ERROR',
    });
    return;
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      message: 'Invalid ID format',
      code: 'INVALID_ID',
    });
    return;
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && !config.isDev ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    message,
    code: err.code || 'SERVER_ERROR',
    ...(config.isDev && { stack: err.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    message: 'Resource not found',
    code: 'NOT_FOUND',
  });
}

// Helper to create AppError
export function createError(message: string, statusCode = 500, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
