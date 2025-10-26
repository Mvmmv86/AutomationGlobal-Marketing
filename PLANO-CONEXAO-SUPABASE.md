# 🗄️ Plano de Ação: Conexão com Banco de Dados Supabase

**Data:** 03/10/2025  
**Versão:** 1.0  
**Status:** 🔄 Em Planejamento

---

## 📋 Objetivo

Configurar e validar a conexão do Automation Global v4.0 com o banco de dados PostgreSQL do Supabase, garantindo que todas as operações de CRUD funcionem corretamente.

---

## 🔍 Situação Atual

### ❌ Problemas Identificados:

1. **Timeout de 21+ segundos** em requisições que precisam do banco
2. **Erro de autenticação**: `password authentication failed for user "postgres"`
3. **Connection timeout**: Tentando conectar nos IPs `18.213.155.45` e `3.227.209.82`
4. **Endpoints afetados**:
   - `/api/social-media/content-stats` → 500 (timeout)
   - `/api/social-media/recent-posts` → 200 mas vazio (timeout + fallback)
   - `/api/auth/register` → 400 (erro de DB)
   - `/api/auth/login` → 401 (erro de DB)

### ✅ O que está funcionando:

- ✅ Servidor não crasha (tratamento de erro funcionando)
- ✅ Frontend carrega normalmente
- ✅ Endpoints que não precisam de DB funcionam
- ✅ Sistema tem fallbacks para erros de DB

---

## 📝 Checklist de Informações Necessárias

Antes de começar, precisamos coletar as seguintes informações do Supabase:

### 🔑 Credenciais de Conexão:

- [ ] **SUPABASE_URL**: URL do projeto (ex: `https://xxxxx.supabase.co`)
- [ ] **SUPABASE_ANON_KEY**: Chave pública para uso no frontend
- [ ] **SUPABASE_SERVICE_KEY**: Chave secreta para uso no backend (⚠️ NUNCA expor)
- [ ] **DATABASE_URL**: String de conexão direta com PostgreSQL

### 📊 Informações do Projeto:

- [ ] Nome do projeto no Supabase
- [ ] Região do banco de dados
- [ ] Plano atual (Free, Pro, etc)
- [ ] Pool de conexões configurado?

### 🗂️ Schema e Tabelas:

- [ ] Verificar se as tabelas já foram criadas
- [ ] Verificar se RLS (Row Level Security) está habilitado
- [ ] Verificar se há dados de seed necessários

---

## 🎯 Plano de Ação - Passo a Passo

### **FASE 1: Coleta de Credenciais** (5-10 min)

#### Passo 1.1: Acessar Dashboard do Supabase
1. Acesse: https://app.supabase.com
2. Faça login na conta
3. Selecione o projeto "Automation Global" (ou crie um novo)

#### Passo 1.2: Obter Credenciais
No dashboard do Supabase:
1. Vá em **Settings** → **API**
2. Copiar:
   - `Project URL` → SUPABASE_URL
   - `anon public` → SUPABASE_ANON_KEY
   - `service_role secret` → SUPABASE_SERVICE_KEY

3. Vá em **Settings** → **Database**
4. Copiar:
   - `Connection string` → DATABASE_URL
   - **IMPORTANTE**: Substituir `[YOUR-PASSWORD]` pela senha real do banco

#### Passo 1.3: Atualizar arquivo .env
```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Direct Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

---

### **FASE 2: Validação de Conexão** (10-15 min)

#### Passo 2.1: Testar Conexão Básica
```bash
# No terminal do projeto
npm run dev
```

Verificar no console:
- ✅ Deve aparecer: `✅ Drizzle + Supabase configurado com sucesso!`
- ✅ Não deve ter erros de autenticação
- ❌ Se aparecer erro, revisar credenciais

#### Passo 2.2: Testar Health Check
```bash
curl http://localhost:5000/api/health
```

Verificar resposta:
- `database.status` deve ser `"healthy"` (não `"unhealthy"`)
- Não deve ter `"password authentication failed"`

#### Passo 2.3: Testar Endpoint Simples
```bash
curl http://localhost:5000/api/version
```

Deve retornar versão do sistema sem erros.

---

### **FASE 3: Criação do Schema** (15-30 min)

#### Passo 3.1: Verificar se Tabelas Existem
No dashboard do Supabase:
1. Vá em **Table Editor**
2. Verificar se as seguintes tabelas existem:
   - `users`
   - `organizations`
   - `organization_users`
   - `sessions`
   - Outras tabelas do schema

#### Passo 3.2: Criar Tabelas (se necessário)

**Opção A: Usar Migration Script**
```bash
npm run db:push
```

**Opção B: SQL Manual**
Arquivo disponível em: `docs/SUPABASE-MANUAL-SETUP.md`
1. Abrir SQL Editor no Supabase
2. Copiar e colar o SQL do arquivo
3. Executar

#### Passo 3.3: Verificar RLS (Row Level Security)
1. No Supabase, vá em **Authentication** → **Policies**
2. Verificar se as políticas estão criadas
3. Se necessário, executar SQL do arquivo `database/rls-setup.sql`

---

### **FASE 4: Testes de CRUD** (15-20 min)

#### Passo 4.1: Testar Registro de Usuário
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@automation.com",
    "password": "Senha123!",
    "name": "Usuário Teste",
    "planType": "starter"
  }'
```

