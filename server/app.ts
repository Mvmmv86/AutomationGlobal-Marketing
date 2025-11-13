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
// DEPRECATED: auth.js foi substituído por auth-unified.js em routes.ts
// import authBlueprint from "./blueprints/auth.js";
import organizationsBlueprint from "./blueprints/organizations.js";
import testBlueprint from "./blueprints/test.js";
import adminAuthRouter from "./routes/admin-auth.js";

// Social Media Routes (Semana 2)
import socialAuthRouter from "./routes/social/social-auth.js";
import socialRouter from "./routes/social/index.js";

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

  // Body parsing middleware - Increased limit for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Rate limiting desabilitado temporariamente para desenvolvimento
  // app.use('/api/', apiRateLimit);

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
  // DEPRECATED: auth blueprint agora é registrado em routes.ts como auth-unified
  // app.use('/api/auth', authBlueprint);
  app.use('/api/admin/auth', adminAuthRouter);  // ← ADMIN AUTH (super_admin, org_owner)
  app.use('/api/organizations', organizationsBlueprint);
  app.use('/api/test', testBlueprint);

  // Social Media Routes (Semana 2 - Facebook, Instagram, YouTube)
  app.use('/api/social/auth', socialAuthRouter);  // OAuth callbacks
  app.use('/api/social', socialRouter);            // Accounts, posts, metrics

  // Register existing routes (legacy and additional endpoints)
  registerRoutes(app);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;