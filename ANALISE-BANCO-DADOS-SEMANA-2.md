# 🔍 ANÁLISE DO BANCO DE DADOS - SEMANA 2

**Data:** 11/11/2025
**Objetivo:** Verificar o que existe no Supabase vs o que a Semana 2 precisa

---

## 📊 RESUMO EXECUTIVO

### ✅ **BOA NOTÍCIA: As tabelas da Semana 2 JÁ EXISTEM no schema!**

Encontrei **DUAS IMPLEMENTAÇÕES** de tabelas sociais no `shared/schema.ts`:

1. **Sistema ANTIGO** (linhas 400-530): `socialMediaAccounts`, `socialMediaPosts`, etc.
2. **Sistema NOVO - SEMANA 2** (linhas 1363-1579): `socialAccounts`, `socialPosts`, etc.

---

## 🆚 COMPARAÇÃO: SISTEMA ANTIGO vs SISTEMA NOVO

### **SISTEMA ANTIGO (Já existe no Supabase)**
**Tabelas antigas:**
```typescript
✅ socialMediaAccounts     (linha 400)
✅ socialMediaCampaigns    (linha 418)
✅ socialMediaPosts        (linha 440)
✅ socialMediaPostPlatforms (linha 463)
✅ socialMediaTemplates    (linha 477)
✅ socialMediaAnalytics    (linha 493)
✅ socialMediaContentLibrary (linha 512)
✅ socialMediaInsights     (linha 665)
✅ connectedAccounts       (linha 800) - Facebook/Instagram OAuth
✅ scheduledPosts          (linha 928)
```

**Características:**
- Sistema mais genérico
- Tem campanhas do Facebook Ads
- Tem biblioteca de conteúdo
- **MAS:** Não tem estrutura específica para:
  - Métricas detalhadas por post
  - Logs de sincronização
  - Comentários coletados

---

### **SISTEMA NOVO - SEMANA 2 (Definido no schema, mas precisa confirmar se existe no Supabase)**
**Tabelas novas (linhas 1363-1579):**
```typescript
🆕 socialAccounts         (linha 1375) - SIMPLIFICADO
🆕 socialPosts            (linha 1407) - COM AGENDAMENTO
🆕 socialMetrics          (linha 1441) - COLETA DE MÉTRICAS
🆕 socialSyncLogs         (linha 1462) - LOGS DE SYNC
🆕 socialComments         (linha 1487) - COMENTÁRIOS
```

**Enums novos:**
```typescript
🆕 socialPlatformEnum        (linha 1368) - 'facebook', 'instagram', 'youtube'
🆕 socialPostStatusEnum      (linha 1369) - 'draft', 'scheduled', 'publishing', 'published', 'failed'
🆕 socialPostTypeEnum        (linha 1370) - 'post', 'story', 'video', 'reel', 'short', 'carousel'
🆕 socialSyncTypeEnum        (linha 1371) - 'posts', 'metrics', 'account', 'comments', 'followers'
🆕 socialSyncStatusEnum      (linha 1372) - 'success', 'failed', 'partial'
```

**Características:**
- Sistema específico para Semana 2
- Focado em **coleta de dados**
- Estrutura otimizada para workers
- Separação clara entre contas, posts, métricas, logs

---

## 🎯 O QUE PRECISAMOS VERIFICAR NO SUPABASE

### **CENÁRIO 1: Só sistema ANTIGO existe no Supabase**
**Problema:** Não temos as tabelas específicas da Semana 2
**Solução:** Rodar a migration `005_social_integrations.sql`

### **CENÁRIO 2: Ambos os sistemas existem no Supabase**
**Problema:** Temos duplicação de tabelas com propósitos similares
**Solução:** Decidir qual usar ou fazer migração de dados

### **CENÁRIO 3: Só sistema NOVO existe no Supabase**
**Melhor caso:** Está tudo pronto! Só precisamos inicializar os workers

---

## 🔍 VERIFICAÇÃO NECESSÁRIA

### **Passo 1: Verificar quais tabelas existem no Supabase**

Você precisa fazer uma consulta no Supabase para ver quais tabelas existem:

```sql
-- Listar TODAS as tabelas do schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%social%'
ORDER BY table_name;
```

