# 🎯 Plano de Refatoração - Automation Global v4.0

## ⚠️ REGRA CRÍTICA - LEIA ANTES DE QUALQUER ALTERAÇÃO

### 🚨 SEMPRE REVISAR O CÓDIGO EXISTENTE ANTES DE CRIAR ALGO MEIANO E GRANDE E COMPLEXO. 

**ANTES DE FAZER ALTERAÇÕES COMPLEXAS OU CRIAR NOVOS SCRIPTS/FUNÇÕES:**

1. **BUSQUE NO CÓDIGO EXISTENTE** se já existe uma solução similar ou função que resolve o problema
2. **SE EXISTIR:** Use ou adapte o que já está implementado
3. **SE NÃO EXISTIR:** Aí sim crie do zero os scripts e funções necessários
4. **NUNCA DUPLIQUE:** Evite criar múltiplas soluções para problemas similares

**OBJETIVO:** Manter o código DRY (Don't Repeat Yourself), organizado e sem duplicações desnecessárias.

---

## 📋 Workflow de Execução

**Ao terminar cada task:**
1. ✅ Revisar e testar completamente o que foi feito
2. ✅ Garantir que está funcionando 100%
3. ✅ Reler este `cursor.md` por completo
4. ✅ Verificar qual é a próxima task
5. ✅ Executar a próxima task

**NUNCA passe para a próxima task sem ter completado e validado a anterior.**

---

## 🔥 PLANO DE AÇÃO - ITENS CRÍTICOS

### ❗ 1. Silenciar Erros Redis no Console (30min)
**Problema:** Erros Redis poluindo logs e degradando experiência
**Solução:**
- Configurar `redis-client.ts` com `retryStrategy` inteligente
- Limitar tentativas de reconexão (max 3)
- Log único de fallback para in-memory
- Silenciar eventos `error` duplicados do ioredis

**Arquivos:**
- `server/cache/redis-client.ts`
- `server/queue/queue-manager.ts`

**Resultado esperado:** Zero erros Redis no console quando não disponível

---

### ❗ 2. Remover Credenciais Hardcoded (20min)
**Problema:** Credenciais Supabase hardcoded no código
**Solução:**
- Remover credenciais de `drizzle-connection.ts`
- Usar APENAS variáveis do `.env`
- Validar que `DATABASE_URL` está sendo usada corretamente

**Arquivos:**
- `server/database/drizzle-connection.ts`
- `AutomationGlobal/.env`

**Resultado esperado:** Zero credenciais hardcoded no código

---

### ❗ 3. Consolidar Sistema de Autenticação (1-2h)
**Problema:** Múltiplos arquivos de auth (`auth.ts`, `auth-v2.ts`, `auth-local.ts`)
**Solução:**
- Identificar arquivo principal usado em produção
- Mover lógica para arquivo único
- Remover arquivos duplicados
- Atualizar imports

**Arquivos:**
- `server/blueprints/auth.ts` (principal)
- `server/blueprints/auth-v2.ts` (avaliar)
- `server/blueprints/auth-local.ts` (avaliar)                           
- `server/services/auth-service.ts`
- `server/middleware/auth-middleware.ts`

**Resultado esperado:** Sistema de auth unificado e sem duplicação

---

## 🔸 PLANO DE AÇÃO - ITENS IMPORTANTES

### 🔹 4. Implementar Logging Estruturado (1h) - ⚠️ PENDENTE PARA PRODUÇÃO
**Problema:** Logs inconsistentes (console.log, winston, custom)
**Solução:**
- Padronizar com Winston em todos os arquivos
- Criar níveis claros: ERROR, WARN, INFO, DEBUG
- Adicionar contexualização (requestId, userId, orgId)

**Arquivos:**
- `server/services/logging-service.ts` (expandir)
- Todos os arquivos com `console.log`

**Resultado esperado:** Logs estruturados e rastreáveis

**⚠️ NOTA IMPORTANTE:**
Esta task foi tentada mas causou crash no servidor em ambiente de desenvolvimento.
Foi revertida e marcada como **PENDENTE PARA IMPLEMENTAÇÃO EM PRODUÇÃO** após mais testes e ajustes.
Os arquivos criados (`server/services/logger.ts` e `server/middleware/logging-middleware.ts`) foram mantidos para referência futura.

---

### 🔹 5. Tratamento de Erros Consistente (1h)
**Problema:** Erros tratados de forma inconsistente
**Solução:**
- Criar classes de erro customizadas
- Middleware global de error handling
- Respostas de erro padronizadas

**Arquivos:**
- `server/middleware/error-handler.ts` (criar)
- `server/app.ts`

**Resultado esperado:** Erros tratados de forma uniforme

---

### 🔹 6. Graceful Handling de Serviços Externos (1h) - ⏰ PENDENTE PARA PRODUÇÃO
**Problema:** Falhas em Redis/DB/AI causam crashes
**Solução:**
- Circuit breakers para OpenAI/Anthropic
- Timeouts configuráveis
- Retry com backoff exponencial
- Fallbacks robustos

**Arquivos:**
- `server/services/ai.ts`
- `server/cache/redis-client.ts`
- `server/queue/queue-manager.ts`

**Resultado esperado:** Sistema resiliente a falhas externas

**⚠️ NOTA IMPORTANTE:**
Esta task já tem implementações básicas funcionando (fallbacks Redis, timeouts DB, fallback AI).
Marcada como **PENDENTE PARA IMPLEMENTAÇÃO EM PRODUÇÃO** para otimizações avançadas após validação com dados reais.

---

## 🛡️ Boas Práticas de Segurança

### 1. **Credenciais e Secrets**
- ❌ NUNCA commitar credenciais no código
- ✅ SEMPRE usar variáveis de ambiente
- ✅ Validar `.env` no startup
- ✅ Usar `.env.example` para documentação

### 2. **Autenticação e Autorização**
- ✅ JWT com tempo de expiração adequado
- ✅ Refresh tokens armazenados com segurança
- ✅ Bcrypt rounds >= 10 para senhas
- ✅ Rate limiting em endpoints sensíveis
- ✅ Validar permissões em cada request

### 3. **Banco de Dados**
- ✅ Usar prepared statements (Drizzle ORM já faz)
- ✅ Row-Level Security (RLS) habilitado no Supabase
- ✅ Princípio do menor privilégio para usuários DB
- ✅ Backup automático configurado

### 4. **APIs Externas**
- ✅ Validar e sanitizar inputs
- ✅ Rate limiting em APIs de terceiros
- ✅ Timeout configurado em todas as requests
- ✅ Retry com backoff exponencial

### 5. **Headers HTTP**
- ✅ Helmet.js configurado
- ✅ CORS restrito a domínios específicos
- ✅ CSP (Content Security Policy) implementado

---

## 💻 Boas Práticas de Desenvolvimento

### 1. **Código Limpo**
- ✅ DRY (Don't Repeat Yourself) - evitar duplicação
- ✅ KISS (Keep It Simple, Stupid) - simplicidade primeiro
- ✅ YAGNI (You Aren't Gonna Need It) - não antecipar necessidades
- ✅ Single Responsibility - cada função faz uma coisa
- ✅ Nomes descritivos para variáveis e funções

### 2. **Estrutura de Código**
- ✅ Separação clara de responsabilidades
- ✅ Services para lógica de negócio
- ✅ Middleware para cross-cutting concerns
- ✅ Routes para endpoints HTTP
- ✅ Models/Schema para estrutura de dados

### 3. **Tratamento de Erros**
- ✅ Try-catch em operações assíncronas
- ✅ Logging adequado de erros
- ✅ Mensagens de erro descritivas
- ✅ Não expor detalhes internos ao cliente

### 4. **Performance**
- ✅ Cache para operações custosas
- ✅ Paginação em listagens grandes
- ✅ Índices adequados no banco
- ✅ Lazy loading quando possível
- ✅ Compression de respostas HTTP

### 5. **Manutenibilidade**
- ✅ Código comentado (quando necessário)
- ✅ Documentação de APIs
- ✅ Changelog atualizado
- ✅ Commits descritivos
- ✅ Code review antes de merge

### 6. **Testing**
- ✅ Testes unitários para lógica crítica
- ✅ Testes de integração para fluxos principais
- ✅ Validar edge cases
- ✅ Manter cobertura > 70%

### 7. **Ambiente de Desenvolvimento**
- ✅ `.env.example` sempre atualizado
- ✅ README com instruções claras
- ✅ Scripts de setup automatizados
- ✅ Linting e formatting configurados

---

## 📊 Status de Execução

| # | Task | Status | Tempo |
|---|------|--------|-------|
| 1 | Silenciar Erros Redis | ✅ Concluído | 30min |
| 2 | Remover Credenciais Hardcoded | ✅ Concluído | 20min |
| 3 | Consolidar Sistema de Auth | ✅ Concluído | 2h |
| 4 | Logging Estruturado | ⏰ Produção | 1h |
| 5 | Tratamento de Erros | ✅ Concluído | 45min |
| 6 | Graceful Handling Serviços | ⏰ Produção | 1h |

**Legenda:**
- ⏳ Pendente
- 🔄 Em Progresso
- ✅ Concluído
- ⏰ Produção (pendente para implementação em produção)

---

## 🎯 Próxima Ação

**✅ REFATORAÇÃO FASE 1 CONCLUÍDA!**

**Tasks concluídas:**
- ✅ Task #1: Silenciar Erros Redis
- ✅ Task #2: Remover Credenciais Hardcoded
- ✅ Task #3: Consolidar Sistema de Autenticação
- ✅ Task #5: Tratamento de Erros Consistente

**Tasks pendentes para produção:**
- ⏰ Task #4: Logging Estruturado
- ⏰ Task #6: Graceful Handling de Serviços Externos

---

## 🚀 PRÓXIMO PASSO: CONEXÃO COM BANCO DE DADOS SUPABASE

**Objetivo:** Configurar credenciais corretas do Supabase para ambiente de desenvolvimento/produção

**Ver plano detalhado:** [PLANO-CONEXAO-SUPABASE.md](#)

---

**Última atualização:** 03/10/2025
**Versão:** 2.0

