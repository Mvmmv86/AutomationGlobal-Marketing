#!/usr/bin/env node

console.log('🔍 Testing internal database connection...');

async function testInternalConnection() {
  try {
    // Load environment variables
    const { config } = await import('dotenv');
    config();

    console.log('📡 Testing database via internal storage system...');

    // Import our storage system
    const { storage } = await import('../server/storage.js');
    
    console.log('✅ Storage system loaded successfully');

    // Test basic database operations through our storage layer
    console.log('🧪 Testing basic operations...');
    
    // Check if we can query system tables
    const systemCheck = await storage.db.execute(`
      SELECT 
        COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Found ${systemCheck.rows[0].table_count} tables in database`);

    // Check specific tables from our schema
    const tableCheck = await storage.db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'organizations', 'modules')
      ORDER BY table_name
    `);

    console.log(`✅ Schema tables found: ${tableCheck.rows.length}`);
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    if (tableCheck.rows.length === 0) {
      console.log('⚠️  No application tables found - schema needs to be created');
      
      // Test if we can create tables
      console.log('🔧 Testing table creation capability...');
      
      await storage.db.execute(`
        CREATE TABLE IF NOT EXISTS test_internal (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await storage.db.execute(`
        INSERT INTO test_internal (name) VALUES ('connection_test')
      `);

      const testResult = await storage.db.execute(`
        SELECT COUNT(*) as count FROM test_internal
      `);

      await storage.db.execute(`
        DROP TABLE test_internal
      `);

      console.log(`✅ Table operations successful (test rows: ${testResult.rows[0].count})`);
    }

    console.log('\n🎉 Internal database connection working perfectly!');
    console.log('💡 The connection works within the application - timeouts only affect external connections');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Internal connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Details: ${error.stack}`);
    process.exit(1);
  }
}

testInternalConnection();