**O que vamos procurar:**
```sql
-- Sistema ANTIGO
social_media_accounts
social_media_posts
social_media_campaigns
social_media_analytics
social_media_insights
connected_accounts
scheduled_posts

-- Sistema NOVO (Semana 2)
social_accounts         ← PRECISA EXISTIR
social_posts            ← PRECISA EXISTIR
social_metrics          ← PRECISA EXISTIR
social_sync_logs        ← PRECISA EXISTIR
social_comments         ← PRECISA EXISTIR
```

---

## 📋 ANÁLISE DETALHADA DAS TABELAS DA SEMANA 2

### **TABELA 1: social_accounts** (Contas OAuth)

**Schema definido em:** `shared/schema.ts` linha 1375

**Campos:**
```typescript
id                  UUID PRIMARY KEY
organization_id     UUID (FK → organizations)
platform            ENUM ('facebook', 'instagram', 'youtube')
account_id          VARCHAR(255) - ID na rede social
account_name        VARCHAR(255)
account_username    VARCHAR(255)
account_avatar_url  TEXT
access_token        TEXT - CRIPTOGRAFADO
refresh_token       TEXT - CRIPTOGRAFADO
token_expires_at    TIMESTAMP
is_active           BOOLEAN
last_sync_at        TIMESTAMP
metadata            JSONB
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Constraint único:**
- `UNIQUE(organization_id, platform, account_id)` - Não permite duplicar mesma conta

**Migration SQL:** Existe em `server/db/migrations/005_social_integrations.sql` linhas 8-37

---

### **TABELA 2: social_posts** (Posts e Agendamentos)

**Schema definido em:** `shared/schema.ts` linha 1407

**Campos:**
```typescript
id                  UUID PRIMARY KEY
organization_id     UUID (FK → organizations)
social_account_id   UUID (FK → social_accounts)
platform            ENUM ('facebook', 'instagram', 'youtube')
post_type           ENUM ('post', 'story', 'video', 'reel', 'short', 'carousel')
content             TEXT
media_urls          JSONB (array de URLs)
hashtags            JSONB (array)
scheduled_for       TIMESTAMP - NULL = publicar agora
published_at        TIMESTAMP
platform_post_id    VARCHAR(255) - ID após publicar
status              ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed')
error_message       TEXT
retry_count         INTEGER
metadata            JSONB
created_by          UUID (FK → users)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Migration SQL:** Existe em `server/db/migrations/005_social_integrations.sql` linhas 42-80

**Usado pelos workers:**
- `scheduled-posts-worker.ts` → Busca posts onde `scheduled_for <= NOW()` e `status = 'scheduled'`

---

### **TABELA 3: social_metrics** (Métricas Coletadas)

**Schema definido em:** `shared/schema.ts` linha 1441

**Campos:**
```typescript
id                  UUID PRIMARY KEY
organization_id     UUID (FK → organizations)
social_account_id   UUID (FK → social_accounts)
social_post_id      UUID (FK → social_posts) - NULL para métricas da conta
platform            ENUM
metric_type         VARCHAR(100) - 'likes', 'comments', 'views', 'reach', 'impressions'
value               DECIMAL(15,2)
collected_at        TIMESTAMP
metadata            JSONB - breakdown por idade, gênero, localização
created_at          TIMESTAMP
```

**Migration SQL:** Existe em `server/db/migrations/005_social_integrations.sql` linhas 82-100

**Usado pelos workers:**
- `metrics-sync-worker.ts` → Coleta métricas e insere nesta tabela

---

### **TABELA 4: social_sync_logs** (Logs de Sincronização)

**Schema definido em:** `shared/schema.ts` linha 1462

**Campos:**
```typescript
id                  UUID PRIMARY KEY
organization_id     UUID (FK → organizations)
social_account_id   UUID (FK → social_accounts)
sync_type           ENUM ('posts', 'metrics', 'account', 'comments', 'followers')
status              ENUM ('success', 'failed', 'partial')
items_processed     INTEGER
errors              JSONB (array de erros)
started_at          TIMESTAMP
completed_at        TIMESTAMP
duration_ms         INTEGER
metadata            JSONB
created_at          TIMESTAMP
```

**Migration SQL:** Existe em `server/db/migrations/005_social_integrations.sql` linhas 102-119

