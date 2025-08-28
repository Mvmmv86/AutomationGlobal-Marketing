#!/usr/bin/env tsx
/**
 * Database Setup Script
 * Automation Global v4.0
 * 
 * This script creates all required tables manually using our database connection
 * since drizzle-kit is having connection issues with the Supabase URL format.
 */

import { storage } from '../server/storage';

const tableCreationSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('marketing', 'support', 'trading');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE module_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  password TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo TEXT,
  description TEXT,
  type organization_type NOT NULL,
  subscription_plan subscription_plan DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role user_role NOT NULL DEFAULT 'org_user',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- AI Tables
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider ai_provider NOT NULL,
  api_key TEXT,
  endpoint TEXT,
  models JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES ai_providers(id),
  model TEXT NOT NULL,
  tokens INTEGER,
  cost DECIMAL(10,6),
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  provider_id UUID NOT NULL REFERENCES ai_providers(id),
  model TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  fallback_provider_id UUID REFERENCES ai_providers(id),
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Module Tables
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  features JSONB DEFAULT '[]',
  required_plan subscription_plan DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  status module_status DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  activated_at TIMESTAMP DEFAULT NOW(),
  activated_by UUID REFERENCES users(id)
);

-- Automation Tables
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  conditions JSONB DEFAULT '[]',
  schedule JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id),
  status TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB,
  error TEXT,
  logs JSONB DEFAULT '[]'
);

-- Integration Tables
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  auth_type TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  credentials JSONB,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP,
  connected_by UUID NOT NULL REFERENCES users(id),
  connected_at TIMESTAMP DEFAULT NOW()
);

-- System Tables
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_id ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_automations_org_id ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert default AI providers
INSERT INTO ai_providers (name, provider, models, is_active) 
VALUES 
  ('OpenAI', 'openai', '["gpt-5", "gpt-4", "gpt-3.5-turbo"]', TRUE),
  ('Anthropic', 'anthropic', '["claude-sonnet-4-20250514", "claude-3-haiku-20240307"]', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default modules
INSERT INTO modules (name, slug, description, features, required_plan, is_active)
VALUES 
  ('Marketing AI', 'marketing-ai', 'AI-powered marketing automation and content generation', '["content_generation", "campaign_optimization", "audience_analysis"]', 'starter', TRUE),
  ('Support AI', 'support-ai', 'Intelligent customer support and ticketing system', '["ticket_routing", "auto_responses", "sentiment_analysis"]', 'starter', TRUE),
  ('Trading AI', 'trading-ai', 'AI-driven trading analysis and automation', '["market_analysis", "risk_assessment", "trade_signals"]', 'professional', TRUE),
  ('Content AI', 'content-ai', 'Advanced content creation and optimization', '["seo_optimization", "multi_language", "brand_voice"]', 'professional', TRUE),
  ('Analytics AI', 'analytics-ai', 'Deep business intelligence and reporting', '["predictive_analytics", "custom_dashboards", "data_visualization"]', 'professional', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert default integrations
INSERT INTO integrations (name, provider, description, auth_type, is_active)
VALUES
  ('Google Ads', 'google_ads', 'Google Ads campaign management and optimization', 'oauth', TRUE),
  ('Facebook Ads', 'facebook_ads', 'Facebook and Instagram advertising integration', 'oauth', TRUE),
  ('Zendesk', 'zendesk', 'Customer support ticket management', 'api_key', TRUE),
  ('Slack', 'slack', 'Team communication and notifications', 'oauth', TRUE),
  ('Webhooks', 'webhooks', 'Custom webhook integrations', 'custom', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as status;
`;

async function setupDatabase() {
  console.log('🗄️  Setting up Automation Global database...\n');
  
  try {
    // Use the postgres client directly
    const postgres = (await import('postgres')).default;
    const { CONFIG } = await import('../server/config');
    
    const client = postgres(CONFIG.DATABASE_URL, {
      ssl: CONFIG.NODE_ENV === 'production' ? 'require' : 'prefer',
      max: 10,
    });
    
    // Execute the setup SQL
    await client.unsafe(tableCreationSQL);
    
    console.log('✅ Database schema created successfully!');
    console.log('✅ Default data inserted successfully!');
    console.log('\n🎉 Database setup complete!\n');
    
    // Verify by checking a few tables
    const userCount = await client`SELECT COUNT(*) FROM users`;
    const orgCount = await client`SELECT COUNT(*) FROM organizations`;
    const moduleCount = await client`SELECT COUNT(*) FROM modules`;
    
    // Close the connection
    await client.end();
    
    console.log('📊 Database Summary:');
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Organizations: ${orgCount[0].count}`);
    console.log(`   Modules: ${moduleCount[0].count}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run setup
setupDatabase();