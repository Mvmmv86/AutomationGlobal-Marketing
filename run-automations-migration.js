// Executar migration de Automations
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Ler arquivo SQL
    const sql = fs.readFileSync('./migrations/004_automations.sql', 'utf8');

    console.log('\n🔄 Executando migration 004_automations.sql...');
    console.log('📊 Criando:');
    console.log('   - 4 ENUMs');
    console.log('   - 4 tabelas');
    console.log('   - 2 views');
    console.log('   - 1 function + trigger');
    console.log('   - 1 automação de exemplo\n');

    // Executar em uma transação
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Transação commitada com sucesso!');

      // Verificar tabelas criadas
      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'automation%'
        ORDER BY table_name
      `);

      console.log('\n✅ Tabelas criadas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });

      // Verificar views criadas
      const views = await client.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name LIKE 'automation%'
        OR table_name LIKE 'organization_automation%'
        ORDER BY table_name
      `);

      console.log('\n✅ Views criadas:');
      views.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });

      // Verificar função criada
      const functions = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%automation%'
      `);

      console.log('\n✅ Functions criadas:');
      functions.rows.forEach(row => {
        console.log(`   - ${row.routine_name}()`);
      });

      // Verificar se automação de exemplo foi criada
      const exampleAutomation = await client.query(`
        SELECT id, name, type, status
        FROM automations
        WHERE name LIKE '%Exemplo%'
        LIMIT 1
      `);

      if (exampleAutomation.rows.length > 0) {
        console.log('\n✅ Automação de exemplo criada:');
        console.log(`   ID: ${exampleAutomation.rows[0].id}`);
        console.log(`   Nome: ${exampleAutomation.rows[0].name}`);
        console.log(`   Tipo: ${exampleAutomation.rows[0].type}`);
        console.log(`   Status: ${exampleAutomation.rows[0].status}`);
      }

      console.log('\n🎉 Migration 004_automations.sql executada com sucesso!');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro durante a transação - revertida');
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexão fechada');
  }
}

runMigration();
