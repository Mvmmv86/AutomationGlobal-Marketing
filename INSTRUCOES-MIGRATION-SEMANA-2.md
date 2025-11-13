# 🚀 INSTRUÇÕES: RODAR MIGRATION DA SEMANA 2

**Data:** 11/11/2025
**Status:** ✅ Verificado - Tabelas NÃO existem no Supabase

---

## 📊 RESULTADO DA VERIFICAÇÃO

### ❌ **TABELAS DA SEMANA 2: NENHUMA EXISTE**
```
❌ social_accounts
❌ social_posts
❌ social_metrics
❌ social_sync_logs
❌ social_comments
```

### ✅ **TABELAS ANTIGAS: EXISTEM**
```
✅ social_media_accounts
✅ social_media_posts
✅ social_media_campaigns
✅ scheduled_posts
```

**CONCLUSÃO:** Você precisa rodar a migration para criar as tabelas da Semana 2!

---

## 🎯 COMO RODAR A MIGRATION

### **OPÇÃO 1: VIA SUPABASE SQL EDITOR** (RECOMENDADO)

**Passo 1:** Acesse o Supabase SQL Editor
```
https://zqzxaulmzwymkybctnzw.supabase.co
```
1. Faça login
2. No menu lateral, clique em **"SQL Editor"**
3. Clique em **"New query"**

**Passo 2:** Copie e cole o SQL completo
- Abra o arquivo: `server/db/migrations/005_social_integrations.sql`
- Copie TODO o conteúdo (278 linhas)
- Cole no SQL Editor

**Passo 3:** Execute
- Clique no botão **"Run"** (ou Ctrl+Enter)
- Aguarde a execução (leva ~5-10 segundos)

**Passo 4:** Verifique
- Se der sucesso, você verá: "Success. No rows returned"
- Se der erro, me avise qual foi o erro

---

### **OPÇÃO 2: VIA PSQL (Linha de comando)**

Se você tiver o `psql` instalado e a senha correta do banco:

```bash
# Você precisa da senha REAL do banco (não a que você passou antes)
# Consegue no Supabase: Settings → Database → Database Password

psql "postgresql://postgres.zqzxaulmzwymkybctnzw:[SENHA_REAL]@aws-1-us-east-1.pooler.supabase.com:6543/postgres" -f server/db/migrations/005_social_integrations.sql
```

---

## ✅ O QUE A MIGRATION FAZ

### **5 Tabelas criadas:**
1. **social_accounts** - Contas OAuth conectadas (FB, IG, YT)
2. **social_posts** - Posts e agendamentos
3. **social_metrics** - Métricas coletadas (likes, views, etc)
4. **social_sync_logs** - Logs de sincronização
5. **social_comments** - Comentários coletados

### **Recursos adicionados:**
- ✅ 15 índices para performance
- ✅ Row Level Security (RLS) habilitado
- ✅ Triggers para `updated_at`
- ✅ Foreign keys com CASCADE
- ✅ Unique constraints
- ✅ Check constraints para enums
- ✅ Comentários nas tabelas

---

## 🔍 COMO VERIFICAR SE FUNCIONOU

Após rodar a migration, execute este comando:

```bash
node check-supabase-api.js
```

**Resultado esperado:**
```
🎯 TABELAS DA SEMANA 2:
====================================
✅ social_accounts           EXISTE
✅ social_posts              EXISTE
✅ social_metrics            EXISTE
✅ social_sync_logs          EXISTE
✅ social_comments           EXISTE
====================================
```

---

## 🚀 PRÓXIMOS PASSOS (APÓS MIGRATION)

### **Passo 1: Inicializar os Workers** (5 minutos)

Editar `server/index.ts` e adicionar no final, ANTES do `server.listen()`:

```typescript
// Imports no topo do arquivo
import { scheduledPostsWorker } from './services/workers/scheduled-posts-worker.js';
import { metricsSyncWorker } from './services/workers/metrics-sync-worker.js';

// ... resto do código ...

// APÓS criar o server, ANTES do server.listen():
console.log('📱 Inicializando Workers de Social Media...\n');

// Iniciar workers
scheduledPostsWorker.start();
metricsSyncWorker.start();

console.log('✅ Scheduled Posts Worker: Ativo (a cada 5 minutos)');
console.log('✅ Metrics Sync Worker: Ativo (a cada 1 hora)\n');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recebido. Desligando workers...');
  scheduledPostsWorker.stop();
  metricsSyncWorker.stop();
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

// Agora o server.listen() normal
server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
```

---

### **Passo 2: Configurar OAuth** (15 minutos)

**Facebook/Instagram:**
1. Acesse: https://developers.facebook.com
2. Crie app tipo "Business"
3. Adicione produtos: Facebook Login + Instagram Graph API
4. Configure redirect URI: `http://localhost:5000/api/social/auth/facebook/callback`
5. Copie App ID e App Secret
6. Adicione no `.env`:
```env
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
```

**YouTube:**
1. Acesse: https://console.cloud.google.com
2. Crie projeto
3. Habilite APIs: YouTube Data API v3 + YouTube Analytics API
4. Crie credenciais OAuth 2.0
5. Configure redirect URI: `http://localhost:5000/api/social/auth/youtube/callback`
6. Copie Client ID e Client Secret
7. Adicione no `.env`:
```env
YOUTUBE_CLIENT_ID=seu_client_id
YOUTUBE_CLIENT_SECRET=seu_client_secret
```

**Token Encryption:**
```bash
# Gerar chave de criptografia
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Adicionar no .env:
TOKEN_ENCRYPTION_KEY=chave_gerada_aqui
```

---

### **Passo 3: Testar** (10 minutos)

1. **Iniciar servidor:**
```bash
npm run dev
```

2. **Conectar conta Facebook:**
- Abrir no navegador: `http://localhost:5000/api/social/auth/facebook/connect?organizationId=SEU_ORG_ID`
- Autorizar o app
- Verificar se conta foi salva

3. **Criar post agendado:**
```bash
curl -X POST http://localhost:5000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "SEU_ORG_ID",
    "socialAccountId": "ACCOUNT_ID",
    "platform": "facebook",
    "postType": "post",
    "content": "Teste do worker! 🚀",
    "scheduledFor": "2025-11-11T20:00:00Z",
    "createdBy": "SEU_USER_ID"
  }'
```

4. **Aguardar publicação:**
- Worker roda a cada 5 minutos
- Verificar log no console
- Verificar post no Facebook

---

## ❌ POSSÍVEIS ERROS

### **Erro 1: "relation already exists"**
**Causa:** Alguma tabela já existe
**Solução:** A migration tem `CREATE TABLE IF NOT EXISTS`, então vai pular

### **Erro 2: "column does not exist"**
**Causa:** Referência a tabela/coluna que não existe
**Solução:** Verificar se `organizations` e `users` existem

### **Erro 3: "permission denied"**
**Causa:** Sem permissão no banco
**Solução:** Usar service_role_key ou admin do Supabase

---

## 💡 DICAS

1. **Backup:** Faça snapshot no Supabase antes de rodar
2. **Testes:** Teste com dados de teste primeiro
3. **Monitoramento:** Acompanhe logs dos workers
4. **Erros:** Se der erro, me envie o erro completo

---

## 📞 SUPORTE

Se der algum erro ao rodar a migration, me avise e me passe:
1. A mensagem de erro completa
2. Print da tela do SQL Editor
3. Resultado de `node check-supabase-api.js` após tentar

---

**Próxima ação:** RODAR A MIGRATION NO SUPABASE SQL EDITOR! 🚀
