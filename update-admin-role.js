// Atualizar role do usuário admin
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function updateAdminRole() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Verificar estrutura da tabela users
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Colunas da tabela users:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Atualizar usando raw_app_meta_data (padrão Supabase)
    const email = 'admin@test.com';

    // Primeiro, tentar com campo role direto
    try {
      const updateResult = await client.query(`
        UPDATE users
        SET raw_app_meta_data = jsonb_set(
          COALESCE(raw_app_meta_data, '{}'::jsonb),
          '{role}',
          '"super_admin"'
        )
        WHERE email = $1
        RETURNING id, email, raw_app_meta_data
      `, [email]);

      if (updateResult.rows.length > 0) {
        console.log('\n✅ Usuário admin atualizado (via raw_app_meta_data):');
        console.log(`   Email: ${updateResult.rows[0].email}`);
        console.log(`   Metadata: ${JSON.stringify(updateResult.rows[0].raw_app_meta_data)}`);
        console.log(`   ID: ${updateResult.rows[0].id}`);
      } else {
        console.log('\n❌ Usuário não encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar metadata:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

updateAdminRole();
