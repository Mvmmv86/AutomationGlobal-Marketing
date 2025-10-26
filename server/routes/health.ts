import { Router } from 'express';
import { healthCheckService } from '../services/health-check-service';
import { loggingService } from '../services/logging-service';
import { rateLimitService } from '../services/rate-limit-service';
import { requireAuth } from '../middleware/auth-unified';

const router = Router();

/**
 * Health check endpoint - Public
 * GET /api/health
 */
router.get('/', healthCheckService.createHealthEndpoint());

/**
 * Readiness probe - Public
 * GET /api/health/ready
 */
router.get('/ready', healthCheckService.createReadinessEndpoint());

/**
 * Liveness probe - Public  
 * GET /api/health/live
 */
router.get('/live', healthCheckService.createLivenessEndpoint());

/**
 * System metrics - Protected (requires authentication)
 * GET /api/health/metrics
 */
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const healthMetrics = loggingService.getHealthMetrics();
    const systemHealth = await healthCheckService.performHealthCheck();
    
    res.json({
      success: true,
      message: 'System metrics retrieved',
      data: {
        health: systemHealth,
        logging: healthMetrics,
        timestamp: new Date().toISOString()
      }
    });

    // Log audit trail
    loggingService.logAudit(
      (req as any).user.id,
      'read',
      'system_metrics',
      { endpoint: '/api/health/metrics' },
      req,
      true
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to retrieve system metrics', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limit status - Protected
 * GET /api/health/rate-limit
 */
router.get('/rate-limit', requireAuth, async (req, res) => {
  try {
    const rateLimitStatus = await rateLimitService.getRateLimitStatus(req);
    
    res.json({
      success: true,
      message: 'Rate limit status retrieved',
      data: rateLimitStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggingService.error('Failed to retrieve rate limit status', { error: error.message }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rate limit status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Recent logs - Protected (admin only)
 * GET /api/health/logs
 */
router.get('/logs', requireAuth, async (req, res) => {
  try {
    // Check if user has admin permissions
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    
    if (!tenant || !['super_admin', 'org_owner', 'org_admin'].includes(tenant.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view logs',
        timestamp: new Date().toISOString()
      });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as any;
    const userId = req.query.userId as string;
    const organizationId = tenant.role === 'super_admin' 
      ? req.query.organizationId as string 
      : tenant.organizationId; // Restrict to own org unless super_admin

    const logs = loggingService.getRecentLogs(limit, level, userId, organizationId);
    
    res.json({
      success: true,
      message: 'Recent logs retrieved',
      data: {
        logs,
        count: logs.length,
        filters: { limit, level, userId, organizationId }
      },
      timestamp: new Date().toISOString()
    });

    // Log audit trail
    loggingService.logAudit(
      user.id,
      'read',
      'system_logs',
      { 
        filters: { limit, level, userId, organizationId },
        logCount: logs.length 
      },
      req,
      true
    );

  } catch (error) {
    loggingService.error('Failed to retrieve logs', { error: error.message }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Performance metrics - Protected (admin only)
 * GET /api/health/performance
 */
router.get('/performance', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    
    if (!tenant || !['super_admin', 'org_owner', 'org_admin'].includes(tenant.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view performance metrics',
        timestamp: new Date().toISOString()
      });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const endpoint = req.query.endpoint as string;
    const userId = req.query.userId as string;
    const organizationId = tenant.role === 'super_admin' 
      ? req.query.organizationId as string 
      : tenant.organizationId;

    const metrics = loggingService.getPerformanceMetrics(limit, endpoint, userId, organizationId);
    
    res.json({
      success: true,
      message: 'Performance metrics retrieved',
      data: {
        metrics,
        count: metrics.length,
        filters: { limit, endpoint, userId, organizationId }
      },
      timestamp: new Date().toISOString()
    });

    // Log audit trail
    loggingService.logAudit(
      user.id,
      'read',
      'performance_metrics',
      { 
        filters: { limit, endpoint, userId, organizationId },
        metricCount: metrics.length 
      },
      req,
      true
    );

  } catch (error) {
    loggingService.error('Failed to retrieve performance metrics', { error: error.message }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Audit logs - Protected (admin only)
 * GET /api/health/audit
 */
router.get('/audit', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    
    if (!tenant || !['super_admin', 'org_owner', 'org_admin'].includes(tenant.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view audit logs',
        timestamp: new Date().toISOString()
      });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const resource = req.query.resource as string;
    const organizationId = tenant.role === 'super_admin' 
      ? req.query.organizationId as string 
      : tenant.organizationId;

    const auditLogs = loggingService.getAuditLogs(limit, userId, organizationId, action, resource);
    
    res.json({
      success: true,
      message: 'Audit logs retrieved',
      data: {
        auditLogs,
        count: auditLogs.length,
        filters: { limit, userId, organizationId, action, resource }
      },
      timestamp: new Date().toISOString()
    });

    // Log audit trail for accessing audit logs
    loggingService.logAudit(
      user.id,
      'read',
      'audit_logs',
      { 
        filters: { limit, userId, organizationId, action, resource },
        logCount: auditLogs.length 
      },
      req,
      true
    );

  } catch (error) {
    loggingService.error('Failed to retrieve audit logs', { error: error.message }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;