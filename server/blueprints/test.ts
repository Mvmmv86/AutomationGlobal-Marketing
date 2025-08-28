/**
 * Test Blueprint - Automation Global v4.0
 * Simple test endpoints without database dependencies
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequest, AppError } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Validation schema for testing
const testDataSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(1).max(120).optional()
});

/**
 * Simple GET test
 */
router.get('/simple', (req, res) => {
  res.json({
    success: true,
    message: 'Blueprint test successful',
    data: {
      timestamp: new Date().toISOString(),
      server: 'Express.js',
      architecture: 'Modular Blueprints'
    }
  });
});

/**
 * Validation test
 */
router.post('/validation',
  validateRequest(testDataSchema),
  (req, res) => {
    res.json({
      success: true,
      message: 'Validation test passed',
      data: req.body
    });
  }
);

/**
 * Error handling test
 */
router.get('/error', (req, res, next) => {
  const type = req.query.type as string;
  
  switch (type) {
    case 'app':
      next(new AppError(400, 'Test application error', 'TEST_ERROR'));
      break;
    case 'auth':
      next(new AppError(401, 'Test authentication error'));
      break;
    case 'permission':
      next(new AppError(403, 'Test permission error'));
      break;
    case 'notfound':
      next(new AppError(404, 'Test not found error'));
      break;
    case 'server':
      next(new Error('Test server error'));
      break;
    default:
      res.json({
        success: true,
        message: 'Error handling test - specify ?type=app|auth|permission|notfound|server'
      });
  }
});

/**
 * Rate limiting test
 */
router.get('/rate-limit',
  rateLimiter('test_endpoint', 3, 60), // 3 requests per minute
  (req, res) => {
    res.json({
      success: true,
      message: 'Rate limit test passed',
      data: {
        timestamp: new Date().toISOString(),
        note: 'Try calling this endpoint more than 3 times per minute'
      }
    });
  }
);

/**
 * Middleware chain test
 */
router.post('/middleware-chain',
  rateLimiter('middleware_test', 5, 300), // 5 requests per 5 minutes
  validateRequest(testDataSchema),
  (req, res) => {
    res.json({
      success: true,
      message: 'All middleware tests passed',
      data: {
        validated: req.body,
        rateLimited: true,
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * Health check for this blueprint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    blueprint: 'test',
    status: 'healthy',
    endpoints: {
      'GET /simple': 'Simple response test',
      'POST /validation': 'Request validation test',
      'GET /error': 'Error handling test',
      'GET /rate-limit': 'Rate limiting test',
      'POST /middleware-chain': 'Complete middleware chain test'
    }
  });
});

export default router;