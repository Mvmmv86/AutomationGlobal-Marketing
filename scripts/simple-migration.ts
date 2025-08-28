#!/usr/bin/env tsx
/**
 * Simple Database Migration Script
 * Just creates a basic test table to validate connection
 */

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseSetup() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Database connection successful');
    console.log('⏰ Current time:', result[0].current_time);
    
    // Create a simple test table
    console.log('📝 Creating test table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_migration_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Test table created successfully');
    
    // Insert test data
    await sql`
      INSERT INTO test_migration_table (name) 
      VALUES ('migration_test') 
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Test data inserted');
    
    // Verify the table
    const testData = await sql`SELECT * FROM test_migration_table`;
    console.log('✅ Test query successful:', testData.length, 'rows');
    
    // Clean up test table
    await sql`DROP TABLE IF EXISTS test_migration_table`;
    console.log('✅ Test table cleaned up');
    
    console.log('\n🎉 Database is ready for schema migration!');
    console.log('💡 You can now proceed with drizzle-kit push or manual schema setup');
    
  } catch (error: any) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await sql.end();
  }
}

testDatabaseSetup();