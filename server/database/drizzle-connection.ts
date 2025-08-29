// server/database/drizzle-connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CONFIG } from '../config.js';
import * as schema from '../../shared/schema.js';

console.log('🔧 Configurando conexão direta Drizzle + Supabase...');

// Extrair connection string da variável de ambiente
let connectionString = CONFIG.SUPABASE_CONNECTION_STRING;

// Se a string vier com prefixo DATABASE_URL=, extrair apenas a URL
if (connectionString.startsWith('DATABASE_URL=')) {
  connectionString = connectionString.replace('DATABASE_URL="', '').replace('"', '');
}

// Se não tiver connection string, usar a URL padrão
if (!connectionString && CONFIG.DATABASE_URL) {
  connectionString = CONFIG.DATABASE_URL;
}

if (!connectionString) {
  throw new Error('❌ Nenhuma connection string encontrada (SUPABASE_CONNECTION_STRING ou DATABASE_URL)');
}

console.log('🔗 Connection string:', connectionString.replace(/:[^:]*@/, ':***@')); // Ocultar senha

// Configurações otimizadas para Replit + Supabase
const connectionConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.zqzxaulmzwymkybctnzw',
  password: 'Chaves@@$$1986',
  
  // Configurações de conexão otimizadas para Replit
  ssl: {
    rejectUnauthorized: false // Necessário para Supabase pooler
  },
  max: 3, // Máximo 3 conexões para evitar sobrecarga
  idle_timeout: 10, // 10 segundos de idle
  connect_timeout: 30, // 30 segundos para conectar
  statement_timeout: 25000, // 25 segundos para queries
  
  // Configurações específicas para Replit
  connection: {
    application_name: 'automation-global-replit',
    statement_timeout: '25s',
    idle_in_transaction_session_timeout: '30s'
  },
  
  // Retry e pooling
  retry_delay: 2000,
  max_retries: 3,
  
  // Evitar problemas de timeout
  socket_timeout: 0,
  query_timeout: 25000,
  
  // Headers específicos
  prepare: false, // Desabilitar prepared statements para Supabase pooler
  transform: undefined
};

console.log('⚙️ Configurações de conexão preparadas');

// Criar conexão postgres-js com configurações otimizadas
const sql = postgres(connectionString, connectionConfig);

// Criar instância Drizzle
const db = drizzle(sql, { 
  schema,
  logger: true // Habilitar logs para debug
});

console.log('✅ Drizzle + Supabase configurado com sucesso!');

// Função de teste de conexão
export async function testDrizzleConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testando conexão Drizzle...');
    
    // Testar com query simples
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    console.log('✅ Conexão Drizzle bem-sucedida!');
    console.log('⏰ Tempo atual:', result[0]?.current_time);
    console.log('🗄️ Versão DB:', result[0]?.db_version?.substring(0, 50) + '...');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão Drizzle:', error.message);
    return false;
  }
}

// Função para criar usuário via Drizzle
export async function createUserDrizzle(userData: any) {
  try {
    console.log('👤 Criando usuário via Drizzle:', userData.email);
    
    const username = userData.email.split('@')[0] + Date.now(); // Username único
    const values = {
      email: userData.email,
      username: username,
      firstName: userData.name || 'User',
      password: userData.password_hash,
      emailVerified: userData.email_verified || false
    };
    
    console.log('📋 Valores para inserção:', values);
    
    const [user] = await db.insert(schema.users).values(values).returning();
    
    console.log('✅ Usuário criado via Drizzle:', user.id);
    return user;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário via Drizzle:', error.message);
    throw error;
  }
}

// Função para criar organização via Drizzle
export async function createOrganizationDrizzle(orgData: any) {
  try {
    console.log('🏢 Criando organização via Drizzle:', orgData.name);
    
    const values = {
      name: orgData.name,
      slug: orgData.slug,
      type: 'marketing' as const,
      isActive: true
    };
    
    console.log('📋 Valores para organização:', values);
    
    const [organization] = await db.insert(schema.organizations).values(values).returning();
    
    console.log('✅ Organização criada via Drizzle:', organization.id);
    return organization;
    
  } catch (error) {
    console.error('❌ Erro ao criar organização via Drizzle:', error.message);
    throw error;
  }
}

// Função para listar usuários via Drizzle
export async function getUsersDrizzle() {
  try {
    const users = await db.select().from(schema.users);
    console.log(`📊 ${users.length} usuários encontrados via Drizzle`);
    return users;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários via Drizzle:', error.message);
    throw error;
  }
}

// Função para listar organizações via Drizzle
export async function getOrganizationsDrizzle() {
  try {
    const organizations = await db.select().from(schema.organizations);
    console.log(`📊 ${organizations.length} organizações encontradas via Drizzle`);
    return organizations;
  } catch (error) {
    console.error('❌ Erro ao buscar organizações via Drizzle:', error.message);
    throw error;
  }
}

// Exportar instâncias
export { db, sql };
export default db;