#!/usr/bin/env python3
"""
Script para remover linhas "para Semana 2"
"""

import re

file_path = r'client\src\pages\MarketingDashboardComplete.tsx'

print('Lendo arquivo...')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print('Removendo linhas "para Semana 2"...')

# Remover linhas "para Semana 2" isoladas
content = re.sub(r'\s*para Semana 2\n\s*', '\n      ', content)

print('Salvando arquivo...')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('OK Correcao concluida!')
