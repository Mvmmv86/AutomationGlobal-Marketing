import type { Express } from "express";
import { createServer, type Server } from "http";
import { authService } from "./services/auth";
import { organizationService } from "./services/organizations";
import { aiService } from "./services/ai";
import { requireAuth, requireOrganization, requirePermission } from "./middleware/auth";
import { loadOrganizationContext, requireActiveOrganization } from "./middleware/tenant";
import type { AuthenticatedRequest, TenantRequest } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply middleware globally for API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Database status check
  app.get('/api/database/status', async (req, res) => {
    try {
      const postgres = await import('postgres');
      const sql = postgres.default(process.env.DATABASE_URL!, {
        ssl: 'require',
        max: 1,
      });

      // Check if tables exist
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'users', 'organizations', 'organization_users',
          'modules', 'organization_modules', 'ai_providers',
          'ai_configurations', 'ai_usage_logs', 'automations',
          'automation_executions', 'integrations', 
          'organization_integrations', 'activity_logs', 'system_notifications'
        )
        ORDER BY table_name
      `;

      await sql.end();

      res.json({
        success: true,
        tablesFound: tables.length,
        totalRequired: 14,
        isComplete: tables.length === 14,
        tables: tables.map((t: any) => t.table_name),
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Schema setup endpoint for manual migration
  app.post('/api/setup-database', async (req, res) => {
    try {
      console.log('🔧 Running manual database setup...');
      
      const { DatabaseMigrations } = await import('./database/migrations');
      const migrations = new DatabaseMigrations();
      
      await migrations.runMigrations();
      await migrations.close();
      
      console.log('✅ Manual database setup completed successfully');
      res.json({ 
        success: true, 
        message: 'Database schema created successfully!',
        timestamp: new Date().toISOString() 
      });
      
    } catch (error: any) {
      console.error('❌ Manual database setup error:', error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });



  // Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { user, tokens } = await authService.register(req.body);
      res.status(201).json({ user, tokens });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { user, tokens } = await authService.login(req.body);
      res.json({ user, tokens });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ tokens });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  });

  app.post('/api/auth/switch-organization', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { organizationId } = req.body;
      const tokens = await authService.switchOrganization(req.user!.userId, organizationId);
      res.json({ tokens });
    } catch (error) {
      res.status(403).json({ message: error.message });
    }
  });

  // User Routes
  app.get('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/user/organizations', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const organizations = await storage.getUserOrganizations(req.user!.userId);
      res.json({ organizations });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Organization Routes (with tenant context)
  app.use('/api/organizations/:organizationId', requireAuth, loadOrganizationContext);

  app.get('/api/organizations/:organizationId', requireActiveOrganization, async (req: TenantRequest, res) => {
    res.json({ organization: req.organization });
  });

  app.put('/api/organizations/:organizationId', 
    requireActiveOrganization, 
    requirePermission('organization', 'update'),
    async (req: TenantRequest, res) => {
      try {
        const organization = await organizationService.updateOrganization(
          req.organization!.id, 
          req.body
        );
        res.json({ organization });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.get('/api/organizations/:organizationId/stats', 
    requireActiveOrganization,
    async (req: TenantRequest, res) => {
      try {
        const stats = await organizationService.getOrganizationStats(req.organization!.id);
        res.json({ stats });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get('/api/organizations/:organizationId/quotas',
    requireActiveOrganization,
    async (req: TenantRequest, res) => {
      try {
        const quotas = await organizationService.checkQuotas(req.organization!.id);
        res.json({ quotas });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // AI Routes
  app.get('/api/ai/providers', requireAuth, async (req, res) => {
    try {
      const providers = await aiService.getAvailableProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/organizations/:organizationId/ai/generate', 
    requireActiveOrganization,
    requirePermission('ai', 'use'),
    async (req: TenantRequest, res) => {
      try {
        // Check AI quota before processing
        const quota = await aiService.checkQuota(req.organization!.id);
        if (!quota.withinQuota) {
          return res.status(429).json({ 
            message: 'AI quota exceeded for this month',
            quota 
          });
        }

        const response = await aiService.generateCompletion({
          organizationId: req.organization!.id,
          userId: req.user!.userId,
          ...req.body
        });

        res.json({ response });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get('/api/organizations/:organizationId/ai/usage',
    requireActiveOrganization,
    async (req: TenantRequest, res) => {
      try {
        const period = req.query.period as 'today' | 'week' | 'month' || 'today';
        const usage = await aiService.getUsageStats(req.organization!.id, period);
        res.json({ usage });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Dashboard Data Routes
  app.get('/api/organizations/:organizationId/dashboard',
    requireActiveOrganization,
    async (req: TenantRequest, res) => {
      try {
        const [stats, aiUsage, quotas] = await Promise.all([
          organizationService.getOrganizationStats(req.organization!.id),
          aiService.getUsageStats(req.organization!.id, 'today'),
          organizationService.checkQuotas(req.organization!.id),
        ]);

        const dashboardData = {
          organization: req.organization,
          stats,
          aiUsage,
          quotas,
          modules: {
            marketing: {
              status: 'active',
              efficiency: 87,
              metrics: {
                adCopyGenerated: 2847,
                ctrImprovement: 34,
                costPerLead: -22
              }
            },
            support: {
              status: 'active', 
              efficiency: 92,
              metrics: {
                ticketsResolved: 1234,
                avgResponseTime: 2.3,
                customerSatisfaction: 4.8
              }
            },
            trading: {
              status: 'active',
              efficiency: 78,
              metrics: {
                signalsGenerated: 156,
                winRate: 78,
                portfolioGrowth: 15.7
              }
            }
          },
          recentAutomations: [
            {
              id: '1',
              name: 'Lead Scoring Automation',
              module: 'Marketing AI',
              status: 'running',
              startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              processed: 234
            },
            {
              id: '2', 
              name: 'Support Ticket Auto-Reply',
              module: 'Support AI',
              status: 'completed',
              completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              processed: 89
            },
            {
              id: '3',
              name: 'Trading Signal Analysis', 
              module: 'Trading AI',
              status: 'running',
              startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              processed: 12
            }
          ],
          systemStatus: {
            api: { status: 'healthy', uptime: 99.9 },
            database: { status: 'healthy' },
            ai: { status: 'active' },
            queue: { status: 'processing' }
          }
        };

        res.json(dashboardData);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
