// Debug migration line by line
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function debugMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    const sql = readFileSync('./migrations/003_ai_management.sql', 'utf8');

    // Split por statement (usando ; como delimitador mas cuidado com ; dentro de funções)
    const statements = sql
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`\n📄 Total de statements: ${statements.length}\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Mostrar preview do statement
      const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] Executando: ${preview}...`);

      try {
        await client.query(stmt);
        console.log(`✅ OK\n`);
      } catch (error) {
        console.error(`❌ ERRO no statement ${i + 1}:`);
        console.error(`Statement: ${stmt.substring(0, 200)}`);
        console.error(`Erro: ${error.message}`);
        console.error('\nParando execução...\n');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await client.end();
  }
}

debugMigration();
