# 🔗 PLANO DE INTEGRAÇÃO FRONTEND-BACKEND COMPLETO

**Data:** 12/11/2025
**Análise:** Frontend React + Backend Express + Supabase

---

## 📊 RESUMO EXECUTIVO

### Status Atual:
- ✅ **Backend:** 100% pronto (Semana 2 completa)
- ✅ **Banco de Dados:** 100% funcional (5 tabelas criadas)
- ✅ **Workers:** 100% ativos (posts agendados + métricas)
- ✅ **OAuth:** 100% configurado (Facebook + Instagram + YouTube)
- ⚠️ **Frontend:** 80% pronto (usa API antiga `/api/social-media/*`)

### Problema Principal:
O **SocialMediaManager** e componentes relacionados usam endpoints **ANTIGOS** (`/api/social-media/*`) que são DIFERENTES dos endpoints da **Semana 2** (`/api/social/*`).

---

## 🎯 O QUE PRECISA SER FEITO

### 1. AUTENTICAÇÃO (✅ JÁ FUNCIONA)

#### Status:
- ✅ Login de clientes funciona (`ClientLogin.tsx` → `POST /api/auth/login`)
- ✅ Login de admin funciona (`AdminLogin.tsx` → `POST /api/admin/auth/login`)
- ✅ Guards de proteção funcionam (`AppGuard` e `AdminGuard`)
- ✅ Refresh token implementado (`useAuth hook`)
- ✅ Multi-tenant funcionando (organizationId no localStorage)

#### Arquivos:
- [client/src/app/pages/ClientLogin.tsx](client/src/app/pages/ClientLogin.tsx)
- [client/src/hooks/use-auth.ts](client/src/hooks/use-auth.ts)
- [client/src/app/components/AppGuard.tsx](client/src/app/components/AppGuard.tsx)

**✅ Nenhuma ação necessária aqui - está funcionando!**

---

### 2. SOCIAL MEDIA (⚠️ PRECISA ATUALIZAÇÃO)

#### Status Atual:
- ⚠️ Componentes usam API antiga (`/api/social-media/*`)
- ⚠️ OAuth flow não está conectado aos novos endpoints
- ⚠️ Headers customizados hardcoded (`x-organization-id: 'test-org'`)
- ✅ UI completa e funcional
- ✅ React Query já implementado

#### Arquivos Afetados:

**Componentes:**
- [client/src/components/SocialMediaManager.tsx](client/src/components/SocialMediaManager.tsx) - ⚠️ PRINCIPAL
- [client/src/components/NewCampaignWizard.tsx](client/src/components/NewCampaignWizard.tsx) - ⚠️
- [client/src/pages/CampaignsDashboard.tsx](client/src/pages/CampaignsDashboard.tsx) - ⚠️

---

## 🔧 PLANO DE AÇÃO DETALHADO

### FASE 1: Atualizar SocialMediaManager (30 min) ⏰

#### Arquivo: `client/src/components/SocialMediaManager.tsx`

#### Mudanças necessárias:

##### 1.1. Atualizar função `loadData()` (linhas 99-161)

**ANTES:**
```typescript
const accountsRes = await fetch('/api/social-media/accounts', {
  headers: {
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  }
});
```

**DEPOIS:**
```typescript
// Pegar organizationId do localStorage (salvo no login)
const organizationId = localStorage.getItem('organizationId');

const accountsRes = await fetch(`/api/social/accounts?organizationId=${organizationId}`);
const accountsData = await accountsRes.json();
setAccounts(accountsData.accounts || []); // API retorna { accounts: [] }
```

##### 1.2. Atualizar função `connectAccount()` (linhas 163-201)

**ANTES:**
```typescript
const response = await fetch('/api/social-media/accounts/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  },
  body: JSON.stringify({
    platform: newAccount.platform,
    accessToken: newAccount.accessToken || null,
    accountData: {
      name: newAccount.accountName,
      username: newAccount.accountHandle
    }
  })
});
```

**DEPOIS - Usar OAuth flow:**
```typescript
const organizationId = localStorage.getItem('organizationId');

// 1. Obter URL de autorização OAuth
const authResponse = await fetch(
  `/api/social/auth/${newAccount.platform}/connect?organizationId=${organizationId}`
);
const { authUrl } = await authResponse.json();

// 2. Redirecionar usuário para autorização
window.location.href = authUrl;

// Nota: Após autorização, callback do backend vai salvar a conta
// e redirecionar de volta para /app/settings?tab=social&success=...
```

##### 1.3. Atualizar função `createPost()` (linhas 203-240)

**ANTES:**
```typescript
const response = await fetch('/api/social-media/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  },
  body: JSON.stringify(newPost)
});
```

