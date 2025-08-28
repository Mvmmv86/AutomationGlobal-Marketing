/**
 * Rate Limiting Middleware - Automation Global v4.0
 * Provides flexible rate limiting with Redis/memory fallback
 */

import { Request, Response, NextFunction } from 'express';
import { cacheManager } from '../cache/cache-manager.js';
import { AppError } from './validation.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate Limiting Middleware Factory
 */
export function rateLimiter(
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
  options: Partial<RateLimitConfig> = {}
) {
  const config: RateLimitConfig = {
    windowMs: windowSeconds * 1000,
    maxRequests,
    message: `Too many requests for ${identifier}. Please try again later.`,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      return `${identifier}:${userId}:${ip}`;
    },
    ...options
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator!(req);
      
      // Check rate limit
      const rateLimitResult = await cacheManager.checkRateLimit(
        key,
        config.maxRequests,
        windowSeconds
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime * 1000).toISOString());

      if (!rateLimitResult.allowed) {
        throw new AppError(429, config.message!, 'RATE_LIMIT_EXCEEDED', {
          limit: config.maxRequests,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });
      }

      // Handle response completion for cleanup
      if (!config.skipSuccessfulRequests || !config.skipFailedRequests) {
        res.on('finish', () => {
          // Only decrement if we should count this response
          const shouldSkip = (config.skipSuccessfulRequests && res.statusCode < 400) ||
                           (config.skipFailedRequests && res.statusCode >= 400);
          
          if (shouldSkip) {
            // In a real implementation, you might want to decrement the counter
            // For simplicity, we're not implementing this feature here
          }
        });
      }

      next();

    } catch (error) {
      next(error);
    }
  };
}

/**
 * Predefined Rate Limiters
 */

// Authentication endpoints (stricter limits)
export const authRateLimit = rateLimiter('auth', 5, 900); // 5 attempts per 15 minutes

// API endpoints (general usage)
export const apiRateLimit = rateLimiter('api', 100, 900); // 100 requests per 15 minutes

// File upload endpoints
export const uploadRateLimit = rateLimiter('upload', 10, 3600); // 10 uploads per hour

// Organization creation (very strict)
export const orgCreateRateLimit = rateLimiter('org_create', 3, 3600); // 3 orgs per hour

// Password reset (security-sensitive)
export const passwordResetRateLimit = rateLimiter('password_reset', 3, 3600); // 3 attempts per hour

// Email sending
export const emailRateLimit = rateLimiter('email', 20, 3600); // 20 emails per hour

/**
 * Adaptive Rate Limiter
 * Adjusts limits based on user behavior and system load
 */
export function adaptiveRateLimit(
  baseIdentifier: string,
  baseLimits: { maxRequests: number; windowSeconds: number },
  options: {
    userMultiplier?: number; // Authenticated users get higher limits
    premiumMultiplier?: number; // Premium users get even higher limits
    suspiciousActivityMultiplier?: number; // Reduce limits for suspicious activity
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const organization = (req as any).organization;
      
      let multiplier = 1;
      
      // Authenticated users get higher limits
      if (user && options.userMultiplier) {
        multiplier *= options.userMultiplier;
      }
      
      // Premium organization users get even higher limits
      if (organization?.subscription_tier === 'premium' && options.premiumMultiplier) {
        multiplier *= options.premiumMultiplier;
      }
      
      // Check for suspicious activity (multiple failed requests, etc.)
      const suspiciousKey = `suspicious:${req.ip}`;
      const suspiciousActivity = await cacheManager.getCachedAPIResponse('suspicious', req.ip);
      
      if (suspiciousActivity && options.suspiciousActivityMultiplier) {
        multiplier *= options.suspiciousActivityMultiplier;
      }
      
      const adjustedLimits = {
        maxRequests: Math.floor(baseLimits.maxRequests * multiplier),
        windowSeconds: baseLimits.windowSeconds
      };
      
      // Apply the adjusted rate limit
      const rateLimitMiddleware = rateLimiter(
        baseIdentifier,
        adjustedLimits.maxRequests,
        adjustedLimits.windowSeconds,
        {
          keyGenerator: (req: Request) => {
            const ip = req.ip || 'unknown';
            const userId = user?.id || 'anonymous';
            const orgId = organization?.id || 'no-org';
            return `${baseIdentifier}:${orgId}:${userId}:${ip}`;
          }
        }
      );
      
      rateLimitMiddleware(req, res, next);
      
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Rate Limit Bypass for Internal Requests
 */
export function bypassRateLimit(req: Request, res: Response, next: NextFunction) {
  // Mark request as bypassed
  (req as any).rateLimitBypassed = true;
  next();
}

/**
 * Progressive Rate Limiting
 * Increases restrictions as user approaches limits
 */
export function progressiveRateLimit(
  identifier: string,
  limits: Array<{ maxRequests: number; windowSeconds: number; threshold: number }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${identifier}:${req.ip}:${(req as any).user?.id || 'anonymous'}`;
      
      // Check current usage across all thresholds
      let applicableLimit = limits[0]; // Default to most restrictive
      
      for (const limit of limits.sort((a, b) => a.threshold - b.threshold)) {
        const usage = await cacheManager.checkRateLimit(key, limit.maxRequests, limit.windowSeconds);
        const usagePercentage = ((limit.maxRequests - usage.remaining) / limit.maxRequests) * 100;
        
        if (usagePercentage < limit.threshold) {
          applicableLimit = limit;
          break;
        }
      }
      
      // Apply the determined limit
      const rateLimitMiddleware = rateLimiter(
        identifier,
        applicableLimit.maxRequests,
        applicableLimit.windowSeconds
      );
      
      rateLimitMiddleware(req, res, next);
      
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Rate Limit Status Endpoint
 */
export async function getRateLimitStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const ip = req.ip || 'unknown';
    const userId = user?.id || 'anonymous';
    
    const checks = [
      { name: 'API Requests', key: `api:${userId}:${ip}`, limit: 100, window: 900 },
      { name: 'Authentication', key: `auth:${userId}:${ip}`, limit: 5, window: 900 },
      { name: 'File Uploads', key: `upload:${userId}:${ip}`, limit: 10, window: 3600 }
    ];
    
    const status: any = {};
    
    for (const check of checks) {
      const result = await cacheManager.checkRateLimit(check.key, check.limit, check.window);
      status[check.name] = {
        limit: check.limit,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime * 1000).toISOString(),
        windowSeconds: check.window
      };
    }
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    next(error);
  }
}