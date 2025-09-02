import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase via Drizzle...');
  
  const connectionString = process.env.DATABASE_URL;
  console.log('🔗 Connection string pattern:', connectionString ? connectionString.substring(0, 30) + '...' : 'NOT_FOUND');
  
  try {
    // Criar conexão com timeout menor
    const sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10
    });
    
    const db = drizzle(sql);
    
    // Teste simples
    console.log('⏳ Executando teste de conexão...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Dados do banco:', {
      timestamp: result[0].current_time,
      version: result[0].pg_version.substring(0, 50)
    });
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes do erro:', error);
  }
}

testConnection();