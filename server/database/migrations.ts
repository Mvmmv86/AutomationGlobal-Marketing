/**
 * Database Migrations
 * Automation Global v4.0
 * 
 * Automatic schema creation and migration system
 */

import postgres from 'postgres';
import { CONFIG } from '../config';

export class DatabaseMigrations {
  private sql: any;

  constructor() {
    this.sql = postgres(CONFIG.DATABASE_URL, {
      ssl: 'require',
      max: 5,
    });
  }

  async runMigrations(): Promise<void> {
    console.log('🔧 Starting database migrations...');

    try {
      // Check if migrations table exists
      await this.createMigrationsTable();
      
      // Run all pending migrations
      await this.createEnums();
      await this.createTables();
      await this.createForeignKeys();
      
      console.log('✅ All migrations completed successfully');
    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `;
  }

  private async createEnums(): Promise<void> {
    const enums = [
      {
        name: 'ai_provider',
        values: ['openai', 'anthropic', 'custom']
      },
      {
        name: 'module_status', 
        values: ['active', 'inactive', 'pending']
      },
      {
        name: 'organization_type',
        values: ['marketing', 'support', 'trading']
      },
      {
        name: 'subscription_plan',
        values: ['starter', 'professional', 'enterprise']
      },
      {
        name: 'user_role',
        values: ['super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer']
      }
    ];

    for (const enumDef of enums) {
      await this.createEnum(enumDef.name, enumDef.values);
    }
  }

  private async createEnum(name: string, values: string[]): Promise<void> {
    const valuesList = values.map(v => `'${v}'`).join(', ');
    
    await this.sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE ${name} AS ENUM(${valuesList});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log(`✅ Created ENUM: ${name}`);
  }

  private async createTables(): Promise<void> {
    // Create tables in dependency order
    await this.createUsersTable();
    await this.createOrganizationsTable();
    await this.createOrganizationUsersTable();
    await this.createModulesTable();
    await this.createOrganizationModulesTable();
    await this.createAiProvidersTable();
    await this.createAiConfigurationsTable();
    await this.createAiUsageLogsTable();
    await this.createAutomationsTable();
    await this.createAutomationExecutionsTable();
    await this.createIntegrationsTable();
    await this.createOrganizationIntegrationsTable();
    await this.createActivityLogsTable();
    await this.createSystemNotificationsTable();
    await this.createBlogNichesTable();
    await this.createTrendingTopicsTable();
    await this.createNewsArticlesTable();
    await this.createBlogPostsTable();
    await this.createGeneratedBlogPostsTable();
  }

  private async createUsersTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        avatar TEXT,
        password TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: users');
  }

  private async createOrganizationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        domain TEXT,
        logo TEXT,
        description TEXT,
        type organization_type NOT NULL,
        subscription_plan subscription_plan DEFAULT 'starter',
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: organizations');
  }

  private async createOrganizationUsersTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS organization_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        user_id UUID NOT NULL REFERENCES users(id),
        role user_role DEFAULT 'org_user' NOT NULL,
        permissions JSONB DEFAULT '{}',
        invited_by UUID REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT now(),
        is_active BOOLEAN DEFAULT true
      )
    `;
    console.log('✅ Created table: organization_users');
  }

  private async createModulesTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        features JSONB DEFAULT '[]',
        required_plan subscription_plan DEFAULT 'starter',
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: modules');
  }

