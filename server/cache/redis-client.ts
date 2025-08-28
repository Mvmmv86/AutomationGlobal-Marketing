/**
 * Redis Client Configuration for Automation Global v4.0
 * Handles caching, session storage, and rate limiting
 */

import Redis from 'ioredis';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export class RedisClient {
  private redis: Redis | null = null;
  private isConnected = false;
  private fallbackCache = new Map<string, { value: any; expires: number }>();

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Try to connect to Redis (fallback to memory if not available)
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      console.log('🔄 Attempting Redis connection...');
      
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectionTimeout: 5000,
        commandTimeout: 3000
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
      console.log('✅ Redis connected successfully!');

      this.redis.on('error', (error) => {
        console.warn('⚠️ Redis connection error, falling back to memory cache:', error.message);
        this.isConnected = false;
      });

      this.redis.on('disconnect', () => {
        console.warn('⚠️ Redis disconnected, using memory cache');
        this.isConnected = false;
      });

    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory cache:', (error as Error).message);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache (Redis or fallback memory)
   */
  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.redis) {
      try {
        return await this.redis.get(key);
      } catch (error) {
        console.warn('Redis get error, falling back to memory:', (error as Error).message);
        return this.getFromMemory(key);
      }
    }
    return this.getFromMemory(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, value);
        } else {
          await this.redis.set(key, value);
        }
        return;
      } catch (error) {
        console.warn('Redis set error, falling back to memory:', (error as Error).message);
      }
    }
    this.setInMemory(key, value, ttlSeconds);
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        console.warn('Redis del error, falling back to memory:', (error as Error).message);
      }
    }
    this.fallbackCache.delete(key);
  }

  /**
   * Set value with JSON serialization
   */
  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Get value with JSON deserialization
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Failed to parse JSON from cache:', (error as Error).message);
      return null;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    if (this.isConnected && this.redis) {
      try {
        return await this.redis.incr(key);
      } catch (error) {
        console.warn('Redis incr error, falling back to memory:', (error as Error).message);
      }
    }
    
    // Memory fallback
    const current = this.getFromMemory(key);
    const newValue = current ? parseInt(current) + 1 : 1;
    this.setInMemory(key, newValue.toString());
    return newValue;
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.expire(key, seconds);
        return;
      } catch (error) {
        console.warn('Redis expire error:', (error as Error).message);
      }
    }
    
    // Memory fallback - update expiration
    const item = this.fallbackCache.get(key);
    if (item) {
      item.expires = Date.now() + (seconds * 1000);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.isConnected && this.redis) {
      try {
        const result = await this.redis.exists(key);
        return result === 1;
      } catch (error) {
        console.warn('Redis exists error:', (error as Error).message);
      }
    }
    
    const item = this.fallbackCache.get(key);
    if (!item) return false;
    
    if (item.expires && Date.now() > item.expires) {
      this.fallbackCache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Memory fallback methods
   */
  private getFromMemory(key: string): string | null {
    const item = this.fallbackCache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.fallbackCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private setInMemory(key: string, value: string, ttlSeconds?: number): void {
    const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.fallbackCache.set(key, { value, expires });
  }

  /**
   * Clean expired keys from memory cache
   */
  private cleanExpiredKeys(): void {
    const now = Date.now();
    for (const [key, item] of this.fallbackCache.entries()) {
      if (item.expires && now > item.expires) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; mode: string; keyCount: number } {
    this.cleanExpiredKeys();
    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'redis' : 'memory',
      keyCount: this.isConnected ? 0 : this.fallbackCache.size
    };
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const redisClient = new RedisClient();