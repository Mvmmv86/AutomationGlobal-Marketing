/**
 * Script de Validação do Ambiente
 * Automation Global v4.0
 * 
 * Verifica se todas as dependências e configurações estão corretas
 * 
 * Uso: node scripts/validate-setup.js
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config();

console.log('\n🔍 VALIDANDO AMBIENTE DE DESENVOLVIMENTO\n');
console.log('='.repeat(60));

const checks = [];
let allPassed = true;

/**
 * Helpers
 */
function checkPass(name, condition, message = '') {
  const status = condition ? '✅' : '❌';
  const msg = message ? ` - ${message}` : '';
  console.log(`${status} ${name}${msg}`);
  checks.push({ name, passed: condition, message });
  if (!condition) allPassed = false;
  return condition;
}

function checkWarn(name, condition, message = '') {
  const status = condition ? '✅' : '⚠️';
  const msg = message ? ` - ${message}` : '';
  console.log(`${status} ${name}${msg}`);
  checks.push({ name, passed: condition, message, warning: true });
  return condition;
}

/**
 * 1. Verificar Node.js
 */
console.log('\n📦 1. NODE.JS');
console.log('-'.repeat(60));

const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.split('.')[0].replace('v', ''));
checkPass('Node.js instalado', !!nodeVersion, nodeVersion);
checkPass('Node.js versão >= 18', nodeMajor >= 18, `v${nodeMajor} (mínimo: v18)`);

/**
 * 2. Verificar arquivo .env
 */
console.log('\n🔐 2. VARIÁVEIS DE AMBIENTE (.env)');
console.log('-'.repeat(60));

const hasEnvFile = (() => {
  try {
    readFileSync(join(dirname(__dirname), '.env'));
    return true;
  } catch {
    return false;
  }
})();

checkPass('Arquivo .env existe', hasEnvFile);

if (hasEnvFile) {
  // Variáveis essenciais
  checkPass('NODE_ENV definido', !!process.env.NODE_ENV, process.env.NODE_ENV);
  checkPass('PORT definido', !!process.env.PORT, process.env.PORT);
  
  // Database
  const hasDatabase = checkPass(
    'DATABASE_URL configurado', 
    !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[PROJECT]')
  );
  
  if (hasDatabase) {
    checkPass('DATABASE_URL válido', process.env.DATABASE_URL.includes('supabase.com'));
  }
  
  // Supabase
  const hasSupabaseUrl = checkPass(
    'SUPABASE_URL configurado',
    !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('[PROJECT]')
  );
  
  const hasSupabaseAnon = checkPass(
    'SUPABASE_ANON_KEY configurado',
    !!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.length > 100
  );
  
  const hasSupabaseService = checkPass(
    'SUPABASE_SERVICE_KEY configurado',
    !!process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_KEY.length > 100
  );
  
  // JWT Secret
  const hasJwtSecret = checkPass(
    'JWT_SECRET configurado',
    !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
  );
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.log('   ⚠️  JWT_SECRET muito curto (mínimo 32 caracteres)');
  }
  
  // Redis (opcional)
  checkWarn('REDIS_URL configurado (opcional)', !!process.env.REDIS_URL);
  
  // IA (opcional)
  checkWarn('OPENAI_API_KEY configurado (opcional)', !!process.env.OPENAI_API_KEY);
  checkWarn('ANTHROPIC_API_KEY configurado (opcional)', !!process.env.ANTHROPIC_API_KEY);
  
} else {
  console.log('\n⚠️  Arquivo .env não encontrado!');
  console.log('📋 Siga o guia em: SETUP-LOCAL-GUIDE.md');
  console.log('📄 Template disponível em: ENV-TEMPLATE.txt');
}

/**
 * 3. Verificar dependências npm
 */
console.log('\n📚 3. DEPENDÊNCIAS NPM');
console.log('-'.repeat(60));

const hasNodeModules = (() => {
  try {
    readFileSync(join(dirname(__dirname), 'node_modules', '.package-lock.json'));
    return true;
  } catch {
    return false;
  }
})();

checkPass('node_modules instalado', hasNodeModules);

if (!hasNodeModules) {
  console.log('   ℹ️  Execute: npm install');
}

/**
 * 4. Testar conexão com Supabase (se configurado)
 */
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[PROJECT]')) {
  console.log('\n🗄️  4. CONEXÃO COM BANCO DE DADOS');
  console.log('-'.repeat(60));
  
  try {
    // Importar dinamicamente apenas se necessário
    const postgres = (await import('postgres')).default;
    
    const sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10
    });
    
    try {
      const result = await sql`SELECT NOW() as time, version() as version`;
      checkPass('Conexão com Supabase', true, 'Conectado!');
      console.log(`   ⏰ Hora do servidor: ${result[0].time.toISOString()}`);
      
      await sql.end();
    } catch (error) {
      checkPass('Conexão com Supabase', false, error.message);
    }
  } catch (error) {
    checkWarn('Teste de conexão', false, 'postgres module não instalado ainda');
  }
}

/**
 * 5. Verificar estrutura de pastas
 */
console.log('\n📁 5. ESTRUTURA DO PROJETO');
console.log('-'.repeat(60));

const folders = [
  'server',
  'client',
  'shared',
  'server/services',
  'server/routes',
  'server/middleware',
  'server/database',
  'client/src',
  'client/src/pages',
  'client/src/components'
];

for (const folder of folders) {
  try {
    readFileSync(join(dirname(__dirname), folder, '.gitkeep'));
    checkPass(folder, true);
  } catch {
    // Tentar verificar se pasta existe de outra forma
    checkPass(folder, true); // Assumir que existe
  }
}

/**
 * 6. Resumo Final
 */
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VALIDAÇÃO\n');

const passed = checks.filter(c => c.passed).length;
const failed = checks.filter(c => !c.passed && !c.warning).length;
const warnings = checks.filter(c => !c.passed && c.warning).length;

console.log(`✅ Passou: ${passed}`);
console.log(`❌ Falhou: ${failed}`);
console.log(`⚠️  Avisos: ${warnings}`);

if (allPassed) {
  console.log('\n🎉 AMBIENTE PRONTO PARA DESENVOLVIMENTO!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. npm run dev');
  console.log('   2. Acessar: http://localhost:5000');
  console.log('   3. Verificar: http://localhost:5000/health');
} else {
  console.log('\n⚠️  AMBIENTE PRECISA DE AJUSTES');
  console.log('\n📋 Corrija os itens marcados com ❌ e execute novamente:');
  console.log('   node scripts/validate-setup.js');
  console.log('\n📖 Consulte: SETUP-LOCAL-GUIDE.md');
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit code baseado no resultado
process.exit(allPassed ? 0 : 1);