**DEPOIS:**
```typescript
const organizationId = localStorage.getItem('organizationId');
const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

// Buscar dados da conta selecionada
const selectedAccount = accounts.find(a => a.id === newPost.accountId);

const response = await fetch('/api/social/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId,
    socialAccountId: newPost.accountId,
    platform: selectedAccount.platform, // facebook, instagram ou youtube
    postType: 'post', // ou 'story', 'video', 'reel'
    content: newPost.content,
    scheduledFor: newPost.scheduledAt || null, // ISO string ou null
    createdBy: userId,
    metadata: {}
  })
});

const { post } = await response.json();
```

##### 1.4. Atualizar função `publishPost()` (linhas 242-270)

**ANTES:**
```typescript
const response = await fetch(`/api/social-media/posts/${postId}/publish`, {
  method: 'POST',
  headers: {
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  }
});
```

**DEPOIS:**
```typescript
const response = await fetch(`/api/social/posts/${postId}/publish`, {
  method: 'POST'
});

const { success } = await response.json();
```

##### 1.5. Remover função `generateSuggestions()` (linhas 272-287)
Esse endpoint (`/api/social-media/suggestions`) não existe na Semana 2. Pode manter, mas comentar ou implementar depois.

##### 1.6. Atualizar carregamento de posts (linha 116-125)

**ANTES:**
```typescript
const postsRes = await fetch('/api/social-media/posts', {
  headers: {
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  }
});
```

**DEPOIS:**
```typescript
const organizationId = localStorage.getItem('organizationId');

const postsRes = await fetch(`/api/social/posts?organizationId=${organizationId}`);
const postsData = await postsRes.json();
setPosts(postsData.posts || []);
```

---

### FASE 2: Adicionar Página de Callback OAuth (15 min) ⏰

#### Criar: `client/src/pages/SocialMediaCallback.tsx`

```typescript
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function SocialMediaCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Pegar parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platform = params.get('platform') || success?.replace('-connected', '');

    if (success) {
      toast({
        title: 'Conta conectada!',
        description: `Sua conta ${platform} foi conectada com sucesso.`
      });

      // Redirecionar para dashboard
      setLocation('/app/dashboard');
    } else if (error) {
      toast({
        title: 'Erro ao conectar',
        description: decodeURIComponent(error),
        variant: 'destructive'
      });

      setLocation('/app/dashboard');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processando autenticação...</p>
      </div>
    </div>
  );
}
```

#### Adicionar rota em `client/src/App.tsx`:

```typescript
<Route path="/app/social/callback" component={SocialMediaCallback} />
```

#### Atualizar Redirect URIs no Facebook/YouTube:

Adicionar nas configurações OAuth:
```
http://localhost:5000/app/social/callback
```

---

### FASE 3: Atualizar Backend para Redirect Correto (5 min) ⏰

#### Arquivo: `server/routes/social/social-auth.ts`

##### Atualizar callbacks (linhas 88-93, 196):

**ANTES:**
```typescript
res.redirect(`/app/settings?tab=social&success=facebook-connected`);
```

**DEPOIS:**
```typescript
res.redirect(`/app/social/callback?success=facebook-connected&platform=facebook`);
```

Aplicar em todos os redirects:
- Facebook callback (linha 88)
- YouTube callback (linha 196)
- Error redirects (linhas 92, 199)

---

### FASE 4: Atualizar NewCampaignWizard (20 min) ⏰

#### Arquivo: `client/src/components/NewCampaignWizard.tsx`

##### 4.1. Atualizar carregamento de contas (linha ~100)

**ANTES:**
```typescript
const response = await fetch('/api/social-media/connected-accounts');
```

**DEPOIS:**
```typescript
const organizationId = localStorage.getItem('organizationId');
const response = await fetch(`/api/social/accounts?organizationId=${organizationId}`);
const data = await response.json();
setAccounts(data.accounts || []);
```

##### 4.2. Atualizar criação de campanha + post

**ANTES:**
```typescript
// Criar campanha
await fetch('/api/social-media/campaigns', {
  method: 'POST',
  body: JSON.stringify(campaignData)
});

// Criar post
await fetch('/api/social-media/posts', {
  method: 'POST',
  body: JSON.stringify(postData)
});
```

**DEPOIS:**
```typescript
const organizationId = localStorage.getItem('organizationId');
const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

// Por enquanto, criar apenas o post (campanhas são do sistema antigo)
const response = await fetch('/api/social/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId,
    socialAccountId: formData.accountId,
    platform: selectedAccount.platform,
    postType: formData.contentType, // 'post', 'video', etc
    content: formData.content,
    mediaUrls: formData.mediaUrl ? [formData.mediaUrl] : [],
    scheduledFor: formData.scheduleDate || null,
    createdBy: userId,
    metadata: {
      objective: formData.objective, // Salvar objetivo como metadata
      campaignName: formData.campaignName
    }
  })
});
```

---

### FASE 5: Atualizar CampaignsDashboard (15 min) ⏰

