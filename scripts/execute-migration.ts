#!/usr/bin/env tsx

/**
 * Execute Database Migration Script
 * Automation Global v4.0
 * 
 * This script executes the generated SQL migration file directly
 * using our working database connection
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function executeSchema() {
  console.log('🔧 Executing database schema migration...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Create database connection
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    connection: {
      application_name: 'automation-global-migration',
    },
  });

  try {
    // Read the migration file
    const migrationPath = join(projectRoot, 'migrations', '0000_tough_runaways.sql');
    console.log(`📖 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the statement
        await sql.unsafe(statement);
        successCount++;
        
        // Show what was created/altered
        if (statement.includes('CREATE TYPE')) {
          const typeName = statement.match(/"([^"]+)"/)?.[1];
          console.log(`   ✅ Created ENUM type: ${typeName}`);
        } else if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE "([^"]+)"/)?.[1];
          console.log(`   ✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE "([^"]+)"/)?.[1];
          console.log(`   ✅ Added foreign key to: ${tableName}`);
        }
        
      } catch (error: any) {
        errorCount++;
        console.error(`   ❌ Error in statement ${i + 1}: ${error.message}`);
        
        // Show the problematic statement for debugging
        if (statement.length < 200) {
          console.error(`   📄 Statement: ${statement.substring(0, 100)}...`);
        }
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Object already exists, continuing...`);
        } else if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  Dependency missing, this might need manual attention`);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total: ${statements.length}`);

    // Verify tables were created
    console.log('\n🔍 Verifying created tables...');
    const tables = await sql`
      SELECT table_name, column_count
      FROM (
        SELECT 
          table_name,
          COUNT(*) as column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'users', 'organizations', 'organization_users',
            'modules', 'organization_modules', 'integrations', 
            'organization_integrations', 'ai_providers', 
            'ai_configurations', 'ai_usage_logs', 'automations',
            'automation_executions', 'activity_logs', 'system_notifications'
          )
        GROUP BY table_name
        ORDER BY table_name
      ) t
    `;

    if (tables.length > 0) {
      console.log('\n📋 Created tables:');
      tables.forEach((table: any) => {
        console.log(`   📊 ${table.table_name} (${table.column_count} columns)`);
      });
    }

    // Verify ENUM types
    const enums = await sql`
      SELECT typname as enum_name, 
             array_length(enum_range(NULL::public.organization_type), 1) as value_count
      FROM pg_type 
      WHERE typname IN ('ai_provider', 'module_status', 'organization_type', 'subscription_plan', 'user_role')
      ORDER BY typname
    `;

    if (enums.length > 0) {
      console.log('\n🏷️  Created ENUM types:');
      enums.forEach((enumType: any) => {
        console.log(`   🔖 ${enumType.enum_name}`);
      });
    }

    if (errorCount === 0) {
      console.log('\n🎉 Schema migration completed successfully!');
      console.log('✨ All 14 tables and ENUM types created');
      console.log('🔗 Foreign key relationships established');
      console.log('📋 Ready for Phase 2 development!');
    } else {
      console.log(`\n⚠️  Migration completed with ${errorCount} errors`);
      console.log('🔍 Please review the errors above');
      console.log('🛠️  Some manual fixes might be needed');
    }

  } catch (error: any) {
    console.error('\n💥 Critical error during migration:');
    console.error(`❌ ${error.message}`);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
executeSchema()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error.message);
    process.exit(1);
  });