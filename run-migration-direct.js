import { readFileSync } from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function runMigrationDirect() {
  console.log('🚀 EXECUTANDO MIGRATION NO SUPABASE\n');
  console.log('=' .repeat(80));

  // Ler SQL
  const sqlContent = readFileSync('server/db/migrations/005_social_integrations.sql', 'utf-8');
  console.log(`📄 Migration carregada (${sqlContent.split('\n').length} linhas)\n`);

  // Construir connection string com senha correta (URL encoded)
  // @ precisa ser %40 e * precisa ser %2A
  const connectionString = 'postgresql://postgres.zqzxaulmzwymkybctnzw:J9xTUM6GhUym%40u%2A@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

  console.log('📦 Conectando ao Supabase PostgreSQL...\n');

  // Conexão com senha correta via pooler
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.zqzxaulmzwymkybctnzw',
    password: 'Chaves@@$$1986',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    console.log('🔧 Executando migration SQL...\n');
    console.log('⏳ Isso pode levar 10-15 segundos...\n');

    await client.query(sqlContent);

    console.log('=' .repeat(80));
    console.log('\n🎉 MIGRATION COMPLETADA COM SUCESSO!\n');
    console.log('=' .repeat(80));
    console.log('\n📊 5 TABELAS CRIADAS:');
    console.log('✅ social_accounts       - Contas OAuth conectadas');
    console.log('✅ social_posts          - Posts e agendamentos');
    console.log('✅ social_metrics        - Métricas coletadas');
    console.log('✅ social_sync_logs      - Logs de sincronização');
    console.log('✅ social_comments       - Comentários coletados\n');

    console.log('🔧 RECURSOS ADICIONADOS:');
    console.log('✅ 15 índices para performance');
    console.log('✅ Row Level Security (RLS) habilitado');
    console.log('✅ Triggers para updated_at');
    console.log('✅ Foreign keys com CASCADE');
    console.log('✅ Unique constraints');
    console.log('✅ Check constraints para enums\n');

    console.log('=' .repeat(80));
    console.log('\n📋 PRÓXIMO PASSO: Verificar tabelas criadas');
    console.log('Execute: node check-supabase-api.js\n');

    await client.end();
    console.log('🔌 Desconectado do banco\n');

  } catch (error) {
    console.error('\n❌ ERRO ao executar migration:', error.message);
    console.error('\nDetalhes:', error);
    await client.end();
    process.exit(1);
  }
}

runMigrationDirect();
