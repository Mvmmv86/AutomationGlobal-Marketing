import { Request, Response } from 'express';
import { performance } from 'perf_hooks';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, any>;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  duration?: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
  userId?: string;
  organizationId?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

// Audit log entry
export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ip: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export class LoggingService {
  private logs: LogEntry[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private maxLogEntries = 10000; // Prevent memory overflow
  private startTime = Date.now();
  
  // Request tracking
  private activeRequests = new Map<string, { startTime: number; cpuUsage: NodeJS.CpuUsage }>();
  
  constructor() {
    this.setupCleanupInterval();
    this.logSystemStart();
  }

  /**
   * Generate unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log a message with structured data
   */
  log(level: LogLevel, message: string, metadata: Record<string, any> = {}, req?: Request): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      userId: (req as any)?.user?.id,
      organizationId: (req as any)?.tenant?.organizationId,
      requestId: (req as any)?.requestId,
      endpoint: req?.route?.path || req?.path,
      method: req?.method,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip || req?.connection.remoteAddress
    };

    // Console output with color coding
    const colorCode = this.getLogColor(level);
    const formattedMessage = this.formatLogMessage(entry);
    
    console.log(colorCode + formattedMessage + '\x1b[0m');

    // Store in memory (with rotation)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(message: string, metadata?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.DEBUG, message, metadata, req);
  }

  info(message: string, metadata?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.INFO, message, metadata, req);
  }

  warn(message: string, metadata?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.WARN, message, metadata, req);
  }

  error(message: string, metadata?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.ERROR, message, metadata, req);
  }

  critical(message: string, metadata?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.CRITICAL, message, metadata, req);
  }

  /**
   * Start performance tracking for a request
   */
  startPerformanceTracking(req: Request): void {
    const requestId = this.generateRequestId();
    (req as any).requestId = requestId;
    (req as any).startTime = performance.now();
    
    this.activeRequests.set(requestId, {
      startTime: performance.now(),
      cpuUsage: process.cpuUsage()
    });
  }

  /**
   * End performance tracking and record metrics
   */
  endPerformanceTracking(req: Request, res: Response): void {
    const requestId = (req as any).requestId;
    const startTime = (req as any).startTime;
    
    if (!requestId || !startTime) return;

    const endTime = performance.now();
    const duration = endTime - startTime;
    const tracking = this.activeRequests.get(requestId);
    
    const metrics: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: Date.now(),
      userId: (req as any).user?.id,
      organizationId: (req as any).tenant?.organizationId,
      memoryUsage: process.memoryUsage(),
      cpuUsage: tracking ? process.cpuUsage(tracking.cpuUsage) : undefined
    };

    this.performanceMetrics.push(metrics);
    if (this.performanceMetrics.length > this.maxLogEntries) {
      this.performanceMetrics.shift();
    }

    this.activeRequests.delete(requestId);

    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      this.warn('Slow request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: metrics.statusCode
      }, req);
    }
  }

  /**
   * Log audit trail entry
   */
  logAudit(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    req: Request,
    success: boolean = true,
    resourceId?: string,
    errorMessage?: string
  ): void {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      organizationId: (req as any).tenant?.organizationId,
      action,
      resource,
      resourceId,
      details,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      success,
      errorMessage
    };

    this.auditLogs.push(auditEntry);
    if (this.auditLogs.length > this.maxLogEntries) {
      this.auditLogs.shift();
    }

    // Also log as regular log entry
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Audit: ${action} ${resource}${resourceId ? ` (${resourceId})` : ''}`;
    
    this.log(level, message, {
      audit: true,
      action,
      resource,
      resourceId,
      success,
      details
    }, req);
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics(): {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    activeRequests: number;
    totalLogs: number;
    totalMetrics: number;
    totalAuditLogs: number;
    averageResponseTime?: number;
    errorRate?: number;
  } {
    const recentMetrics = this.performanceMetrics.slice(-1000); // Last 1000 requests
    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : undefined;
    
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = recentMetrics.length > 0 ? (errorCount / recentMetrics.length) * 100 : undefined;

    return {
      uptime: Date.now() - this.startTime,
      memory: process.memoryUsage(),
      activeRequests: this.activeRequests.size,
      totalLogs: this.logs.length,
      totalMetrics: this.performanceMetrics.length,
      totalAuditLogs: this.auditLogs.length,
      averageResponseTime,
      errorRate
    };
  }

  /**
   * Get recent logs with filtering
   */
  getRecentLogs(
    limit: number = 100,
    level?: LogLevel,
    userId?: string,
    organizationId?: string
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (organizationId) {
      filteredLogs = filteredLogs.filter(log => log.organizationId === organizationId);
    }

    return filteredLogs.slice(-limit);
  }

  /**
   * Get performance metrics with filtering
   */
  getPerformanceMetrics(
    limit: number = 100,
    endpoint?: string,
    userId?: string,
    organizationId?: string
  ): PerformanceMetrics[] {
    let filtered = this.performanceMetrics;

    if (endpoint) {
      filtered = filtered.filter(metric => metric.endpoint === endpoint);
    }

    if (userId) {
      filtered = filtered.filter(metric => metric.userId === userId);
    }

    if (organizationId) {
      filtered = filtered.filter(metric => metric.organizationId === organizationId);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(
    limit: number = 100,
    userId?: string,
    organizationId?: string,
    action?: string,
    resource?: string
  ): AuditLogEntry[] {
    let filtered = this.auditLogs;

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    if (organizationId) {
      filtered = filtered.filter(log => log.organizationId === organizationId);
    }

    if (action) {
      filtered = filtered.filter(log => log.action === action);
    }

    if (resource) {
      filtered = filtered.filter(log => log.resource === resource);
    }

    return filtered.slice(-limit);
  }

  /**
   * Create request logging middleware
   */
  createRequestMiddleware() {
    return (req: Request, res: Response, next: Function) => {
      this.startPerformanceTracking(req);
      
      // Log request start
      this.info('Request started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      }, req);

      // Hook into response finish
      const originalSend = res.send;
      res.send = function(data) {
        // Log response
        loggingService.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          contentLength: data?.length || 0
        }, req);

        loggingService.endPerformanceTracking(req, res);
        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Format log message for console output
   */
  private formatLogMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(8);
    const requestInfo = entry.requestId ? `[${entry.requestId}] ` : '';
    const userInfo = entry.userId ? `[user:${entry.userId}] ` : '';
    const orgInfo = entry.organizationId ? `[org:${entry.organizationId}] ` : '';
    
    let message = `${timestamp} ${level} ${requestInfo}${userInfo}${orgInfo}${entry.message}`;
    
    if (Object.keys(entry.metadata).length > 0) {
      message += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    return message;
  }

  /**
   * Get console color for log level
   */
  private getLogColor(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m' // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  /**
   * Set up periodic cleanup of old logs
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      // Clean up logs older than 24 hours
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      
      this.logs = this.logs.filter(log => 
        new Date(log.timestamp).getTime() > cutoff
      );
      
      this.performanceMetrics = this.performanceMetrics.filter(metric => 
        metric.timestamp > cutoff
      );
      
      this.auditLogs = this.auditLogs.filter(log => 
        new Date(log.timestamp).getTime() > cutoff
      );

    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Log system startup
   */
  private logSystemStart(): void {
    this.info('🚀 Automation Global v4.0 - Logging Service Started', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      pid: process.pid
    });
  }
}

// Singleton instance
export const loggingService = new LoggingService();
export default loggingService;