**Resultado esperado:**
- Status: `201 Created`
- Resposta com `user`, `organization`, `tokens`

#### Passo 4.2: Testar Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@automation.com",
    "password": "Senha123!"
  }'
```

**Resultado esperado:**
- Status: `200 OK`
- Resposta com `accessToken` e `refreshToken`

#### Passo 4.3: Verificar Dados no Supabase
1. Ir no **Table Editor**
2. Verificar se aparece o usuário criado na tabela `users`
3. Verificar se aparece a organização na tabela `organizations`

---

### **FASE 5: Validação de Performance** (10 min)

#### Passo 5.1: Verificar Latência
Acessar endpoints e verificar tempo de resposta:
- `/api/health` → Deve responder em < 1 segundo
- `/api/auth/login` → Deve responder em < 2 segundos
- `/api/social-media/recent-posts` → Deve responder em < 3 segundos

#### Passo 5.2: Verificar Logs
No console do servidor, verificar:
- ✅ Sem erros `ETIMEDOUT`
- ✅ Sem erros `password authentication failed`
- ✅ Queries executando com sucesso
- ✅ Tempo de resposta aceitável

---

## 🔧 Troubleshooting - Problemas Comuns

### Problema 1: "password authentication failed"
**Causa:** Senha incorreta no DATABASE_URL  
**Solução:**
1. Ir em Settings → Database no Supabase
2. Resetar senha do banco
3. Atualizar DATABASE_URL com nova senha

### Problema 2: "connect ETIMEDOUT"
**Causa:** Firewall ou IP bloqueado  
**Solução:**
1. Verificar se está usando connection pooler correto
2. Usar porta 6543 (pooler) ao invés de 5432 (direto)
3. Verificar se DATABASE_URL tem formato correto

### Problema 3: Tabelas não existem
**Causa:** Schema não foi criado  
**Solução:**
1. Executar `npm run db:push`
2. Ou criar manualmente via SQL Editor
3. Verificar no Table Editor se tabelas apareceram

### Problema 4: RLS bloqueando operações
**Causa:** Row Level Security muito restritivo  
**Solução:**
1. Desabilitar RLS temporariamente para testes
2. Ou usar SUPABASE_SERVICE_KEY que bypassa RLS
3. Configurar políticas corretas depois

---

## ✅ Critérios de Sucesso

A conexão com Supabase estará **100% funcional** quando:

- [ ] Health check retorna `database: healthy`
- [ ] Registro de usuário funciona (201 Created)
- [ ] Login funciona (200 OK + tokens)
- [ ] Dados aparecem no Table Editor do Supabase
- [ ] Endpoints de social media retornam dados reais (não vazios)
- [ ] Tempo de resposta < 3 segundos
- [ ] Zero erros de timeout ou autenticação no console

---

## 📊 Próximos Passos Após Conexão

Uma vez que o banco estiver conectado:

1. ✅ **Testar todos os endpoints** da API
2. ✅ **Criar dados de seed** para desenvolvimento
3. ✅ **Validar sistema de permissões** (Starter/Pro/Enterprise)
4. ✅ **Testar fluxo completo** de autenticação
5. 🚀 **Preparar para deploy em produção**

---

## 🎯 Timeline Estimado

| Fase | Tempo Estimado | Prioridade |
|------|----------------|------------|
| Fase 1: Coleta de Credenciais | 5-10 min | 🔥 Crítica |
| Fase 2: Validação de Conexão | 10-15 min | 🔥 Crítica |
| Fase 3: Criação do Schema | 15-30 min | ⚠️ Alta |
| Fase 4: Testes de CRUD | 15-20 min | ⚠️ Alta |
| Fase 5: Validação de Performance | 10 min | ✅ Média |

**Total:** 55-85 minutos (aproximadamente 1-1.5 horas)

---

## 📝 Notas Importantes

### ⚠️ Segurança:
- **NUNCA** commitar credenciais no Git
- **SEMPRE** usar `.env` para secrets
- **NUNCA** expor `SUPABASE_SERVICE_KEY` no frontend
- Usar `SUPABASE_ANON_KEY` apenas para operações públicas

### 💡 Boas Práticas:
- Testar em ambiente de desenvolvimento primeiro
- Criar projeto Supabase separado para produção
- Usar variáveis de ambiente diferentes (dev vs prod)
- Monitorar uso de conexões no dashboard do Supabase

### 🔄 Backup:
- Antes de fazer alterações no schema, fazer backup
- Supabase tem backups automáticos (verificar plano)
- Manter scripts SQL de migração versionados

---

**Preparado para começar?** 🚀

**Próximo passo:** Coletar credenciais do Supabase e atualizar o arquivo `.env`

