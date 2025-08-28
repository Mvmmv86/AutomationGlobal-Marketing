import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

export class DrizzleMigrationSystem {
  private db: ReturnType<typeof drizzle>;
  private client: postgres.Sql;

  constructor() {
    // Initialize connection with extended timeouts
    this.client = postgres(process.env.DATABASE_URL!, {
      ssl: 'require',
      max: 1,
      connect_timeout: 120,
      idle_timeout: 60,
    });
    
    this.db = drizzle(this.client, { schema });
  }
  
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection via Drizzle ORM...');
      
      // Simple query to test connection
      const result = await this.client`SELECT NOW() as current_time`;
      console.log('✅ Drizzle connection successful:', result[0].current_time);
      return true;
    } catch (error: any) {
      console.log('❌ Drizzle connection failed:', error.message);
      return false;
    }
  }

  async pushSchema(): Promise<boolean> {
    try {
      console.log('🏗️ Pushing Drizzle schema to database...');
      
      // Use drizzle-kit push to sync schema
      const { execSync } = await import('child_process');
      
      // Execute drizzle-kit push command
      execSync('npx drizzle-kit push', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      
      console.log('✅ Schema pushed successfully!');
      return true;
    } catch (error: any) {
      console.log('❌ Schema push failed:', error.message);
      return false;
    }
  }

  async checkTablesExist(): Promise<{ exists: boolean; tableCount: number; missingTables: string[] }> {
    try {
      console.log('📊 Checking if tables exist...');
      
      const requiredTables = [
        'users', 'organizations', 'organization_users',
        'modules', 'organization_modules', 'ai_providers',
        'ai_configurations', 'ai_usage_logs', 'automations',
        'automation_executions', 'integrations',
        'organization_integrations', 'activity_logs', 'system_notifications'
      ];
      
      const result = await this.client`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY(${requiredTables})
      `;
      
      const existingTables = result.map((row: any) => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      return {
        exists: missingTables.length === 0,
        tableCount: existingTables.length,
        missingTables
      };
    } catch (error: any) {
      console.log('❌ Table check failed:', error.message);
      return { exists: false, tableCount: 0, missingTables: [] };
    }
  }

  async seedInitialData(): Promise<void> {
    console.log('🌱 Seeding initial data using Drizzle...');
    
    try {
      // Check if modules already exist
      const existingModules = await this.db.select().from(schema.modules).limit(1);
      
      if (existingModules.length > 0) {
        console.log('📦 Modules already exist, skipping seed...');
        return;
      }
      
      // Insert modules using Drizzle
      console.log('📦 Creating modules...');
      await this.db.insert(schema.modules).values([
        {
          name: 'Marketing Automation',
          slug: 'marketing-automation',
          description: 'Comprehensive marketing automation with AI-powered campaigns',
          features: [
            'Email campaigns',
            'Social media automation', 
            'Lead scoring',
            'A/B testing',
            'Customer segmentation',
            'Analytics dashboard'
          ],
          requiredPlan: 'starter'
        },
        {
          name: 'Customer Support AI',
          slug: 'customer-support-ai', 
          description: 'AI-powered customer support and ticket management',
          features: [
            'Auto ticket classification',
            'AI response suggestions',
            'Sentiment analysis',
            'Knowledge base integration',
            'Multi-channel support',
            'Performance analytics'
          ],
          requiredPlan: 'starter'
        },
        {
          name: 'Trading Analytics',
          slug: 'trading-analytics',
          description: 'Advanced trading analytics and market intelligence',
          features: [
            'Market sentiment analysis',
            'Trading signals',
            'Portfolio optimization',
            'Risk management',
            'Backtesting',
            'Real-time alerts'
          ],
          requiredPlan: 'professional'
        }
      ]);

      // Insert AI providers using Drizzle
      console.log('🤖 Creating AI providers...');
      await this.db.insert(schema.aiProviders).values([
        {
          name: 'OpenAI GPT-5',
          provider: 'openai',
          models: ['gpt-5', 'gpt-4o', 'gpt-4'],
          settings: {
            pricing: {
              'gpt-5': { input: 0.00002, output: 0.00006 },
              'gpt-4o': { input: 0.0000025, output: 0.00001 }
            },
            rateLimits: {
              requests_per_minute: 500,
              tokens_per_minute: 30000
            }
          }
        },
        {
          name: 'Anthropic Claude Sonnet 4',
          provider: 'anthropic',
          models: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'],
          settings: {
            pricing: {
              'claude-sonnet-4-20250514': { input: 0.000015, output: 0.000075 },
              'claude-3-7-sonnet-20250219': { input: 0.000003, output: 0.000015 }
            },
            rateLimits: {
              requests_per_minute: 300,
              tokens_per_minute: 25000
            }
          }
        }
      ]);

      // Insert basic integrations
      console.log('🔗 Creating integrations...');
      await this.db.insert(schema.integrations).values([
        {
          name: 'Google Ads',
          provider: 'google_ads',
          description: 'Google Ads campaign management and analytics',
          authType: 'oauth'
        },
        {
          name: 'Facebook Ads',
          provider: 'facebook_ads', 
          description: 'Facebook and Instagram advertising integration',
          authType: 'oauth'
        },
        {
          name: 'Zendesk',
          provider: 'zendesk',
          description: 'Customer support ticket management',
          authType: 'api_key'
        }
      ]);

      console.log('✅ Initial data seeded successfully!');
    } catch (error: any) {
      console.error('❌ Seeding failed:', error.message);
      throw error;
    }
  }

  async createSuperAdmin(email: string, password: string): Promise<void> {
    console.log('👤 Creating super admin using Drizzle...');
    
    try {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert user using Drizzle
      const [user] = await this.db.insert(schema.users).values({
        email,
        username: email.split('@')[0] + '_admin',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword
      }).returning();

      console.log(`✅ Super admin created: ${user.email} (ID: ${user.id})`);
      
      return;
    } catch (error: any) {
      if (error.message.includes('duplicate key')) {
        console.log('ℹ️ Super admin already exists');
        return;
      }
      throw error;
    }
  }

  async getSchemaStatus(): Promise<any> {
    try {
      const { exists, tableCount, missingTables } = await this.checkTablesExist();
      
      // Get counts from existing tables
      let counts: any = {};
      
      if (exists || tableCount > 0) {
        try {
          const moduleCount = await this.db.select().from(schema.modules);
          const providerCount = await this.db.select().from(schema.aiProviders);
          const userCount = await this.db.select().from(schema.users);
          
          counts = {
            modules: moduleCount.length,
            providers: providerCount.length,
            users: userCount.length
          };
        } catch (e) {
          // Tables might not exist yet
          counts = { modules: 0, providers: 0, users: 0 };
        }
      }
      
      return {
        tablesExist: exists,
        tableCount,
        missingTables,
        dataCounts: counts,
        isReady: exists && counts.modules > 0
      };
    } catch (error: any) {
      return {
        tablesExist: false,
        tableCount: 0,
        missingTables: [],
        dataCounts: { modules: 0, providers: 0, users: 0 },
        isReady: false,
        error: error.message
      };
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.end();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.log('⚠️ Error closing connection:', error);
    }
  }
}