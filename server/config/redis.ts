/**
 * Redis Configuration
 * Automation Global v4.0
 * 
 * Redis configuration for caching, session storage, and message queuing
 */

import { CONFIG } from '../config';

// Redis connection configuration
export const redisConfig = {
  url: CONFIG.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  db: 0, // Database number for general cache
};

// Session storage configuration
export const sessionRedisConfig = {
  ...redisConfig,
  db: 1, // Separate database for sessions
  keyPrefix: 'session:',
};

// Queue configuration for background jobs
export const queueRedisConfig = {
  ...redisConfig,
  db: 2, // Separate database for queues
  keyPrefix: 'queue:',
};

// Cache key patterns
export const cacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,
  
  // Organization cache keys
  organization: (id: string) => `org:${id}`,
  organizationUsers: (orgId: string) => `org:users:${orgId}`,
  organizationModules: (orgId: string) => `org:modules:${orgId}`,
  organizationSettings: (orgId: string) => `org:settings:${orgId}`,
  
  // AI usage cache keys
  aiUsageStats: (orgId: string, period: string) => `ai:stats:${orgId}:${period}`,
  aiProviderStatus: (providerId: string) => `ai:provider:${providerId}`,
  
  // Rate limiting keys
  rateLimitUser: (userId: string) => `ratelimit:user:${userId}`,
  rateLimitOrg: (orgId: string) => `ratelimit:org:${orgId}`,
  rateLimitIP: (ip: string) => `ratelimit:ip:${ip}`,
  
  // Automation cache keys
  automationConfig: (automationId: string) => `automation:${automationId}`,
  automationSchedule: (orgId: string) => `automation:schedule:${orgId}`,
} as const;

// Cache TTL values (in seconds)
export const cacheTTL = {
  user: 300, // 5 minutes
  organization: 600, // 10 minutes
  aiStats: 60, // 1 minute (frequently updated)
  settings: 1800, // 30 minutes
  rateLimit: 900, // 15 minutes
  session: 86400, // 24 hours
} as const;

// Redis key patterns for cleanup
export const keyPatterns = {
  allSessions: 'session:*',
  userSessions: (userId: string) => `session:*:${userId}`,
  orgCache: (orgId: string) => `*:${orgId}*`,
  expiredKeys: 'expired:*',
} as const;

export default {
  redisConfig,
  sessionRedisConfig,
  queueRedisConfig,
  cacheKeys,
  cacheTTL,
  keyPatterns,
};