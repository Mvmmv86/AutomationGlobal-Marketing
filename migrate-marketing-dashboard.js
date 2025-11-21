/**
 * Script para migrar MarketingDashboardComplete.tsx
 * Atualiza chamadas de API antiga para nova API
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'MarketingDashboardComplete.tsx');

console.log('📝 Lendo arquivo...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Aplicando migrações...');

// Substituição 1: Query key de campanhas
content = content.replace(
  /queryKey: \[['"]\/api\/social-media\/campaigns['"]\]/g,
  "queryKey: ['/api/campaigns']"
);

// Substituição 2: Fetch de campanhas (GET)
content = content.replace(
  /const response = await fetch\(['"]\/api\/social-media\/campaigns['"]\);/g,
  "const response = await fetch('/api/campaigns');"
);

// Substituição 3: Criar campanha (POST /api/campaigns ao invés de /simple)
content = content.replace(
  /const response = await fetch\(['"]\/api\/social-media\/campaigns\/simple['"], \{/g,
  "const response = await fetch('/api/campaigns', {"
);

// Substituição 4: Invalidate query
content = content.replace(
  /queryClient\.invalidateQueries\(\{ queryKey: \[['"]\/api\/social-media\/campaigns['"]\] \}\);/g,
  "queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });"
);

// Substituição 5: Remover comentários "API ANTIGA"
content = content.replace(
  /\/\/ API ANTIGA - aguardando migração para Semana 2\n/g,
  ''
);

content = content.replace(
  / \/\/ API ANTIGA - aguardando migração/g,
  ''
);

// Adiciona comentário de atualização no topo do arquivo (após imports)
const importEndIndex = content.indexOf('export default function MarketingDashboardComplete');
if (importEndIndex > 0) {
  const beforeComponent = content.substring(0, importEndIndex);
  const afterComponent = content.substring(importEndIndex);

  content = beforeComponent +
    '/**\n' +
    ' * ✅ ATUALIZADO - Semana 2\n' +
    ' * Migrado para usar nova API de campanhas: /api/campaigns\n' +
    ' * Integrado com Analytics API: /api/social-media/analytics\n' +
    ' * Integrado com AI Services: /api/social-media/generate-suggestions e optimize-content\n' +
    ' */\n\n' +
    afterComponent;
}

console.log('💾 Salvando arquivo...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Migração concluída!');
console.log('');
console.log('Alterações aplicadas:');
console.log('- ✅ Query key atualizado: /api/social-media/campaigns → /api/campaigns');
console.log('- ✅ GET atualizado: /api/social-media/campaigns → /api/campaigns');
console.log('- ✅ POST atualizado: /api/social-media/campaigns/simple → /api/campaigns');
console.log('- ✅ Invalidate query atualizado');
console.log('- ✅ Comentários removidos');
