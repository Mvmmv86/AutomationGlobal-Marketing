# 🗺️ MAPEAMENTO COMPLETO DE ROTAS - BACKEND

**Data:** 12/11/2025
**Objetivo:** Identificar duplicações e consolidar API antiga com API nova

---

## 📊 SITUAÇÃO ATUAL

### Sistema ANTIGO (`/api/social-media/*`)
Localização: `server/routes.ts` (linhas 1607-2770)
Status: ⚠️ **CONFLITA COM SEMANA 2**

### Sistema NOVO - Semana 2 (`/api/social/*`)
Localização:
- `server/routes/social/index.ts` (CRUD)
- `server/routes/social/social-auth.ts` (OAuth)
Status: ✅ **IMPLEMENTADO E REGISTRADO**

---

## 🔍 MAPEAMENTO DETALHADO

### CATEGORIA 1: Contas Sociais

#### Sistema ANTIGO:
```
GET  /api/organizations/:id/social-media/accounts          (linha 1610)
POST /api/organizations/:id/social-media/connect           (linha 1631)
POST /api/social-media/accounts/connect                    (linha 2763)
GET  /api/social-media/accounts                            (linha 2764)
```

#### Sistema NOVO (Semana 2):
```
GET    /api/social/accounts?organizationId=xxx
GET    /api/social/accounts/:id
DELETE /api/social/accounts/:id
PATCH  /api/social/accounts/:id/toggle
GET    /api/social/auth/facebook/connect?organizationId=xxx
GET    /api/social/auth/facebook/callback
GET    /api/social/auth/youtube/connect?organizationId=xxx
GET    /api/social/auth/youtube/callback
POST   /api/social/auth/facebook/save-account
POST   /api/social/auth/instagram/save-account
```

**Decisão:** ✅ MANTER APENAS SISTEMA NOVO
**Ação:** Remover rotas antigas de accounts/connect

---

### CATEGORIA 2: Posts

#### Sistema ANTIGO:
```
GET  /api/organizations/:id/social-media/posts             (linha 1659)
POST /api/organizations/:id/social-media/posts             (linha 1687)
POST /api/social-media/posts                               (linha 1739, 2766)
GET  /api/social-media/posts                               (linha 2767)
POST /api/social-media/posts/:postId/publish               (linha 2768)
GET  /api/social-media/scheduled-posts                     (linha 2715)
GET  /api/social-media/recent-posts                        (linha 2491)
```

#### Sistema NOVO (Semana 2):
```
GET    /api/social/posts?organizationId=xxx&status=xxx
GET    /api/social/posts/:id
POST   /api/social/posts
PATCH  /api/social/posts/:id
DELETE /api/social/posts/:id
POST   /api/social/posts/:id/publish
```

**Decisão:** ✅ MANTER APENAS SISTEMA NOVO
**Ação:** Remover rotas antigas de posts

---

### CATEGORIA 3: Analytics/Métricas

#### Sistema ANTIGO:
```
GET /api/social-media/analytics                            (linha 2216)
GET /api/social-media/content-stats                        (linha 2426)
GET /api/organizations/:id/social-media/insights           (linha 2623)
```

#### Sistema NOVO (Semana 2):
```
GET /api/social/metrics/account/:accountId
GET /api/social/metrics/post/:postId
```

**Decisão:** ⚠️ **CONSOLIDAR**
- Analytics gerais: Manter antiga temporariamente
- Métricas específicas: Usar nova

**Ação:** Criar endpoint agregado no sistema novo

---

### CATEGORIA 4: Templates

#### Sistema ANTIGO:
```
GET  /api/organizations/:id/social-media/templates         (linha 1717)
POST /api/organizations/:id/social-media/templates         (linha 2594)
GET  /api/social-media/templates                           (linha 2770)
```

#### Sistema NOVO (Semana 2):
❌ NÃO IMPLEMENTADO

**Decisão:** ✅ MANTER ANTIGA TEMPORARIAMENTE
**Ação:** Implementar templates no sistema novo depois

---

### CATEGORIA 5: IA/Sugestões

#### Sistema ANTIGO:
```
POST /api/social-media/optimize-content                    (linha 1846)
POST /api/social-media/generate-suggestions                (linha 2097)
```

#### Sistema NOVO (Semana 2):
❌ NÃO IMPLEMENTADO

