/**
 * Custom Error Classes - Automation Global v4.0
 * Centralized error definitions for consistent error handling
 */

/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(statusCode: number, message: string, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'AUTH_REQUIRED', details?: any) {
    super(401, message, code, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization/Permission Errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied', code: string = 'PERMISSION_DENIED', details?: any) {
    super(403, message, code, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', code: string = 'NOT_FOUND', details?: any) {
    super(404, `${resource} not found`, code, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR', details?: any) {
    super(400, message, code, details);
    this.name = 'ValidationError';
  }
}

/**
 * Conflict Errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT', details?: any) {
    super(409, message, code, details);
    this.name = 'ConflictError';
  }
}

/**
 * Database Errors (503)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', code: string = 'DATABASE_ERROR', details?: any) {
    super(503, message, code, details);
    this.name = 'DatabaseError';
  }
}

/**
 * External Service Errors (502/503)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service unavailable',
    code: string = 'SERVICE_UNAVAILABLE',
    details?: any
  ) {
    super(503, `${service}: ${message}`, code, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Rate Limit Errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', code: string = 'RATE_LIMIT_EXCEEDED', details?: any) {
    super(429, message, code, details);
    this.name = 'RateLimitError';
  }
}

/**
 * Timeout Errors (408)
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', code: string = 'TIMEOUT', details?: any) {
    super(408, message, code, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Bad Request Errors (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: any) {
    super(400, message, code, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Internal Server Errors (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR', details?: any) {
    super(500, message, code, details);
    this.name = 'InternalServerError';
  }
}

// Export all error classes for easy importing
export {
  AppError as default
};

