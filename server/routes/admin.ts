import { Router } from 'express';
import { adminAnalyticsService } from '../services/admin-analytics-service';
import { loggingService } from '../services/logging-service';

const router = Router();

/**
 * Global Metrics - GET /api/admin/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    loggingService.info('Admin metrics requested', {}, req);
    
    const metrics = await adminAnalyticsService.getGlobalMetrics();
    
    res.json({
      success: true,
      message: 'Global metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString()
    });

    loggingService.info('Admin metrics sent successfully', { metrics }, req);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to get admin metrics', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin metrics',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Organization Analytics - GET /api/admin/organizations
 */
router.get('/organizations', async (req, res) => {
  try {
    loggingService.info('Organization analytics requested', {}, req);
    
    const analytics = await adminAnalyticsService.getOrganizationAnalytics();
    
    res.json({
      success: true,
      message: 'Organization analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString()
    });

    loggingService.info('Organization analytics sent successfully', { count: analytics.length }, req);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to get organization analytics', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization analytics',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * User Analytics - GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    loggingService.info('User analytics requested', {}, req);
    
    const analytics = await adminAnalyticsService.getUserAnalytics();
    
    res.json({
      success: true,
      message: 'User analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString()
    });

    loggingService.info('User analytics sent successfully', { analytics }, req);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to get user analytics', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user analytics',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Time Series Data - GET /api/admin/timeseries
 */
router.get('/timeseries', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    loggingService.info('Time series data requested', { days }, req);
    
    const timeSeriesData = await adminAnalyticsService.getTimeSeriesData(days);
    
    res.json({
      success: true,
      message: 'Time series data retrieved successfully',
      data: timeSeriesData,
      timestamp: new Date().toISOString()
    });

    loggingService.info('Time series data sent successfully', { points: timeSeriesData.length }, req);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to get time series data', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve time series data',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * System Status - GET /api/admin/system-status
 */
router.get('/system-status', async (req, res) => {
  try {
    loggingService.info('System status requested', {}, req);
    
    const systemStatus = await adminAnalyticsService.getSystemStatus();
    
    res.json({
      success: true,
      message: 'System status retrieved successfully',
      data: systemStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggingService.error('Failed to get system status', { error: errorMessage }, req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system status',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;