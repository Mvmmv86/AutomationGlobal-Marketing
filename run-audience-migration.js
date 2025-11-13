// Executar migration de Audience
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
    const sql = fs.readFileSync('./migrations/005_audience.sql', 'utf8');

    console.log('\n🔄 Executando migration 005_audience.sql...');
    console.log('📊 Criando:');
    console.log('   - 4 ENUMs');
    console.log('   - 6 tabelas');
    console.log('   - 2 views');
    console.log('   - 3 functions + triggers');
    console.log('   - Dados de exemplo (tags e segmentos)\n');

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
        AND (
          table_name LIKE 'contact%'
          OR table_name = 'tags'
          OR table_name = 'segments'
          OR table_name LIKE 'segment%'
        )
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
        AND (
          table_name LIKE '%audience%'
          OR table_name LIKE '%segment%'
        )
        ORDER BY table_name
      `);

      console.log('\n✅ Views criadas:');
      views.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });

      // Verificar functions criadas
      const functions = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND (
          routine_name LIKE '%contact%'
          OR routine_name LIKE '%segment%'
          OR routine_name LIKE '%tag%'
        )
      `);

      console.log('\n✅ Functions criadas:');
      functions.rows.forEach(row => {
        console.log(`   - ${row.routine_name}()`);
      });

      // Verificar tags de exemplo
      const tags = await client.query(`
        SELECT id, name, color
        FROM tags
        WHERE name IN ('Cliente VIP', 'Lead Qualificado', 'Inativo', 'Newsletter')
        ORDER BY name
      `);

      if (tags.rows.length > 0) {
        console.log('\n✅ Tags de exemplo criadas:');
        tags.rows.forEach(row => {
          console.log(`   - ${row.name} (${row.color})`);
        });
      }

      // Verificar segmentos de exemplo
      const segments = await client.query(`
        SELECT id, name, type
        FROM segments
        WHERE name IN ('Todos os Contatos', 'Clientes Ativos')
        ORDER BY name
      `);

      if (segments.rows.length > 0) {
        console.log('\n✅ Segmentos de exemplo criados:');
        segments.rows.forEach(row => {
          console.log(`   - ${row.name} (${row.type})`);
        });
      }

      console.log('\n🎉 Migration 005_audience.sql executada com sucesso!');

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