**Usado pelos workers:**
- `metrics-sync-worker.ts` → Cria log para cada operação de sync

---

### **TABELA 5: social_comments** (Comentários Coletados)

**Schema definido em:** `shared/schema.ts` linha 1487

**Campos:**
```typescript
id                  UUID PRIMARY KEY
organization_id     UUID (FK → organizations)
social_post_id      UUID (FK → social_posts)
platform            ENUM
platform_comment_id VARCHAR(255)
parent_comment_id   UUID - Para respostas (self-reference)
author_id           VARCHAR(255)
author_name         VARCHAR(255)
author_username     VARCHAR(255)
author_avatar_url   TEXT
content             TEXT
likes_count         INTEGER
replied_by_us       BOOLEAN
is_hidden           BOOLEAN
published_at        TIMESTAMP
collected_at        TIMESTAMP
created_at          TIMESTAMP
```

**Migration SQL:** Existe em `server/db/migrations/005_social_integrations.sql` linhas 121-144

**Usado pelos services:**
- `facebook-service.ts` → `collectComments()`
- `instagram-service.ts` → `collectComments()`
- `youtube-service.ts` → `collectComments()`

---

## 📍 MIGRATION SQL ENCONTRADA

**Arquivo:** `server/db/migrations/005_social_integrations.sql`

**Conteúdo:**
- ✅ Cria as 5 tabelas da Semana 2
- ✅ Cria os 5 ENUMs necessários
- ✅ Define todas as constraints (FK, UNIQUE, CHECK)
- ✅ Cria 15 índices para performance
- ✅ Cria triggers para `updated_at`
- ✅ Configura Row Level Security (RLS)

**Status:** ✅ Migration está completa e pronta para rodar

---

## 🚨 PROBLEMA: DUPLICAÇÃO DE CONCEITOS

### **Tabelas que se sobrepõem:**

| Conceito | Sistema ANTIGO | Sistema NOVO (Semana 2) |
|----------|----------------|-------------------------|
| Contas conectadas | `socialMediaAccounts` | `socialAccounts` |
| Posts | `socialMediaPosts` | `socialPosts` |
| Métricas | `socialMediaAnalytics` | `socialMetrics` |
| Agendamento | `scheduledPosts` (genérico) | `socialPosts.scheduled_for` |

### **Diferenças importantes:**

**Sistema ANTIGO:**
- Mais complexo (tem campaigns, templates, content library)
- Focado em publicação e gestão
- Menos estruturado para coleta de dados

**Sistema NOVO (Semana 2):**
- Mais simples e focado
- Otimizado para workers automáticos
- Estrutura específica para coleta de métricas
- Logs detalhados de sincronização
- Comentários com hierarquia (parent_comment_id)

---

## ✅ DECISÃO E RECOMENDAÇÃO

### **O QUE FAZER:**

#### **Opção A: Usar APENAS Sistema NOVO (RECOMENDADO)** 🎯

**Vantagens:**
- Sistema limpo e focado
- Otimizado para Semana 2
- Workers já implementados para este schema
- Menos complexidade

**Passos:**
1. Verificar se `social_accounts`, `social_posts`, etc. já existem no Supabase
2. **SE NÃO EXISTIREM:** Rodar migration `005_social_integrations.sql`
3. **SE EXISTIREM:** Pular para inicializar workers

**Como rodar a migration:**
```bash
# Via psql
psql $DATABASE_URL -f server/db/migrations/005_social_integrations.sql

# Ou via Supabase SQL Editor
# Copiar e colar o conteúdo da migration no SQL Editor
```

---

#### **Opção B: Migrar dados do Sistema ANTIGO para o NOVO**

**Quando usar:** Se você JÁ TEM DADOS nas tabelas antigas

**Passos:**
1. Rodar migration do Sistema NOVO
2. Criar script de migração de dados:
   ```sql
   -- Migrar contas
   INSERT INTO social_accounts (
     organization_id, platform, account_id, account_name,
     access_token, is_active, metadata
   )
   SELECT
     organization_id,
     platform,
     account_id,
     account_name,
     access_token,
     is_active,
     account_data as metadata
   FROM socialMediaAccounts;

   -- Migrar posts
   INSERT INTO social_posts (
     organization_id, social_account_id, platform,
     post_type, content, media_urls, status
   )
   SELECT
     organization_id,
     -- Precisaria mapear account IDs aqui
     platform,
     media_type as post_type,
     content,
     media_urls,
     status
   FROM socialMediaPosts;
   ```

