import { db } from '../storage';
import { organizations, users, organizationUsers } from '../../shared/schema';
import { eq, sql, count, desc, asc, and, gte, lte } from 'drizzle-orm';
import { loggingService } from './logging-service';

export interface GlobalMetrics {
  organizations: {
    total: number;
    active: number;
    inactive: number;
    growthRate: number;
  };
  users: {
    total: number;
    active: number;
    lastWeek: number;
    growthRate: number;
  };
  sessions: {
    active: number;
    total: number;
    avgDuration: number;
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    avgResponseTime: number;
    costToday: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

export interface OrganizationAnalytics {
  id: string;
  name: string;
  userCount: number;
  planType: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActivity: string;
  aiUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  modules: {
    active: number;
    total: number;
    list: string[];
  };
}

export interface UserAnalytics {
  activeUsers: number;
  newUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  usersByRole: Record<string, number>;
  usersByOrganization: Array<{
    organizationId: string;
    organizationName: string;
    userCount: number;
  }>;
}

export interface TimeSeriesData {
  date: string;
  organizations: number;
  users: number;
  aiRequests: number;
  revenue: number;
}

class AdminAnalyticsService {
  /**
   * Get comprehensive global metrics
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    try {
      loggingService.info('Collecting global metrics');

      // Organizations metrics
      const [totalOrgs] = await db.select({ count: count() }).from(organizations);
      const [activeOrgs] = await db.select({ count: count() }).from(organizations)
        .where(eq(organizations.status, 'active'));
      
      // Users metrics
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [newUsersThisWeek] = await db.select({ count: count() }).from(users)
        .where(gte(users.createdAt, weekAgo));

      // Sessions metrics (mock data for now)
      const sessionsData = {
        active: 45,
        total: 1250,
        avgDuration: 28.5
      };

      // AI Usage metrics (mock data for now)
      const aiUsageData = {
        totalRequests: 15420,
        totalTokens: 2840000,
        avgResponseTime: 850,
        costToday: 127.50
      };

      // System health from logging service
      const healthMetrics = loggingService.getHealthMetrics();

      const metrics: GlobalMetrics = {
        organizations: {
          total: totalOrgs.count,
          active: activeOrgs.count,
          inactive: totalOrgs.count - activeOrgs.count,
          growthRate: 12.5 // Calculate based on historical data
        },
        users: {
          total: totalUsers.count,
          active: totalUsers.count - 5, // Mock active users
          lastWeek: newUsersThisWeek.count,
          growthRate: 8.3
        },
        sessions: sessionsData,
        aiUsage: aiUsageData,
        systemHealth: {
          uptime: healthMetrics.uptime || 0,
          responseTime: healthMetrics.avgResponseTime || 0,
          errorRate: healthMetrics.errorRate || 0,
          memoryUsage: healthMetrics.memory?.heapUsed || 0
        }
      };

      loggingService.info('Global metrics collected successfully', { metrics });
      return metrics;

    } catch (error) {
      loggingService.error('Failed to collect global metrics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get detailed organization analytics
   */
  async getOrganizationAnalytics(): Promise<OrganizationAnalytics[]> {
    try {
      loggingService.info('Collecting organization analytics');

      const orgList = await db.select({
        id: organizations.id,
        name: organizations.name,
        planType: organizations.planType,
        status: organizations.status,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt
      }).from(organizations)
        .orderBy(desc(organizations.updatedAt));

      const analytics: OrganizationAnalytics[] = [];

      for (const org of orgList) {
        // Get user count for this organization
        const [userCount] = await db.select({ count: count() })
          .from(organizationUsers)
          .where(eq(organizationUsers.organizationId, org.id));

        // Mock AI usage and modules data for now
        const orgAnalytics: OrganizationAnalytics = {
          id: org.id,
          name: org.name,
          userCount: userCount.count,
          planType: org.planType || 'starter',
          status: org.status as 'active' | 'inactive' | 'suspended',
          lastActivity: org.updatedAt?.toISOString() || org.createdAt.toISOString(),
          aiUsage: {
            requests: Math.floor(Math.random() * 1000) + 100,
            tokens: Math.floor(Math.random() * 50000) + 5000,
            cost: Math.floor(Math.random() * 100) + 10
          },
          modules: {
            active: Math.floor(Math.random() * 3) + 1,
            total: 3,
            list: ['marketing', 'support', 'trading'].slice(0, Math.floor(Math.random() * 3) + 1)
          }
        };

        analytics.push(orgAnalytics);
      }

      loggingService.info('Organization analytics collected', { count: analytics.length });
      return analytics;

    } catch (error) {
      loggingService.error('Failed to collect organization analytics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get detailed user analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      loggingService.info('Collecting user analytics');

      // Total and new users
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [newUsers] = await db.select({ count: count() }).from(users)
        .where(gte(users.createdAt, weekAgo));

      // Users by organization
      const usersByOrg = await db.select({
        organizationId: organizationUsers.organizationId,
        organizationName: organizations.name,
        userCount: count()
      })
        .from(organizationUsers)
        .leftJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .groupBy(organizationUsers.organizationId, organizations.name);

      const analytics: UserAnalytics = {
        activeUsers: Math.floor(totalUsers.count * 0.7), // Mock active users (70%)
        newUsers: newUsers.count,
        totalSessions: Math.floor(totalUsers.count * 1.3), // Mock sessions
        avgSessionDuration: 25.4, // Mock average session duration
        usersByRole: { // Mock role distribution
          super_admin: 1,
          org_admin: Math.floor(totalUsers.count * 0.1),
          org_user: Math.floor(totalUsers.count * 0.8),
          org_viewer: Math.floor(totalUsers.count * 0.1)
        },
        usersByOrganization: usersByOrg.map(item => ({
          organizationId: item.organizationId,
          organizationName: item.organizationName || 'Unknown',
          userCount: item.userCount
        }))
      };

      loggingService.info('User analytics collected', { analytics });
      return analytics;

    } catch (error) {
      loggingService.error('Failed to collect user analytics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    try {
      loggingService.info('Collecting time series data', { days });

      const timeSeriesData: TimeSeriesData[] = [];
      const now = new Date();

      // Generate mock time series data for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Mock realistic growth data
        const baseOrgs = 5;
        const baseUsers = 20;
        const growthFactor = (days - i) / days;
        
        timeSeriesData.push({
          date: date.toISOString().split('T')[0],
          organizations: Math.floor(baseOrgs + (growthFactor * 10) + Math.random() * 3),
          users: Math.floor(baseUsers + (growthFactor * 50) + Math.random() * 10),
          aiRequests: Math.floor(100 + (growthFactor * 500) + Math.random() * 100),
          revenue: Math.floor(500 + (growthFactor * 2000) + Math.random() * 200)
        });
      }

      loggingService.info('Time series data generated', { points: timeSeriesData.length });
      return timeSeriesData;

    } catch (error) {
      loggingService.error('Failed to generate time series data', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get real-time system status
   */
  async getSystemStatus() {
    try {
      const healthMetrics = loggingService.getHealthMetrics();
      
      return {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: Math.random() * 60 + 20, // Mock CPU usage 20-80%
          cores: 4
        },
        memory: {
          used: healthMetrics.memory?.heapUsed || 0,
          total: healthMetrics.memory?.heapTotal || 0,
          percentage: healthMetrics.memory?.heapUsed && healthMetrics.memory?.heapTotal 
            ? (healthMetrics.memory.heapUsed / healthMetrics.memory.heapTotal) * 100
            : 0
        },
        database: {
          status: 'connected',
          responseTime: Math.random() * 50 + 10, // Mock DB response time
          connections: Math.floor(Math.random() * 20) + 5
        },
        redis: {
          status: 'degraded', // Since Redis is not available in our setup
          responseTime: 0,
          memoryUsage: 0
        },
        api: {
          requestsPerMinute: Math.floor(Math.random() * 100) + 50,
          avgResponseTime: healthMetrics.avgResponseTime || 0,
          errorRate: healthMetrics.errorRate || 0
        }
      };

    } catch (error) {
      loggingService.error('Failed to get system status', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();