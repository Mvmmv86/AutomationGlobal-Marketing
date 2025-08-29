import { Router } from 'express';
import { healthCheckService } from '../services/health-check-service';
import { loggingService } from '../services/logging-service';
import { rateLimitService } from '../services/rate-limit-service';

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
 * System metrics - Public (simplified)
 * GET /api/health/metrics
 */
router.get('/metrics', async (req, res) => {
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to retrieve system metrics:', errorMessage);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system metrics',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limit status - Public (simplified)
 * GET /api/health/rate-limit
 */
router.get('/rate-limit', async (req, res) => {
  try {
    const rateLimitStatus = await rateLimitService.getRateLimitStatus(req);
    
    res.json({
      success: true,
      message: 'Rate limit status retrieved',
      data: rateLimitStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to retrieve rate limit status:', errorMessage);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rate limit status',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;