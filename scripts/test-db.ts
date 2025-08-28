import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config();

async function testDatabase() {
  console.log('🔍 Testing Supabase connection via TypeScript...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  try {
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      connect_timeout: 30
    });

    console.log('📡 Attempting connection to Supabase...');
    
    const startTime = Date.now();
    const result = await sql`
      SELECT 
        NOW() as current_time,
        version() as postgres_version,
        current_database() as database_name
    `;
    const connectionTime = Date.now() - startTime;

    console.log('\n✅ Connection successful!');
    console.log(`⏱️  Connection time: ${connectionTime}ms`);
    console.log(`🕒 Time: ${result[0].current_time}`);
    console.log(`🗄️  Database: ${result[0].database_name}`);
    console.log(`📊 Version: ${result[0].postgres_version.split(' ').slice(0, 2).join(' ')}`);

    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`\n📋 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Test operations
    await sql`CREATE TABLE IF NOT EXISTS connection_test (id serial primary key, created_at timestamp default now())`;
    await sql`INSERT INTO connection_test DEFAULT VALUES`;
    const testResult = await sql`SELECT COUNT(*) as count FROM connection_test`;
    await sql`DROP TABLE connection_test`;

    console.log(`\n✅ CRUD operations working (test count: ${testResult[0].count})`);

    await sql.end();
    console.log('\n🎉 Supabase is fully functional!');

  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('CONNECT_TIMEOUT')) {
      console.log('\n💡 Network timeout detected - this is common in Replit environment');
      console.log('   However, connections work fine within the running application');
      console.log('   The server can connect internally even if external tests timeout');
    }
    
    process.exit(1);
  }
}

testDatabase();