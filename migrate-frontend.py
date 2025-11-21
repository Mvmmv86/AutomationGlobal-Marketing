#!/usr/bin/env python3
"""
Script para migrar MarketingDashboardComplete.tsx
Atualiza chamadas de API antiga para nova API
"""

import re

file_path = r'client\src\pages\MarketingDashboardComplete.tsx'

print('Lendo arquivo...')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print('Aplicando migracoes...')

# Contador de substituições
count = 0

# Substituição 1: Query key de campanhas
old_pattern = r"queryKey: \['/api/social-media/campaigns'\]"
new_value = "queryKey: ['/api/campaigns']"
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Query key: {n} substituicoes')

# Substituição 2: Fetch GET de campanhas
old_pattern = r"const response = await fetch\('/api/social-media/campaigns'\);"
new_value = "const response = await fetch('/api/campaigns');"
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Fetch GET: {n} substituicoes')

# Substituição 3: Fetch POST criar campanha
old_pattern = r"const response = await fetch\('/api/social-media/campaigns/simple', \{"
new_value = "const response = await fetch('/api/campaigns', {"
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Fetch POST: {n} substituicoes')

# Substituição 4: Invalidate query
old_pattern = r"queryClient\.invalidateQueries\(\{ queryKey: \['/api/social-media/campaigns'\] \}\);"
new_value = "queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });"
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Invalidate query: {n} substituicoes')

# Substituição 5: Remover comentários "API ANTIGA"
old_pattern = r" // API ANTIGA - aguardando migração"
new_value = ""
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Comentarios removidos: {n} ocorrencias')

old_pattern = r"// API ANTIGA - aguardando migração para Semana 2\n  "
new_value = ""
content, n = re.subn(old_pattern, new_value, content)
count += n
print(f'  OK Comentarios de linha removidos: {n} ocorrencias')

print(f'\nSalvando arquivo...')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'OK Migracao concluida! Total de {count} alteracoes aplicadas.')
print('\nAlteracoes aplicadas:')
print('- OK Query key: /api/social-media/campaigns -> /api/campaigns')
print('- OK GET: /api/social-media/campaigns -> /api/campaigns')
print('- OK POST: /api/social-media/campaigns/simple -> /api/campaigns')
print('- OK Invalidate queries atualizados')
print('- OK Comentarios "API ANTIGA" removidos')
