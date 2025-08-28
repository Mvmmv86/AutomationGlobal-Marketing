/**
 * Schema Setup Endpoint
 * Automation Global v4.0
 * 
 * Creates an endpoint to execute database schema migration from within the app
 */

import express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import { CONFIG } from '../server/config';

const app = express();

// Middleware
app.use(express.json());

// Schema setup endpoint
app.post('/setup-schema', async (req, res) => {
  console.log('🔧 Starting database schema setup...');
  
  try {
    // Create database connection
    const sql = postgres(CONFIG.DATABASE_URL, {
      ssl: 'require',
      connection: {
        application_name: 'automation-global-setup',
      },
    });

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '0000_tough_runaways.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split into statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await sql.unsafe(statement);
        successCount++;
        
        if (statement.includes('CREATE TYPE')) {
          const typeName = statement.match(/"([^"]+)"/)?.[1];
          results.push(`✅ Created ENUM type: ${typeName}`);
        } else if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE "([^"]+)"/)?.[1];
          results.push(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE "([^"]+)"/)?.[1];
          results.push(`✅ Added FK to: ${tableName}`);
        }
        
      } catch (error: any) {
        errorCount++;
        if (error.message.includes('already exists')) {
          results.push(`⚠️ Already exists: ${error.message.split(' ')[1]}`);
        } else {
          results.push(`❌ Error: ${error.message}`);
        }
      }
    }

    // Verify tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'users', 'organizations', 'organization_users',
          'modules', 'organization_modules', 'integrations', 
          'organization_integrations', 'ai_providers', 
          'ai_configurations', 'ai_usage_logs', 'automations',
          'automation_executions', 'activity_logs', 'system_notifications'
        )
      ORDER BY table_name
    `;

    await sql.end();

    const response = {
      success: errorCount === 0,
      message: errorCount === 0 
        ? '🎉 Schema setup completed successfully!' 
        : `⚠️ Setup completed with ${errorCount} errors`,
      statistics: {
        total: statements.length,
        successful: successCount,
        errors: errorCount,
        tablesCreated: tables.length
      },
      tables: tables.map((t: any) => t.table_name),
      details: results
    };

    console.log('✅ Schema setup completed:', response);
    res.json(response);

  } catch (error: any) {
    console.error('❌ Schema setup failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 Schema setup server running on port ${PORT}`);
  console.log(`📋 POST /setup-schema to create database tables`);
});

export default app;