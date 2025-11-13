import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeMigration() {
  console.log('🚀 EXECUTANDO MIGRATION DA SEMANA 2 NO SUPABASE\n');
  console.log('=' .repeat(80));

  // Criar cliente Supabase com service role
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Cliente Supabase conectado\n');

  // Ler migration SQL
  console.log('📄 Lendo migration: server/db/migrations/005_social_integrations.sql');
  const sqlContent = readFileSync('server/db/migrations/005_social_integrations.sql', 'utf-8');
  console.log(`✅ ${sqlContent.split('\n').length} linhas carregadas\n`);

  console.log('🔧 Executando SQL commands...\n');

  // Split SQL em comandos individuais (por ; seguido de newline)
  const commands = [];
  let currentCommand = '';
  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Ignorar linhas vazias e comentários
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    currentCommand += line + '\n';

    // Se a linha termina com ;, é o fim de um comando
    if (trimmed.endsWith(';')) {
      commands.push(currentCommand.trim());
      currentCommand = '';
    }
  }

  console.log(`📋 ${commands.length} comandos SQL encontrados\n`);
  console.log('=' .repeat(80));

  let successCount = 0;
  let errorCount = 0;

  // Executar cada comando
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const commandPreview = command.substring(0, 60).replace(/\n/g, ' ') + '...';

    try {
      process.stdout.write(`[${i+1}/${commands.length}] ${commandPreview} `);

      const { data, error } = await supabase.rpc('exec_sql', { sql: command });

      if (error) {
        // Se exec_sql não existir, tentar via query direto
        throw error;
      }

      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌`);
      console.log(`    Erro: ${error.message}`);
      errorCount++;

      // Se for erro crítico, parar
      if (error.message.includes('does not exist') && error.message.includes('organizations')) {
        console.log('\n⚠️  ERRO CRÍTICO: Tabela "organizations" não existe!');
        console.log('    A migration depende de tabelas base que ainda não existem.\n');
        process.exit(1);
      }
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log(`\n📊 RESULTADO:`);
  console.log(`✅ Sucesso: ${successCount} comandos`);
  console.log(`❌ Erros: ${errorCount} comandos\n`);

  if (errorCount === 0) {
    console.log('🎉 MIGRATION COMPLETADA COM SUCESSO!\n');
    console.log('📋 Próximo passo: Verificar tabelas criadas');
    console.log('Execute: node check-supabase-api.js\n');
  } else {
    console.log('⚠️  Alguns comandos falharam. Veja detalhes acima.\n');
  }
}

executeMigration().catch(error => {
  console.error('\n❌ ERRO FATAL:', error.message);
  console.error(error);
  process.exit(1);
});
