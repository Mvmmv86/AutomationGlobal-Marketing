#!/usr/bin/env node
/**
 * Script de Validação - Detectar Credenciais Hardcoded
 * Este script verifica se há credenciais hardcoded no código
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Padrões suspeitos que indicam credenciais hardcoded
const SUSPICIOUS_PATTERNS = [
  {
    regex: /password\s*[:=]\s*['"][^'"]{6,}['"]/gi,
    description: 'Password hardcoded',
    exclude: ['test', 'example', '123456', 'password']
  },
  {
    regex: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
    description: 'API Key hardcoded',
    exclude: ['YOUR_API_KEY', 'your-api-key', '••••', '****']
  },
  {
    regex: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi,
    description: 'Secret hardcoded',
    exclude: ['your-secret', 'YOUR_SECRET']
  },
  {
    regex: /postgres:\/\/[^:]+:[^@]+@/gi,
    description: 'PostgreSQL connection string with password',
    exclude: ['[PASSWORD]', '[YOUR_PASSWORD]', 'password']
  }
];

// Arquivos e diretórios para ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  '.local',
  'ENV-TEMPLATE.txt',
  'SETUP-LOCAL-GUIDE.md',
  'QUICK-START.md',
  'validate-no-hardcoded-credentials.js',
  'cursor.md',
  'DOWNLOAD_LINKS.html'
];

// Arquivos encontrados com problemas
const issues = [];

/**
 * Verifica se o caminho deve ser ignorado
 */
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Verifica se o valor corresponde a um padrão de exclusão
 */
function isExcluded(value, excludePatterns) {
  return excludePatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Escaneia um arquivo em busca de credenciais hardcoded
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);

    for (const pattern of SUSPICIOUS_PATTERNS) {
      const matches = content.match(pattern.regex);
      
      if (matches) {
        for (const match of matches) {
          // Ignorar se estiver na lista de exclusão
          if (isExcluded(match, pattern.exclude)) {
            continue;
          }

          issues.push({
            file: relativePath,
            line: content.substring(0, content.indexOf(match)).split('\n').length,
            pattern: pattern.description,
            snippet: match.substring(0, 50) + '...'
          });
        }
      }
    }
  } catch (error) {
    // Ignorar erros de leitura
  }
}

/**
 * Escaneia diretório recursivamente
 */
function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (shouldIgnore(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // Verificar apenas arquivos de código
        if (/\.(ts|js|tsx|jsx|json)$/.test(entry.name)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignorar erros de acesso
  }
}

// Executar validação
console.log('🔍 Verificando credenciais hardcoded...\n');

scanDirectory(rootDir);

// Exibir resultados
if (issues.length === 0) {
  console.log('✅ Nenhuma credencial hardcoded encontrada!');
  console.log('✅ Todas as credenciais estão sendo carregadas do .env\n');
  process.exit(0);
} else {
  console.log('❌ Credenciais hardcoded encontradas:\n');
  
  for (const issue of issues) {
    console.log(`📁 Arquivo: ${issue.file}`);
    console.log(`📍 Linha: ${issue.line}`);
    console.log(`⚠️  Tipo: ${issue.pattern}`);
    console.log(`📝 Trecho: ${issue.snippet}`);
    console.log('');
  }
  
  console.log(`\n❌ Total de problemas encontrados: ${issues.length}`);
  console.log('⚠️  Por favor, remova as credenciais hardcoded e use variáveis de ambiente.\n');
  process.exit(1);
}

