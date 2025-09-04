import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

// Rate limit configurations by endpoint and role
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitRules {
  [endpoint: string]: {
    [role: string]: RateLimitConfig;
  };
}

// Rate limit rules based on roles and endpoints
const RATE_LIMIT_RULES: RateLimitRules = {
  // Authentication endpoints
  '/api/auth/*': {
    'anonymous': { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes
    'org_user': { windowMs: 5 * 60 * 1000, maxRequests: 20 }, // 20 requests per 5 minutes
    'org_admin': { windowMs: 5 * 60 * 1000, maxRequests: 50 },
    'super_admin': { windowMs: 60 * 1000, maxRequests: 100 }
  },
  
  // General API endpoints
  '/api/*': {
    'anonymous': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // Very restrictive for anonymous
    'org_viewer': { windowMs: 60 * 1000, maxRequests: 50 },
    'org_user': { windowMs: 60 * 1000, maxRequests: 100 },
    'org_manager': { windowMs: 60 * 1000, maxRequests: 200 },
    'org_admin': { windowMs: 60 * 1000, maxRequests: 500 },
    'org_owner': { windowMs: 60 * 1000, maxRequests: 800 },
    'super_admin': { windowMs: 60 * 1000, maxRequests: 1000 }
  },

  // AI endpoints - more restrictive due to cost
  '/api/ai/*': {
    'org_user': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
    'org_manager': { windowMs: 60 * 60 * 1000, maxRequests: 50 },
    'org_admin': { windowMs: 60 * 60 * 1000, maxRequests: 100 },
    'org_owner': { windowMs: 60 * 60 * 1000, maxRequests: 200 },
    'super_admin': { windowMs: 60 * 60 * 1000, maxRequests: 500 }
  },

  // Permissions endpoints - moderate limits
  '/api/permissions/*': {
    'org_user': { windowMs: 60 * 1000, maxRequests: 30 },
    'org_manager': { windowMs: 60 * 1000, maxRequests: 60 },
    'org_admin': { windowMs: 60 * 1000, maxRequests: 120 },
    'super_admin': { windowMs: 60 * 1000, maxRequests: 300 }
  }
};

export class RateLimitService {
  private redis: Redis;
  private useInMemory: boolean = false;
  private inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    try {
      this.redis = new Redis({
        host: 'localhost',
        port: 6379,
        retryDelayOnFailure: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis not available for rate limiting, using in-memory store:', err.message);
        this.useInMemory = true;
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected for rate limiting');
        this.useInMemory = false;
      });

    } catch (error) {
      console.warn('⚠️ Redis initialization failed, using in-memory rate limiting');
      this.useInMemory = true;
    }
  }

  /**
   * Generate rate limit key based on user, organization, and endpoint
   */
  private generateKey(req: Request, endpoint: string): string {
    const userId = (req as any).user?.id || 'anonymous';
    const orgId = (req as any).tenant?.organizationId || 'no-org';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    return `rate_limit:${endpoint}:${userId}:${orgId}:${ip}`;
  }

  /**
   * Get user role for rate limiting
   */
  private getUserRole(req: Request): string {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    
    if (!user) return 'anonymous';
    if (!tenant) return 'org_user'; // Default role if no tenant context
    
    return tenant.role || 'org_user';
  }

  /**
   * Find matching rate limit rule for endpoint
   */
  private findRateLimitRule(endpoint: string, role: string): RateLimitConfig | null {
    // Exact match first
    if (RATE_LIMIT_RULES[endpoint]?.[role]) {
      return RATE_LIMIT_RULES[endpoint][role];
    }

    // Pattern matching (e.g., /api/auth/* matches /api/auth/login)
    for (const pattern in RATE_LIMIT_RULES) {
      if (pattern.endsWith('*')) {
        const basePattern = pattern.slice(0, -1);
        if (endpoint.startsWith(basePattern) && RATE_LIMIT_RULES[pattern][role]) {
          return RATE_LIMIT_RULES[pattern][role];
        }
      }
    }

    // Default rule
    const defaultRule = RATE_LIMIT_RULES['/api/*']?.[role] || 
                       RATE_LIMIT_RULES['/api/*']?.['org_user'];
    return defaultRule || { windowMs: 60 * 1000, maxRequests: 10 };
  }

  /**
   * Check rate limit using Redis or in-memory store
   */
  private async checkRateLimit(key: string, config: RateLimitConfig): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.useInMemory) {
      return this.checkRateLimitInMemory(key, config, now);
    }

    try {
      // Use Redis sliding window log approach
      const multi = this.redis.multi();
      
      // Remove expired entries
      multi.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current requests in window
      multi.zcard(key);
      
      // Add current request
      multi.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set key expiration
      multi.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis transaction failed');
      }

      const count = (results[1][1] as number) || 0;
      const allowed = count < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count - 1);
      const resetTime = now + config.windowMs;

      return { allowed, count: count + 1, remaining, resetTime };

    } catch (error) {
      console.warn('Redis rate limit check failed, falling back to in-memory:', error.message);
      this.useInMemory = true;
      return this.checkRateLimitInMemory(key, config, now);
    }
  }

  /**
   * In-memory rate limiting fallback
   */
  private checkRateLimitInMemory(key: string, config: RateLimitConfig, now: number): {
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  } {
    // DESENVOLVIMENTO: Sempre permitir todas as requisições
    return {
      allowed: true,
      count: 1,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimitMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const endpoint = req.route?.path || req.path;
        const role = this.getUserRole(req);
        const config = this.findRateLimitRule(endpoint, role);
        
        if (!config) {
          return next();
        }

        const key = this.generateKey(req, endpoint);
        const result = await this.checkRateLimit(key, config);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'X-RateLimit-Window': (config.windowMs / 1000).toString()
        });

        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
          
          res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            data: {
              limit: config.maxRequests,
              remaining: result.remaining,
              resetTime: new Date(result.resetTime).toISOString(),
              retryAfter
            },
            timestamp: new Date().toISOString()
          });
          
          return;
        }

        next();
      } catch (error) {
        console.error('❌ Rate limiting middleware error:', error);
        // On error, allow request to proceed (fail open)
        next();
      }
    };
  }

  /**
   * Get current rate limit status for a user/endpoint
   */
  async getRateLimitStatus(req: Request, endpoint?: string): Promise<{
    endpoint: string;
    role: string;
    limit: number;
    remaining: number;
    resetTime: number;
    windowMs: number;
  } | null> {
    try {
      const targetEndpoint = endpoint || req.route?.path || req.path;
      const role = this.getUserRole(req);
      const config = this.findRateLimitRule(targetEndpoint, role);
      
      if (!config) return null;

      const key = this.generateKey(req, targetEndpoint);
      const result = await this.checkRateLimit(key, config);

      return {
        endpoint: targetEndpoint,
        role,
        limit: config.maxRequests,
        remaining: result.remaining,
        resetTime: result.resetTime,
        windowMs: config.windowMs
      };
    } catch (error) {
      console.error('❌ Error getting rate limit status:', error);
      return null;
    }
  }

  /**
   * Clear rate limit for a specific key (admin function)
   */
  async clearRateLimit(userId: string, orgId: string, endpoint: string): Promise<boolean> {
    try {
      const key = `rate_limit:${endpoint}:${userId}:${orgId}:*`;
      
      if (this.useInMemory) {
        // Clear from in-memory store
        for (const [storedKey] of this.inMemoryStore) {
          if (storedKey.includes(`${userId}:${orgId}`)) {
            this.inMemoryStore.delete(storedKey);
          }
        }
        return true;
      }

      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('❌ Error clearing rate limit:', error);
      return false;
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();
export default rateLimitService;