#### Arquivo: `client/src/pages/CampaignsDashboard.tsx`

##### 5.1. Decisão: Sistema de Campanhas

**Opção A:** Continuar usando sistema antigo de campanhas
- Manter endpoints `/api/social-media/campaigns`
- Esses endpoints são diferentes da Semana 2
- Funciona com Facebook Ads Manager

**Opção B:** Remover campanhas por enquanto
- Focar apenas em posts
- Campanhas podem ser implementadas depois

**Recomendação:** Opção A por enquanto - deixar como está se funciona.

---

## 📋 CHECKLIST DE INTEGRAÇÃO

### Backend (✅ Tudo Pronto):
- [x] Rotas OAuth registradas
- [x] Rotas CRUD registradas
- [x] Workers ativos
- [x] Credenciais OAuth configuradas
- [x] Banco de dados funcional

### Frontend (⏳ Precisa Atualização):
- [ ] **SocialMediaManager** atualizado para usar `/api/social/*`
- [ ] Função `loadData()` atualizada
- [ ] Função `connectAccount()` usa OAuth flow
- [ ] Função `createPost()` atualizada
- [ ] Função `publishPost()` atualizada
- [ ] Headers customizados removidos (`x-organization-id` hardcoded)
- [ ] organizationId vem do localStorage
- [ ] **SocialMediaCallback** página criada
- [ ] Rota `/app/social/callback` adicionada
- [ ] **Backend redirects** atualizados
- [ ] **NewCampaignWizard** atualizado
- [ ] Redirect URIs atualizadas no Facebook/YouTube

### Testes (⏳ Após Integração):
- [ ] Login funciona
- [ ] Conectar conta Facebook via OAuth
- [ ] Criar post agendado
- [ ] Ver post na lista
- [ ] Worker publica post automaticamente
- [ ] Ver métricas do post
- [ ] Conectar conta YouTube via OAuth
- [ ] Criar vídeo agendado

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

### 1. Backend (5 min)
✅ Atualizar redirects OAuth em `server/routes/social/social-auth.ts`

### 2. Frontend - Estrutura (15 min)
✅ Criar `SocialMediaCallback.tsx`
✅ Adicionar rota no `App.tsx`

### 3. Frontend - SocialMediaManager (30 min)
✅ Atualizar todas as funções conforme descrito acima
✅ Testar cada alteração individualmente

### 4. Frontend - NewCampaignWizard (20 min)
✅ Atualizar carregamento de contas
✅ Atualizar criação de posts

### 5. Testes (20 min)
✅ Testar fluxo completo:
  1. Login
  2. Conectar Facebook
  3. Criar post agendado
  4. Ver post publicado automaticamente

**Tempo Total Estimado:** ~1h30min

---

## 💡 DICAS IMPORTANTES

### 1. organizationId
Sempre pegar do localStorage:
```typescript
const organizationId = localStorage.getItem('organizationId');
```
É salvo automaticamente no login (`ClientLogin.tsx` linha 140).

### 2. userId
Pegar do objeto user:
```typescript
const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
```

### 3. Tratamento de Erros
Sempre adicionar try/catch e toast:
```typescript
try {
  // código
} catch (error) {
  toast({
    title: 'Erro',
    description: error.message,
    variant: 'destructive'
  });
}
```

### 4. React Query
Invalidar queries após mutations:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries(['social-accounts']);
  queryClient.invalidateQueries(['social-posts']);
}
```

### 5. Tipos TypeScript
Atualizar interfaces conforme schema do banco:
```typescript
interface SocialAccount {
  id: string;
  organizationId: string;
  platform: 'facebook' | 'instagram' | 'youtube';
  accountId: string;
  accountName: string;
  accountUsername: string | null;
  accountAvatarUrl: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SocialPost {
  id: string;
  organizationId: string;
  socialAccountId: string;
  platform: 'facebook' | 'instagram' | 'youtube';
  postType: 'post' | 'story' | 'video' | 'reel' | 'short' | 'carousel';
  content: string | null;
  mediaUrls: string[];
  hashtags: string[];
  scheduledFor: Date | null;
  publishedAt: Date | null;
  platformPostId: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  errorMessage: string | null;
  retryCount: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📚 REFERÊNCIAS

- **Guia OAuth:** [INTEGRACAO-SOCIAL-MEDIA-FRONTEND-BACKEND.md](INTEGRACAO-SOCIAL-MEDIA-FRONTEND-BACKEND.md)
- **Status Backend:** [STATUS-SEMANA-2-COMPLETO.md](STATUS-SEMANA-2-COMPLETO.md)
- **Schema do Banco:** [shared/schema.ts](shared/schema.ts) (linhas 1363-1579)
- **Rotas Backend:** [server/routes/social/](server/routes/social/)

---

**Última atualização:** 12/11/2025 15:30

**Pronto para começar?** Vamos fazer FASE por FASE! 🚀