---

#### **Opção C: Manter ambos os sistemas (NÃO RECOMENDADO)**

**Problemas:**
- Confusão sobre qual usar
- Duplicação de código
- Manutenção mais difícil

---

## 🎯 RECOMENDAÇÃO FINAL

### **AÇÃO IMEDIATA: Verificar o Supabase primeiro!**

**Execute esta query no Supabase SQL Editor:**
```sql
-- Ver TODAS as tabelas sociais
SELECT
  table_name,
  (SELECT count(*)
   FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%social%'
ORDER BY table_name;
```

**Resultados possíveis:**

### **RESULTADO 1: Só tabelas antigas existem**
```
social_media_accounts
social_media_posts
social_media_campaigns
connected_accounts
scheduled_posts
```
**AÇÃO:** Rodar migration `005_social_integrations.sql`

---

### **RESULTADO 2: Tabelas novas já existem!**
```
social_accounts        ✅
social_posts           ✅
social_metrics         ✅
social_sync_logs       ✅
social_comments        ✅
```
**AÇÃO:** **NADA!** Pular direto para inicializar workers!

---

### **RESULTADO 3: Ambas existem**
```
social_media_accounts  (antiga)
social_accounts        (nova) ✅
social_media_posts     (antiga)
social_posts           (nova) ✅
...
```
**AÇÃO:** Decidir qual usar ou migrar dados

---

## 📝 CHECKLIST DE VERIFICAÇÃO

### **ANTES de rodar migration:**
- [ ] Fazer backup do banco (snapshot no Supabase)
- [ ] Verificar quais tabelas já existem
- [ ] Ver se há dados nas tabelas antigas
- [ ] Decidir estratégia (nova, migrar, ou manter ambas)

### **PARA rodar migration:**
- [ ] Acessar Supabase SQL Editor
- [ ] Copiar conteúdo de `005_social_integrations.sql`
- [ ] Executar SQL
- [ ] Verificar se tabelas foram criadas
- [ ] Verificar se índices foram criados
- [ ] Verificar se RLS foi habilitado

### **APÓS rodar migration:**
- [ ] Testar inserção de dados
- [ ] Verificar constraints funcionando
- [ ] Testar foreign keys

---

## 🔧 INICIALIZAÇÃO DOS WORKERS

**INDEPENDENTE** de qual sistema usar, os workers precisam ser inicializados.

**Arquivo:** `server/index.ts`

**Código a adicionar:**
```typescript
// Imports
import { scheduledPostsWorker } from './services/workers/scheduled-posts-worker';
import { metricsSyncWorker } from './services/workers/metrics-sync-worker';

// Após iniciar servidor
console.log('🚀 Server started on port', PORT);

console.log('\n📱 Starting Social Media Workers...');
scheduledPostsWorker.start();
metricsSyncWorker.start();
console.log('✅ Scheduled Posts Worker: Running (every 5 minutes)');
console.log('✅ Metrics Sync Worker: Running (every 1 hour)');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  scheduledPostsWorker.stop();
  metricsSyncWorker.stop();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
```

**IMPORTANTE:** Os workers esperam o schema NOVO (Semana 2):
- `socialAccounts`
- `socialPosts`
- `socialMetrics`
- `socialSyncLogs`

Se o Supabase só tiver tabelas antigas, os workers **NÃO VÃO FUNCIONAR** até rodar a migration.

---

## 📊 RESUMO FINAL

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Schema definido no código | ✅ SIM | Nenhuma |
| Migration SQL existe | ✅ SIM | Nenhuma |
| Tabelas no Supabase | ❓ VERIFICAR | Query SQL |
| Workers criados | ✅ SIM | Inicializar no server |
| Services criados | ✅ SIM | Nenhuma |
| Routes criadas | ✅ SIM | Nenhuma |

**Próximo passo:** **VOCÊ** precisa executar a query SQL no Supabase e me dizer o resultado!

---

**Criado em:** 11/11/2025
**Status:** ⏳ Aguardando verificação do Supabase
