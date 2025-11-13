// Script para executar migration 003_ai_management.sql
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('📄 Lendo arquivo de migration...');
    const sql = readFileSync('./migrations/003_ai_management.sql', 'utf8');

    console.log('🚀 Executando migration 003_ai_management...');
    console.log('   (Isso pode levar alguns segundos...)\n');

    // Executar como transação única
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Transação commitada com sucesso!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro - transação revertida');
      throw error;
    }

    console.log('\n✅ Migration executada com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    console.log('   - ai_providers');
    console.log('   - ai_models');
    console.log('   - ai_organization_quotas');
    console.log('   - ai_usage_logs');
    console.log('   - ai_load_balancing_config');
    console.log('   - ai_provider_weights');

    console.log('\n📈 Views criadas:');
    console.log('   - ai_usage_stats_by_org');
    console.log('   - ai_provider_performance');

    console.log('\n⚙️  Funções criadas:');
    console.log('   - reset_daily_ai_quotas()');
    console.log('   - reset_monthly_ai_quotas()');

    // Verificar se as tabelas foram criadas
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'ai_%'
      ORDER BY table_name;
    `);

    console.log('\n✅ Tabelas AI no banco:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

runMigration();
