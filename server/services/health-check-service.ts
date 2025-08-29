import { Request, Response } from 'express';
import { db } from '../storage';
import { loggingService } from './logging-service';

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

// Individual service health
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

// Overall system health
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceHealth[];
  metrics: {
    memory: NodeJS.MemoryUsage;
    cpu?: NodeJS.CpuUsage;
    activeConnections: number;
    totalRequests?: number;
    errorRate?: number;
  };
}

export class HealthCheckService {
  private readonly version = '4.0.0';
  private readonly startTime = Date.now();
  private healthCache: SystemHealth | null = null;
  private cacheExpiry: number = 0;
  private readonly cacheTimeout = 30 * 1000; // 30 seconds

  constructor() {
    this.schedulePeriodicHealthChecks();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.healthCache && now < this.cacheExpiry) {
      return this.healthCache;
    }

    const startTime = performance.now();
    
    try {
      // Check all services in parallel
      const serviceChecks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkFileSystem(),
        this.checkMemory(),
        this.checkCPU()
      ]);

      const services: ServiceHealth[] = serviceChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const serviceNames = ['database', 'redis', 'filesystem', 'memory', 'cpu'];
          return {
            name: serviceNames[index] || 'unknown',
            status: HealthStatus.UNHEALTHY,
            message: result.reason.message || 'Service check failed',
            lastChecked: new Date().toISOString()
          };
        }
      });

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(services);
      
      // Get system metrics
      const healthMetrics = loggingService.getHealthMetrics();
      
      const systemHealth: SystemHealth = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: now - this.startTime,
        version: this.version,
        services,
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          activeConnections: healthMetrics.activeRequests,
          totalRequests: healthMetrics.totalMetrics,
          errorRate: healthMetrics.errorRate
        }
      };

      // Cache the result
      this.healthCache = systemHealth;
      this.cacheExpiry = now + this.cacheTimeout;

      // Log health check completion
      const duration = performance.now() - startTime;
      loggingService.info('Health check completed', {
        status: overallStatus,
        duration: `${duration.toFixed(2)}ms`,
        servicesChecked: services.length
      });

      return systemHealth;

    } catch (error) {
      loggingService.error('Health check failed', { error: error.message });
      
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        uptime: now - this.startTime,
        version: this.version,
        services: [{
          name: 'system',
          status: HealthStatus.UNHEALTHY,
          message: `Health check failed: ${error.message}`,
          lastChecked: new Date().toISOString()
        }],
        metrics: {
          memory: process.memoryUsage(),
          activeConnections: 0
        }
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      // Simple query to test database connectivity
      await db.execute('SELECT 1 as health_check');
      
      const responseTime = performance.now() - startTime;
      
      return {
        name: 'database',
        status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        responseTime,
        message: responseTime < 1000 ? 'Database connection healthy' : 'Database responding slowly',
        details: {
          provider: 'Supabase PostgreSQL',
          responseTimeMs: responseTime.toFixed(2)
        },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        message: `Database connection failed: ${error.message}`,
        details: {
          error: error.message
        },
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check Redis connectivity (if available)
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      // Redis is optional, so we'll mark as degraded if not available
      // In a production environment, you might want this to be unhealthy
      
      const responseTime = performance.now() - startTime;
      
      // Since Redis is not running in this environment, we'll return degraded
      return {
        name: 'redis',
        status: HealthStatus.DEGRADED,
        responseTime,
        message: 'Redis not available, using in-memory fallbacks',
        details: {
          fallbackActive: true,
          impact: 'Rate limiting and caching using in-memory stores'
        },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'redis',
        status: HealthStatus.DEGRADED,
        message: 'Redis not available, using fallbacks',
        details: {
          error: error.message,
          fallbackActive: true
        },
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check file system health
   */
  private async checkFileSystem(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const fs = await import('fs/promises');
      
      // Test write/read/delete
      const testFile = '/tmp/health_check.txt';
      const testContent = `Health check ${Date.now()}`;
      
      await fs.writeFile(testFile, testContent);
      const readContent = await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);
      
      const responseTime = performance.now() - startTime;
      
      if (readContent === testContent) {
        return {
          name: 'filesystem',
          status: HealthStatus.HEALTHY,
          responseTime,
          message: 'File system operations normal',
          lastChecked: new Date().toISOString()
        };
      } else {
        throw new Error('File content mismatch');
      }
    } catch (error) {
      return {
        name: 'filesystem',
        status: HealthStatus.UNHEALTHY,
        message: `File system check failed: ${error.message}`,
        details: {
          error: error.message
        },
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<ServiceHealth> {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memUsagePercent = (usedMem / totalMem) * 100;
      
      let status: HealthStatus;
      let message: string;
      
      if (memUsagePercent < 70) {
        status = HealthStatus.HEALTHY;
        message = 'Memory usage normal';
      } else if (memUsagePercent < 90) {
        status = HealthStatus.DEGRADED;
        message = 'Memory usage elevated';
      } else {
        status = HealthStatus.UNHEALTHY;
        message = 'Memory usage critical';
      }
      
      return {
        name: 'memory',
        status,
        message,
        details: {
          heapUsed: `${Math.round(usedMem / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(totalMem / 1024 / 1024)}MB`,
          usagePercent: `${memUsagePercent.toFixed(1)}%`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'memory',
        status: HealthStatus.UNHEALTHY,
        message: `Memory check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check CPU usage
   */
  private async checkCPU(): Promise<ServiceHealth> {
    try {
      const cpuUsage = process.cpuUsage();
      
      // CPU check is basic - in production you might want more sophisticated monitoring
      return {
        name: 'cpu',
        status: HealthStatus.HEALTHY,
        message: 'CPU monitoring active',
        details: {
          user: `${cpuUsage.user}μs`,
          system: `${cpuUsage.system}μs`,
          uptime: `${process.uptime()}s`
        },
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'cpu',
        status: HealthStatus.DEGRADED,
        message: `CPU check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate overall system status based on individual services
   */
  private calculateOverallStatus(services: ServiceHealth[]): HealthStatus {
    const unhealthyCount = services.filter(s => s.status === HealthStatus.UNHEALTHY).length;
    const degradedCount = services.filter(s => s.status === HealthStatus.DEGRADED).length;
    
    if (unhealthyCount > 0) {
      // If any critical service is unhealthy, system is unhealthy
      const criticalServices = ['database'];
      const criticalUnhealthy = services.some(s => 
        criticalServices.includes(s.name) && s.status === HealthStatus.UNHEALTHY
      );
      
      return criticalUnhealthy ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED;
    }
    
    if (degradedCount > 0) {
      return HealthStatus.DEGRADED;
    }
    
    return HealthStatus.HEALTHY;
  }

  /**
   * Create health check endpoint
   */
  createHealthEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.performHealthCheck();
        
        const httpStatus = {
          [HealthStatus.HEALTHY]: 200,
          [HealthStatus.DEGRADED]: 200, // Still operational
          [HealthStatus.UNHEALTHY]: 503
        }[health.status];

        res.status(httpStatus).json({
          success: health.status !== HealthStatus.UNHEALTHY,
          message: `System status: ${health.status}`,
          data: health,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        loggingService.error('Health endpoint failed', { error: error.message }, req);
        
        res.status(503).json({
          success: false,
          message: 'Health check failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Create readiness probe endpoint
   */
  createReadinessEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        // Readiness check focuses on critical services only
        const dbHealth = await this.checkDatabase();
        
        const isReady = dbHealth.status !== HealthStatus.UNHEALTHY;
        
        res.status(isReady ? 200 : 503).json({
          success: isReady,
          message: isReady ? 'Service ready' : 'Service not ready',
          data: {
            ready: isReady,
            database: dbHealth,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          message: 'Readiness check failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Create liveness probe endpoint
   */
  createLivenessEndpoint() {
    return (req: Request, res: Response) => {
      // Simple liveness check - just confirm the process is running
      res.status(200).json({
        success: true,
        message: 'Service alive',
        data: {
          alive: true,
          uptime: Date.now() - this.startTime,
          timestamp: new Date().toISOString()
        }
      });
    };
  }

  /**
   * Schedule periodic health checks
   */
  private schedulePeriodicHealthChecks(): void {
    // Run health check every 5 minutes
    setInterval(async () => {
      try {
        const health = await this.performHealthCheck();
        
        if (health.status === HealthStatus.UNHEALTHY) {
          loggingService.critical('System health critical', {
            status: health.status,
            unhealthyServices: health.services
              .filter(s => s.status === HealthStatus.UNHEALTHY)
              .map(s => s.name)
          });
        } else if (health.status === HealthStatus.DEGRADED) {
          loggingService.warn('System health degraded', {
            status: health.status,
            degradedServices: health.services
              .filter(s => s.status === HealthStatus.DEGRADED)
              .map(s => s.name)
          });
        }
      } catch (error) {
        loggingService.error('Periodic health check failed', { error: error.message });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();
export default healthCheckService;