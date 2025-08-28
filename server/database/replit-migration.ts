import postgres from 'postgres';

// Specialized migration system for Replit environment with longer timeouts
export class ReplitMigrationSystem {
  private sql: postgres.Sql | null = null;

  constructor() {}

  private async getConnection(): Promise<postgres.Sql> {
    if (this.sql) return this.sql;

    // Extended timeouts specifically for Replit
    this.sql = postgres(process.env.DATABASE_URL!, {
      ssl: 'require',
      max: 1,
      connect_timeout: 120,  // 2 minutes
      idle_timeout: 60,      // 1 minute
      transform: postgres.camel,
      onnotice: () => {},    // Suppress notices
    });

    return this.sql;
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Supabase connection with extended timeout...');
      const sql = await this.getConnection();
      
      const result = await sql`SELECT NOW() as current_time`;
      console.log('✅ Connection successful:', result[0].currentTime);
      return true;
    } catch (error: any) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
  }

  async createTablesInBatches(): Promise<void> {
    const sql = await this.getConnection();
    
    console.log('🏗️ Creating tables in batches...');

    // Batch 1: Core user and organization tables
    console.log('📝 Creating user and organization tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) CHECK (type IN ('marketing', 'support', 'trading')) NOT NULL,
        subscription_plan VARCHAR(50) CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
        is_active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS organization_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) CHECK (role IN ('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer')) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
      )
    `;

    // Batch 2: Module system tables
    console.log('🧩 Creating module system tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        features JSONB DEFAULT '[]',
        pricing_tiers JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS organization_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
        is_enabled BOOLEAN DEFAULT false,
        configuration JSONB DEFAULT '{}',
        enabled_at TIMESTAMP,
        UNIQUE(organization_id, module_id)
      )
    `;

    // Batch 3: AI system tables
    console.log('🤖 Creating AI system tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS ai_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        models JSONB DEFAULT '[]',
        pricing JSONB DEFAULT '{}',
        rate_limits JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
        model_name VARCHAR(100) NOT NULL,
        configuration JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
        model_name VARCHAR(100) NOT NULL,
        tokens_used INTEGER NOT NULL,
        cost_usd DECIMAL(10,6),
        request_type VARCHAR(100),
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Batch 4: Automation and integration tables
    console.log('⚙️ Creating automation and integration tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        trigger_config JSONB DEFAULT '{}',
        action_steps JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS automation_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
        status VARCHAR(50) CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        execution_log JSONB DEFAULT '{}',
        error_message TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        auth_type VARCHAR(50) NOT NULL,
        configuration_schema JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS organization_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
        configuration JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        connected_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organization_id, integration_id)
      )
    `;

    // Batch 5: Logging and notification tables
    console.log('📊 Creating logging and notification tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id UUID,
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('📚 Creating indexes for better performance...');
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_organization_users_org ON organization_users(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_organization_users_user ON organization_users(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_created ON ai_usage_logs(organization_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON activity_logs(organization_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status)`;

    console.log('✅ All tables created successfully with indexes!');
  }

  async seedInitialData(): Promise<void> {
    const sql = await this.getConnection();
    
    console.log('🌱 Seeding initial data...');

    // Check if modules already exist
    const existingModules = await sql`SELECT COUNT(*) as count FROM modules`;
    if (Number(existingModules[0].count) > 0) {
      console.log('📦 Modules already exist, skipping seed...');
      return;
    }

    // Create modules
    console.log('📦 Creating modules...');
    await sql`
      INSERT INTO modules (name, slug, description, category, features, pricing_tiers) VALUES
      (
        'Marketing Automation',
        'marketing-automation',
        'Comprehensive marketing automation with AI-powered campaigns',
        'marketing',
        '["Email campaigns", "Social media automation", "Lead scoring", "A/B testing", "Customer segmentation", "Analytics dashboard"]',
        '{"starter": {"campaigns": 5, "contacts": 1000}, "professional": {"campaigns": 25, "contacts": 10000}, "enterprise": {"campaigns": 100, "contacts": 100000}}'
      ),
      (
        'Customer Support AI',
        'customer-support-ai',
        'AI-powered customer support and ticket management',
        'support',
        '["Auto ticket classification", "AI response suggestions", "Sentiment analysis", "Knowledge base integration", "Multi-channel support", "Performance analytics"]',
        '{"starter": {"tickets": 100, "agents": 2}, "professional": {"tickets": 1000, "agents": 10}, "enterprise": {"tickets": 10000, "agents": 50}}'
      ),
      (
        'Trading Analytics',
        'trading-analytics',
        'Advanced trading analytics and market intelligence',
        'trading',
        '["Market sentiment analysis", "Trading signals", "Portfolio optimization", "Risk management", "Backtesting", "Real-time alerts"]',
        '{"professional": {"portfolios": 5, "signals_per_day": 50}, "enterprise": {"portfolios": 25, "signals_per_day": 200}}'
      )
    `;

    // Create AI providers
    console.log('🤖 Creating AI providers...');
    await sql`
      INSERT INTO ai_providers (name, provider, models, pricing, rate_limits) VALUES
      (
        'OpenAI GPT-5',
        'openai',
        '["gpt-5", "gpt-4o", "gpt-4"]',
        '{"gpt-5": {"input": 0.00002, "output": 0.00006}, "gpt-4o": {"input": 0.0000025, "output": 0.00001}}',
        '{"requests_per_minute": 500, "tokens_per_minute": 30000}'
      ),
      (
        'Anthropic Claude Sonnet 4',
        'anthropic',
        '["claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219"]',
        '{"claude-sonnet-4-20250514": {"input": 0.000015, "output": 0.000075}, "claude-3-7-sonnet-20250219": {"input": 0.000003, "output": 0.000015}}',
        '{"requests_per_minute": 300, "tokens_per_minute": 25000}'
      )
    `;

    console.log('✅ Initial data seeded successfully!');
  }

  async createSuperAdmin(email: string, password: string): Promise<void> {
    const sql = await this.getConnection();
    
    console.log('👤 Creating super admin user...');

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await sql`
      INSERT INTO users (email, username, first_name, last_name, password_hash)
      VALUES (${email}, ${email.split('@')[0] + '_admin'}, 'Super', 'Admin', ${hashedPassword})
      RETURNING id, email
    `;

    console.log(`✅ Super admin created: ${user.email} (ID: ${user.id})`);
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
  }
}