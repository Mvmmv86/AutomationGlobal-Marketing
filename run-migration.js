import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('🚀 RODANDO MIGRATION DA SEMANA 2\n');
  console.log('=' .repeat(80));

  // Ler arquivo SQL
  console.log('📄 Lendo arquivo: server/db/migrations/005_social_integrations.sql\n');
  const sqlContent = readFileSync('server/db/migrations/005_social_integrations.sql', 'utf-8');

  console.log(`✅ Arquivo lido (${sqlContent.split('\n').length} linhas)\n`);
  console.log('🔧 Executando SQL no Supabase...\n');

  try {
    // Executar SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      // Se RPC não existir, tentar via PostgREST query
      console.log('⚠️  exec_sql não disponível, tentando método alternativo...\n');

      // Split SQL em comandos individuais
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      console.log(`📋 ${commands.length} comandos SQL encontrados\n`);

      // Para migration SQL complexa, precisamos usar psql
      console.log('❌ ATENÇÃO: Migration SQL complexa requer psql ou SQL Editor do Supabase!\n');
      console.log('=' .repeat(80));
      console.log('\n📖 INSTRUÇÕES:\n');
      console.log('OPÇÃO 1 (RECOMENDADO): Via Supabase SQL Editor');
      console.log('1. Acesse: https://zqzxaulmzwymkybctnzw.supabase.co');
      console.log('2. Vá em "SQL Editor" no menu lateral');
      console.log('3. Clique em "New query"');
      console.log('4. Copie TODO o conteúdo de: server/db/migrations/005_social_integrations.sql');
      console.log('5. Cole no editor e clique em "Run" (Ctrl+Enter)\n');

      console.log('OPÇÃO 2: Via psql (linha de comando)');
      console.log('Você precisa ter psql instalado e a senha CORRETA do banco.\n');
      console.log('Comando:');
      console.log('psql "postgresql://postgres.zqzxaulmzwymkybctnzw:[SENHA]@aws-1-us-east-1.pooler.supabase.com:6543/postgres" -f server/db/migrations/005_social_integrations.sql\n');

      console.log('A senha do banco você encontra em: Settings → Database → Database Password\n');
      console.log('=' .repeat(80));

      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ MIGRATION EXECUTADA COM SUCESSO!\n');
    console.log('=' .repeat(80));
    console.log('\n📊 5 TABELAS CRIADAS:');
    console.log('✅ social_accounts       - Contas OAuth conectadas');
    console.log('✅ social_posts          - Posts e agendamentos');
    console.log('✅ social_metrics        - Métricas coletadas');
    console.log('✅ social_sync_logs      - Logs de sincronização');
    console.log('✅ social_comments       - Comentários coletados\n');

    console.log('🎯 PRÓXIMO PASSO: Verificar tabelas');
    console.log('Execute: node check-supabase-api.js\n');

  } catch (error) {
    console.error('❌ ERRO ao executar migration:', error.message);
    console.error('\n📖 SOLUÇÃO: Use o Supabase SQL Editor (veja INSTRUCOES-MIGRATION-SEMANA-2.md)\n');
    process.exit(1);
  }
}

runMigration();