  private async createOrganizationModulesTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS organization_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        module_id UUID NOT NULL REFERENCES modules(id),
        status module_status DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        activated_at TIMESTAMP DEFAULT now(),
        activated_by UUID REFERENCES users(id)
      )
    `;
    console.log('✅ Created table: organization_modules');
  }

  private async createAiProvidersTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS ai_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        provider ai_provider NOT NULL,
        api_key TEXT,
        endpoint TEXT,
        models JSONB DEFAULT '[]',
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: ai_providers');
  }

  private async createAiConfigurationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS ai_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        provider_id UUID NOT NULL REFERENCES ai_providers(id),
        model TEXT NOT NULL,
        settings JSONB DEFAULT '{}',
        fallback_provider_id UUID REFERENCES ai_providers(id),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: ai_configurations');
  }

  private async createAiUsageLogsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        provider_id UUID NOT NULL REFERENCES ai_providers(id),
        model TEXT NOT NULL,
        tokens INTEGER,
        cost NUMERIC(10, 6),
        request_data JSONB,
        response_data JSONB,
        status TEXT NOT NULL,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: ai_usage_logs');
  }

  private async createAutomationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        trigger JSONB NOT NULL,
        actions JSONB NOT NULL,
        conditions JSONB DEFAULT '[]',
        schedule JSONB,
        is_active BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: automations');
  }

  private async createAutomationExecutionsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS automation_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        automation_id UUID NOT NULL REFERENCES automations(id),
        status TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT now(),
        completed_at TIMESTAMP,
        result JSONB,
        error TEXT,
        logs JSONB DEFAULT '[]'
      )
    `;
    console.log('✅ Created table: automation_executions');
  }

  private async createIntegrationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        description TEXT,
        auth_type TEXT NOT NULL,
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: integrations');
  }

  private async createOrganizationIntegrationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS organization_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        integration_id UUID NOT NULL REFERENCES integrations(id),
        credentials JSONB,
        settings JSONB DEFAULT '{}',
        status TEXT DEFAULT 'active',
        last_sync_at TIMESTAMP,
        connected_by UUID NOT NULL REFERENCES users(id),
        connected_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: organization_integrations');
  }

  private async createActivityLogsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id UUID,
        details JSONB,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: activity_logs');
  }

  private async createSystemNotificationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
    console.log('✅ Created table: system_notifications');
  }

  private async createBlogNichesTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS blog_niches (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        keywords JSONB DEFAULT '[]'::jsonb,
        language TEXT DEFAULT 'pt',
        region TEXT DEFAULT 'BR',
        is_active BOOLEAN DEFAULT true,
        min_articles_for_news_mode INTEGER DEFAULT 3,
        max_posts_per_day INTEGER DEFAULT 5,
        schedule_cron TEXT DEFAULT '0 */4 * * *',
        last_processed_at TIMESTAMP,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created table: blog_niches');
  }

  private async createTrendingTopicsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS trending_topics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        niche_id VARCHAR NOT NULL REFERENCES blog_niches(id),
        term TEXT NOT NULL,
        source TEXT NOT NULL,
        source_type TEXT NOT NULL,
        score INTEGER DEFAULT 1,
        metadata JSONB DEFAULT '{}'::jsonb,
        collected_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created table: trending_topics');
  }

  private async createNewsArticlesTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS news_articles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        niche_id VARCHAR NOT NULL REFERENCES blog_niches(id),
        trend_term TEXT,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        url TEXT NOT NULL UNIQUE,
        source_url TEXT,
        source_name TEXT,
        author TEXT,
        image_url TEXT,
        published_at TIMESTAMP,
        language TEXT DEFAULT 'pt',
        relevance_score INTEGER DEFAULT 0,
        sentiment_score DECIMAL(3, 2),
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add missing columns if they don't exist (for existing tables)
    try {
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS trend_term TEXT`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_url TEXT`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_name TEXT`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author TEXT`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt'`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2)`;
      await this.sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false`;
      console.log('✅ Added missing columns to news_articles (if needed)');
    } catch (error) {
      // Columns might already exist, ignore error
      console.log('ℹ️  news_articles columns already exist or skipped');
    }

    // Add UNIQUE constraint to url column if it doesn't exist
    try {
      await this.sql`
        ALTER TABLE news_articles
        ADD CONSTRAINT news_articles_url_unique UNIQUE (url)
      `;
      console.log('✅ Added UNIQUE constraint to url column');
    } catch (error) {
      // Constraint might already exist, ignore error
      console.log('ℹ️  UNIQUE constraint on url already exists or skipped');
    }

    console.log('✅ Created table: news_articles');
  }

  private async createBlogPostsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        niche_id VARCHAR NOT NULL REFERENCES blog_niches(id),
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        featured_image_url TEXT,
        keywords JSONB DEFAULT '[]'::jsonb,
        status TEXT DEFAULT 'draft',
        generation_mode TEXT DEFAULT 'news',
        source_articles JSONB DEFAULT '[]'::jsonb,
        source_trends JSONB DEFAULT '[]'::jsonb,
        scheduled_for TIMESTAMP,
        published_at TIMESTAMP,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created table: blog_posts');
  }

  private async createGeneratedBlogPostsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS generated_blog_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        niche_id VARCHAR NOT NULL REFERENCES blog_niches(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        mode TEXT NOT NULL,
        source_data JSONB NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        featured_image_url TEXT,
        wordpress_post_id TEXT,
        status TEXT DEFAULT 'draft',
        published_at TIMESTAMP,
        publication_url TEXT,
        content_hash TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        reading_time INTEGER,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created table: generated_blog_posts');
  }

  private async createForeignKeys(): Promise<void> {
    // Foreign keys are created inline with tables
    console.log('✅ Foreign keys created with tables');
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}