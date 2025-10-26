/**
 * Validation Middleware - Automation Global v4.0
 * Provides request validation and custom error handling
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../errors/index.js';

// Re-export all error classes for easy importing from middleware
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  TimeoutError,
  BadRequestError,
  InternalServerError
} from '../errors/index.js';

/**
 * Request Validation Middleware
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

/**
 * Query Parameters Validation Middleware
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

/**
 * Parameters Validation Middleware
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          code: 'PARAMS_VALIDATION_ERROR',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = null;

  // Log error for debugging (in production, use proper logging service)
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle custom application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';
    details = err.details;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle database connection errors
  else if (err.message.includes('CONNECT_TIMEOUT')) {
    statusCode = 503;
    message = 'Database connection timeout';
    code = 'DATABASE_TIMEOUT';
  }
  // Handle rate limiting errors
  else if (err.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // Handle file size errors
  else if (err.message.includes('File too large')) {
    statusCode = 413;
    message = 'File size too large';
    code = 'FILE_TOO_LARGE';
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  };

  if (details) {
    errorResponse.details = details;
  }

  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(404, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND');
  next(error);
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request ID Middleware
 * Adds unique request ID for tracking
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = id as string;
  res.setHeader('X-Request-ID', id);
  next();
}

/**
 * Request Logger Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString()
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      console.error('🔴 Server Error:', logData);
    } else if (res.statusCode >= 400) {
      console.warn('🟡 Client Error:', logData);
    } else {
      console.log('🟢 Request:', logData);
    }
  });

  next();
}