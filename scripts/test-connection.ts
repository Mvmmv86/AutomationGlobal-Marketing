#!/usr/bin/env tsx
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testBasicSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, { 
    ssl: 'require',
    max: 1,
    idle_timeout: 0,
    connect_timeout: 60
  });

  try {
    console.log('Testing basic connection...');
    
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Connection successful');

    // Test creating one ENUM
    console.log('Creating test ENUM...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE test_enum AS ENUM('test1', 'test2');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ ENUM created');

    // Test creating one table
    console.log('Creating test table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log('✅ Table created');

    // Verify
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'test_table'
    `;
    console.log('✅ Verified:', tables.length, 'table found');

    // Clean up
    await sql`DROP TABLE IF EXISTS test_table`;
    await sql`DROP TYPE IF EXISTS test_enum`;
    console.log('✅ Cleaned up');

    console.log('🎉 Connection and basic operations working!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

testBasicSchema();