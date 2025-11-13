#!/bin/bash
# Testes simples da API AI Management (sem autenticação por enquanto)

BASE_URL="http://localhost:5000/api/admin/ai"

echo "🧪 Testando API AI Management"
echo "================================"
echo ""

# Teste 1: Listar providers
echo "📦 Teste 1: GET /providers"
curl -s -X GET "$BASE_URL/providers" | python -m json.tool 2>/dev/null | head -10
echo ""
echo ""

# Teste 2: Listar models
echo "🤖 Teste 2: GET /models"
curl -s -X GET "$BASE_URL/models" | python -m json.tool 2>/dev/null | head -10
echo ""
echo ""

# Teste 3: Listar quotas
echo "💰 Teste 3: GET /quotas"
curl -s -X GET "$BASE_URL/quotas" | python -m json.tool 2>/dev/null | head -10
echo ""
echo ""

# Teste 4: Usage stats
echo "📊 Teste 4: GET /usage-stats"
curl -s -X GET "$BASE_URL/usage-stats" | python -m json.tool 2>/dev/null | head -10
echo ""
echo ""

# Teste 5: Load balancing config
echo "⚖️  Teste 5: GET /load-balancing"
curl -s -X GET "$BASE_URL/load-balancing" | python -m json.tool 2>/dev/null | head -10
echo ""
echo ""

echo "✅ Testes concluídos!"