**Decisão:** ✅ MANTER ANTIGA
**Ação:** Funcionalidade específica, não duplica

---

### CATEGORIA 6: Comentários

#### Sistema ANTIGO:
❌ NÃO EXISTE

#### Sistema NOVO (Semana 2):
```
GET /api/social/comments/post/:postId
```

**Decisão:** ✅ MANTER NOVA
**Ação:** Feature exclusiva da Semana 2

---

### CATEGORIA 7: Sincronização

#### Sistema ANTIGO:
❌ NÃO EXISTE

#### Sistema NOVO (Semana 2):
```
POST /api/social/sync/account/:accountId
POST /api/social/sync/organization/:organizationId
GET  /api/social/sync/stats
```

**Decisão:** ✅ MANTER NOVA
**Ação:** Feature exclusiva da Semana 2

---

## 🎯 PLANO DE CONSOLIDAÇÃO

### FASE 1.1: Remover Duplicações (AGORA)

#### Remover do `server/routes.ts`:

1. **Linhas 1610-1657:** Rotas de accounts antigas
```typescript
// REMOVER:
app.get('/api/organizations/:id/social-media/accounts', ...)
app.post('/api/organizations/:id/social-media/connect', ...)
```

2. **Linhas 1659-1715:** Rotas de posts antigas
```typescript
// REMOVER:
app.get('/api/organizations/:id/social-media/posts', ...)
app.post('/api/organizations/:id/social-media/posts', ...)
```

3. **Linhas 1739-1844:** Criação de posts duplicada
```typescript
// REMOVER:
app.post('/api/social-media/posts', async (req: Request, res) => { ... })
```

4. **Linhas 2715-2770:** Rotas do socialMediaService antigas
```typescript
// REMOVER:
app.get('/api/social-media/scheduled-posts', ...)
app.post('/api/social-media/accounts/connect', ...)
app.get('/api/social-media/accounts', ...)
app.post('/api/social-media/posts', ...)
app.get('/api/social-media/posts', ...)
app.post('/api/social-media/posts/:postId/publish', ...)
```

### FASE 1.2: Manter Temporariamente (até implementar no novo)

1. **Templates** (linhas 1717-1758, 2594-2622, 2770)
2. **Analytics Gerais** (linhas 2216-2425, 2426-2490)
3. **Recent Posts** (linha 2491-2593)
4. **Insights** (linhas 2623-2713)
5. **IA/Sugestões** (linhas 1846-2095, 2097-2215)

### FASE 1.3: Adicionar ao Sistema Novo

Criar em `server/routes/social/index.ts`:

```typescript
// Analytics agregado
GET /api/social/analytics?organizationId=xxx

// Templates
GET  /api/social/templates?organizationId=xxx
POST /api/social/templates

// Sugestões IA
POST /api/social/suggestions
```

---

## 📝 ORDEM DE EXECUÇÃO

### 1. Atualizar redirects OAuth (5 min) ✅
Arquivo: `server/routes/social/social-auth.ts`

### 2. Remover rotas duplicadas (10 min) ✅
Arquivo: `server/routes.ts`
- Remover accounts antigas
- Remover posts antigas
- Manter apenas templates, analytics e IA por enquanto

### 3. Adicionar rotas faltantes ao sistema novo (15 min) ✅
Arquivo: `server/routes/social/index.ts`
- Analytics agregado
- Templates básico

---

## ✅ RESULTADO ESPERADO

Após consolidação:

### Endpoints Ativos:

**NOVO (Semana 2):**
- `/api/social/auth/*` - OAuth flows
- `/api/social/accounts` - CRUD de contas
- `/api/social/posts` - CRUD de posts
- `/api/social/metrics/*` - Métricas
- `/api/social/comments/*` - Comentários
- `/api/social/sync/*` - Sincronização
- `/api/social/analytics` - Analytics agregado ⭐ NOVO
- `/api/social/templates` - Templates ⭐ NOVO

**ANTIGO (temporário):**
- `/api/social-media/optimize-content` - Otimização IA
- `/api/social-media/generate-suggestions` - Sugestões IA

**REMOVIDO:**
- ~~`/api/social-media/accounts`~~ → Migrado
- ~~`/api/social-media/posts`~~ → Migrado
- ~~`/api/organizations/:id/social-media/*`~~ → Migrado

---

**Status:** Pronto para começar consolidação! 🚀
