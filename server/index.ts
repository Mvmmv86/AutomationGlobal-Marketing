import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { DatabaseMigrations } from "./database/migrations";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import rate limiting and logging services
import { rateLimitService } from "./services/rate-limit-service";
import { loggingService } from "./services/logging-service";
import healthRoutes from "./routes/health-simple";

// Apply logging middleware first
app.use(loggingService.createRequestMiddleware());

// Apply rate limiting middleware
app.use(rateLimitService.createRateLimitMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migrations before starting server (non-blocking)
  console.log('🚀 Starting Automation Global v4.0...');
  
  // Try migrations but don't block server startup if they fail
  try {
    const migrations = new DatabaseMigrations();
    await Promise.race([
      migrations.runMigrations(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Migration timeout')), 10000))
    ]);
    await migrations.close();
    console.log('✅ Database migrations completed');
  } catch (error: any) {
    console.warn('⚠️ Migration skipped (will retry at runtime):', error.message);
    // Don't exit - let server start anyway
  }
  
  // Register health routes first
  app.use('/api/health', healthRoutes);
  
  const server = await registerRoutes(app);

  // Add middleware to ensure API routes are handled before Vite
  app.use('/api/*', (req, res, next) => {
    // If we reach this point, the API route wasn't found
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method 
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Configuração compatível com Windows e Linux
  const listenOptions: any = {
    port,
    host: "0.0.0.0"
  };
  
  // reusePort só funciona em Linux/Unix
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }
  
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    console.log(`\n🚀 Automation Global v4.0 ONLINE!`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🌍 Network: http://0.0.0.0:${port}`);
    console.log(`\n✅ Pressione Ctrl+C para parar\n`);
  });
})();
