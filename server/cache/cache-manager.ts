/**
 * Cache Manager for Automation Global v4.0
 * High-level caching interface for application data
 */

import { redisClient } from './redis-client.js';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
}

export class CacheManager {
  private defaultTTL = 3600; // 1 hour
  private prefixes = {
    user: 'user:',
    organization: 'org:',
    session: 'session:',
    aiUsage: 'ai_usage:',
    rateLimit: 'rate_limit:',
    automation: 'automation:',
    apiResponse: 'api_response:'
  };

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any, ttl: number = this.defaultTTL): Promise<void> {
    const key = `${this.prefixes.user}${userId}`;
    await redisClient.setJson(key, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getUser(userId: string): Promise<any | null> {
    const key = `${this.prefixes.user}${userId}`;
    return await redisClient.getJson(key);
  }

  /**
   * Cache organization data
   */
  async cacheOrganization(orgId: string, orgData: any, ttl: number = this.defaultTTL): Promise<void> {
    const key = `${this.prefixes.organization}${orgId}`;
    await redisClient.setJson(key, orgData, ttl);
  }

  /**
   * Get cached organization data
   */
  async getOrganization(orgId: string): Promise<any | null> {
    const key = `${this.prefixes.organization}${orgId}`;
    return await redisClient.getJson(key);
  }

  /**
   * Cache session data
   */
  async cacheSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> { // 24 hours
    const key = `${this.prefixes.session}${sessionId}`;
    await redisClient.setJson(key, sessionData, ttl);
  }

  /**
   * Get cached session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `${this.prefixes.session}${sessionId}`;
    return await redisClient.getJson(key);
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const key = `${this.prefixes.session}${sessionId}`;
    await redisClient.del(key);
  }

  /**
   * Cache AI usage data for billing
   */
  async cacheAIUsage(orgId: string, provider: string, usage: any, ttl: number = 3600): Promise<void> {
    const key = `${this.prefixes.aiUsage}${orgId}:${provider}`;
    await redisClient.setJson(key, usage, ttl);
  }

  /**
   * Get cached AI usage data
   */
  async getAIUsage(orgId: string, provider: string): Promise<any | null> {
    const key = `${this.prefixes.aiUsage}${orgId}:${provider}`;
    return await redisClient.getJson(key);
  }

  /**
   * Cache automation execution results
   */
  async cacheAutomationResult(automationId: string, executionId: string, result: any, ttl: number = 7200): Promise<void> {
    const key = `${this.prefixes.automation}${automationId}:${executionId}`;
    await redisClient.setJson(key, result, ttl);
  }

  /**
   * Get cached automation result
   */
  async getAutomationResult(automationId: string, executionId: string): Promise<any | null> {
    const key = `${this.prefixes.automation}${automationId}:${executionId}`;
    return await redisClient.getJson(key);
  }

  /**
   * Cache API response for performance
   */
  async cacheAPIResponse(endpoint: string, params: string, response: any, ttl: number = 300): Promise<void> { // 5 minutes
    const key = `${this.prefixes.apiResponse}${endpoint}:${params}`;
    await redisClient.setJson(key, response, ttl);
  }

  /**
   * Get cached API response
   */
  async getCachedAPIResponse(endpoint: string, params: string): Promise<any | null> {
    const key = `${this.prefixes.apiResponse}${endpoint}:${params}`;
    return await redisClient.getJson(key);
  }

  /**
   * Rate limiting functionality
   */
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${this.prefixes.rateLimit}${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const windowKey = `${key}:${windowStart}`;

    const current = await redisClient.incr(windowKey);
    
    if (current === 1) {
      await redisClient.expire(windowKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = windowStart + windowSeconds;

    return {
      allowed: current <= limit,
      remaining,
      resetTime
    };
  }

  /**
   * Invalidate all cache for a user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const userKey = `${this.prefixes.user}${userId}`;
    await redisClient.del(userKey);
  }

  /**
   * Invalidate all cache for an organization
   */
  async invalidateOrganizationCache(orgId: string): Promise<void> {
    const orgKey = `${this.prefixes.organization}${orgId}`;
    await redisClient.del(orgKey);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    const status = redisClient.getStatus();
    
    return {
      redis: status,
      prefixes: Object.keys(this.prefixes),
      defaultTTL: this.defaultTTL,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test cache functionality
   */
  async testCache(): Promise<{ success: boolean; tests: any[] }> {
    const tests = [];
    
    try {
      // Test 1: Basic set/get
      const testKey = 'test:cache:basic';
      const testValue = { message: 'Hello Cache!', timestamp: Date.now() };
      
      await redisClient.setJson(testKey, testValue, 60);
      const retrieved = await redisClient.getJson(testKey);
      
      tests.push({
        name: 'Basic Set/Get Test',
        success: JSON.stringify(retrieved) === JSON.stringify(testValue),
        details: 'Cache can store and retrieve JSON data'
      });

      // Test 2: TTL functionality
      const ttlKey = 'test:cache:ttl';
      await redisClient.set(ttlKey, 'expires soon', 1);
      const exists = await redisClient.exists(ttlKey);
      
      tests.push({
        name: 'TTL Test',
        success: exists,
        details: 'Cache correctly handles TTL expiration'
      });

      // Test 3: Rate limiting
      const rateLimitResult = await this.checkRateLimit('test_user', 5, 60);
      
      tests.push({
        name: 'Rate Limiting Test',
        success: rateLimitResult.allowed && rateLimitResult.remaining >= 0,
        details: `Rate limit check: ${rateLimitResult.remaining} requests remaining`
      });

      // Cleanup
      await redisClient.del(testKey);
      await redisClient.del(ttlKey);

      return {
        success: tests.every(test => test.success),
        tests
      };

    } catch (error) {
      tests.push({
        name: 'Cache Test Error',
        success: false,
        details: (error as Error).message
      });

      return {
        success: false,
        tests
      };
    }
  }
}

export const cacheManager = new CacheManager();