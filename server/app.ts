/**
 * Express Application Configuration - Automation Global v4.0
 * Modular backend architecture with structured blueprints and middleware
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { errorHandler, notFoundHandler, requestId, requestLogger } from "./middleware/validation.js";
import { apiRateLimit } from "./middleware/rate-limit.js";

// Import blueprints
import authBlueprint from "./blueprints/auth.js";
import organizationsBlueprint from "./blueprints/organizations.js";

// Import existing routes
import { registerRoutes } from "./routes.js";

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));

  // Compression for better performance
  app.use(compression());

  // Request middleware
  app.use(requestId);
  app.use(requestLogger);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global rate limiting (basic protection)
  app.use('/api/', apiRateLimit);

  // Health check endpoint (no rate limiting)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '4.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API Version
  app.get('/api/version', (req, res) => {
    res.json({
      success: true,
      data: {
        version: '4.0.0',
        apiVersion: 'v1',
        name: 'Automation Global API',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Register blueprints (modular API structure)
  app.use('/api/auth', authBlueprint);
  app.use('/api/organizations', organizationsBlueprint);

  // Register existing routes (legacy and additional endpoints)
  registerRoutes(app);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;