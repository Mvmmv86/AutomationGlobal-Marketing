#!/usr/bin/env node

console.log('🔍 Testing Supabase connection directly...');

async function testSupabaseConnection() {
  try {
    // Load environment variables
    const { config } = await import('dotenv');
    config();

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('🔗 Database URL found, attempting connection...');

    // Test connection with postgres package
    const { default: postgres } = await import('postgres');
    
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      connect_timeout: 30,
      idle_timeout: 10
    });

    console.log('📡 Attempting to connect to Supabase...');

    // Simple connection test
    const startTime = Date.now();
    const result = await sql`SELECT 
      NOW() as current_time, 
      version() as postgres_version,
      current_database() as database_name,
      current_user as user_name
    `;
    const connectionTime = Date.now() - startTime;

    console.log('\n✅ Supabase connection successful!');
    console.log(`⏱️  Connection time: ${connectionTime}ms`);
    console.log(`🕒 Current time: ${result[0].current_time}`);
    console.log(`🗄️  Database: ${result[0].database_name}`);
    console.log(`👤 User: ${result[0].user_name}`);
    console.log(`📊 PostgreSQL: ${result[0].postgres_version.split(' ').slice(0, 2).join(' ')}`);

    // Test if we can check existing tables
    console.log('\n📋 Checking existing tables...');
    const tables = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `;

    console.log(`📊 Found ${tables.length} tables in public schema:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    // Test basic schema creation capability
    console.log('\n🧪 Testing schema creation capability...');
    await sql`CREATE TABLE IF NOT EXISTS test_connection (id serial primary key, created_at timestamp default now())`;
    await sql`INSERT INTO test_connection DEFAULT VALUES`;
    const testResult = await sql`SELECT COUNT(*) as count FROM test_connection`;
    await sql`DROP TABLE test_connection`;
    
    console.log(`✅ Schema operations successful (test count: ${testResult[0].count})`);

    await sql.end();
    console.log('\n🎉 All tests passed! Supabase is ready for production use.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Supabase connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.message.includes('CONNECT_TIMEOUT')) {
      console.error('\n💡 This appears to be a network timeout issue.');
      console.error('   - Check if DATABASE_URL is correct');
      console.error('   - Verify Supabase project is active');
      console.error('   - Try increasing timeout settings');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication issue detected.');
      console.error('   - Verify DATABASE_URL contains correct password');
      console.error('   - Check if database user has proper permissions');
    }

    process.exit(1);
  }
}

testSupabaseConnection();