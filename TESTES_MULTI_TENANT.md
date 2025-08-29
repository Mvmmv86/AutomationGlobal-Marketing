# Testes Detalhados - Sistema Multi-Tenant v4.0

## Configuração dos Testes

### Token JWT Válido (Renovar se expirado):
```bash
curl -X POST "http://localhost:5000/api/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "auth-local@automation.global", "password": "123456"}'
```

## 1. Teste de Criação de Organização

### 1.1 Criar Primeira Organização
```bash
curl -X POST "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Agency",
    "slug": "marketing-agency",
    "description": "Agência de marketing digital",
    "type": "marketing",
    "subscriptionPlan": "professional"
  }'
```

**Resultado Esperado:**
- Status 201
- Organização criada com super_admin role
- ID da organização retornado

### 1.2 Criar Segunda Organização
```bash
curl -X POST "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Center",
    "slug": "support-center",
    "description": "Central de suporte ao cliente",
    "type": "support",
    "subscriptionPlan": "starter"
  }'
```

## 2. Teste de Listagem de Organizações

### 2.1 Listar Organizações do Usuário
```bash
curl -X GET "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- Lista com 2+ organizações
- Cada organização com dados completos
- Membership com role correto
- currentContext null (sem contexto ativo)

## 3. Teste de Switch de Contexto

### 3.1 Obter ID da Primeira Organização
Pegar o ID da organização retornado no teste anterior.

### 3.2 Switch para Contexto Específico
```bash
curl -X POST "http://localhost:5000/api/organizations/switch-context" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "[ORG_ID]"}'
```

**Resultado Esperado:**
- Context switch successful
- Dados completos da organização
- Role e permissions do usuário

### 3.3 Verificar Contexto Atual
```bash
curl -X GET "http://localhost:5000/api/organizations/current" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- Contexto ativo da organização selecionada
- Dados completos da organização e membership

## 4. Teste de Isolamento de Dados (Tenant Isolation)

### 4.1 Acessar Organização com Contexto via Header
```bash
curl -X GET "http://localhost:5000/api/organizations/[ORG_ID]" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "X-Organization-ID: [ORG_ID]"
```

**Resultado Esperado:**
- Acesso autorizado
- Dados da organização retornados

### 4.2 Tentar Acessar Organização Inexistente
```bash
curl -X GET "http://localhost:5000/api/organizations/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- Status 403 ou 404
- Acesso negado
- Mensagem de erro apropriada

### 4.3 Acessar sem Token (Não Autenticado)
```bash
curl -X GET "http://localhost:5000/api/organizations"
```

**Resultado Esperado:**
- Status 401
- Unauthorized error

## 5. Teste de Membros da Organização

### 5.1 Listar Membros da Organização
```bash
curl -X GET "http://localhost:5000/api/organizations/[ORG_ID]/members" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- Lista com pelo menos 1 membro (criador)
- Role super_admin para o criador
- Dados do usuário completos

## 6. Teste de Contexto Automático

### 6.1 Listar Organizações Após Switch
```bash
curl -X GET "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- currentContext preenchido
- Organização e role do contexto ativo

### 6.2 Contexto via Query Parameter
```bash
curl -X GET "http://localhost:5000/api/organizations/[ORG_ID]?org_id=[ORG_ID]" \
  -H "Authorization: Bearer [TOKEN]"
```

**Resultado Esperado:**
- Contexto detectado automaticamente
- Acesso autorizado à organização

## 7. Teste de Validação e Middlewares

### 7.1 Slug Duplicado (Deve Falhar)
```bash
curl -X POST "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate Org",
    "slug": "marketing-agency"
  }'
```

**Resultado Esperado:**
- Status 400
- Erro de slug já existe

### 7.2 Dados Inválidos (Deve Falhar)
```bash
curl -X POST "http://localhost:5000/api/organizations" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "slug": "invalid slug with spaces",
    "subscriptionPlan": "invalid_plan"
  }'
```

**Resultado Esperado:**
- Status 400
- Múltiplos erros de validação
- Mensagens detalhadas do Zod

## 8. Teste de Audit e Logging

### 8.1 Verificar Logs de Tenant Actions
Verificar nos logs do servidor:
- Context switching
- Organization creation
- Data isolation enforcement

### 8.2 Teste de Performance
```bash
# Múltiplas requests simultâneas
for i in {1..5}; do
  curl -X GET "http://localhost:5000/api/organizations" \
    -H "Authorization: Bearer [TOKEN]" &
done
wait
```

## 9. Teste de Permissões e Roles

### 9.1 Verificar Role Super Admin
O usuário criador deve ter role "super_admin" e todas as permissões.

### 9.2 Teste de Inheritance de Contexto
Context deve ser mantido entre requests na mesma sessão.

## 10. Interface de Teste Visual

### 10.1 Acessar Interface de Teste
```
http://localhost:5000/multi-tenant-test
```

### 10.2 Executar Todos os Testes
1. Inserir token JWT válido
2. Clicar em "Executar Todos os Testes"
3. Verificar todos os resultados verdes

## Critérios de Sucesso

### ✅ Sistema Multi-Tenant Funcional Se:
1. **Criação**: Organizações criadas com sucesso
2. **Listagem**: Múltiplas organizações listadas corretamente
3. **Context Switch**: Mudança de contexto funciona
4. **Isolamento**: Dados isolados por organização
5. **Middleware**: Context detectado automaticamente
6. **Permissions**: Roles e permissões funcionando
7. **Validation**: Validações Zod funcionando
8. **Logging**: Audit trail completo
9. **Performance**: Responses < 1s
10. **UI**: Interface de teste funcionando

### ❌ Sistema Falhou Se:
- Organizações não criadas (DB connection issues)
- Context não detectado (middleware issues)
- Dados vazados entre tenants (isolation failure)
- Validações não funcionando (schema issues)
- Errors sem mensagens claras (error handling issues)

## Próximos Passos após Validação

1. **Task 2.4**: Gestão de Permissões Granular
2. **Task 2.5**: API Rate Limiting e Throttling  
3. **Task 2.6**: Logging e Monitoramento Completo

## Notas de Implementação

- **Drizzle ORM**: Única forma confiável de conexão Replit → Supabase
- **Port 6543**: Supabase pooler funciona no Replit
- **Context Headers**: X-Organization-ID, org_id query param
- **Token Expiry**: 1h access token, renovar quando necessário
- **Schema Validation**: Zod schemas validando todos os inputs
- **Error Handling**: Mensagens estruturadas e códigos específicos