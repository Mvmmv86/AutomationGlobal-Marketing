# 🔗 INTEGRAÇÃO FRONTEND-BACKEND: SOCIAL MEDIA

**Data:** 12/11/2025
**Status:** Rotas registradas ✅ | OAuth precisa de credenciais ⏳

---

## ✅ O QUE FOI FEITO AGORA

### 1. **Rotas Registradas no Servidor**
Adicionei as rotas da Semana 2 em [server/routes.ts](server/routes.ts#L3275-L3283):

```typescript
// Social Media Auth routes (OAuth)
app.use('/api/social/auth', socialAuthRoutes);

// Social Media CRUD routes (contas, posts, métricas)
app.use('/api/social', socialRoutes);
```

**Endpoints disponíveis agora:**
- `/api/social/auth/facebook/connect` - Conectar Facebook
- `/api/social/auth/facebook/callback` - Callback OAuth Facebook
- `/api/social/auth/youtube/connect` - Conectar YouTube
- `/api/social/auth/youtube/callback` - Callback OAuth YouTube
- `/api/social/accounts` - CRUD de contas
- `/api/social/posts` - CRUD de posts
- `/api/social/metrics/*` - Métricas
- `/api/social/comments/*` - Comentários
- `/api/social/sync/*` - Sincronização

---

## 📊 ARQUITETURA ATUAL

### Backend (100% Implementado)

#### Serviços:
- [server/services/social/facebook-service.ts](server/services/social/facebook-service.ts) - ✅ Facebook Graph API
- [server/services/social/instagram-service.ts](server/services/social/instagram-service.ts) - ✅ Instagram Graph API
- [server/services/social/youtube-service.ts](server/services/social/youtube-service.ts) - ✅ YouTube Data API v3
- [server/services/social/oauth-service.ts](server/services/social/oauth-service.ts) - ✅ OAuth manager
- [server/services/social/token-encryption.ts](server/services/social/token-encryption.ts) - ✅ AES-256-GCM

#### Workers:
- [server/services/workers/scheduled-posts-worker.ts](server/services/workers/scheduled-posts-worker.ts) - ✅ Publicação automática (5min)
- [server/services/workers/metrics-sync-worker.ts](server/services/workers/metrics-sync-worker.ts) - ✅ Sincronização (1h)

#### Rotas:
- [server/routes/social/social-auth.ts](server/routes/social/social-auth.ts) - ✅ OAuth flows
- [server/routes/social/index.ts](server/routes/social/index.ts) - ✅ CRUD completo

#### Banco de Dados:
- ✅ 5 tabelas criadas e testadas
- ✅ RLS habilitado
- ✅ Índices para performance

### Frontend (Componente existe, precisa integração)

#### Componente Existente:
- [client/src/components/SocialMediaManager.tsx](client/src/components/SocialMediaManager.tsx) - ⚠️ Usa API antiga

**Problema:** O componente atual usa endpoints antigos (`/api/social-media/*`) que são diferentes dos novos da Semana 2 (`/api/social/*`).

---

## 🔧 O QUE PRECISA SER FEITO

### Opção 1: Atualizar SocialMediaManager.tsx (15 min)

Atualizar o componente existente para usar as novas rotas:

#### Mudanças necessárias:

**1. Endpoints API (linha 104-149)**
```typescript
// ANTES (API antiga):
const response = await fetch('/api/social-media/accounts', {
  headers: {
    'x-organization-id': 'test-org',
    'x-user-id': 'test-user'
  }
});

// DEPOIS (API nova - Semana 2):
const response = await fetch(`/api/social/accounts?organizationId=${orgId}`, {
  method: 'GET'
});
```

**2. Conectar conta (linha 163-201)**
```typescript
// ANTES:
await fetch('/api/social-media/accounts/connect', {
  method: 'POST',
  body: JSON.stringify({
    platform: newAccount.platform,
    accessToken: newAccount.accessToken,
    accountData: {...}
  })
});

// DEPOIS - Usar OAuth flow:
// 1. Redirecionar para OAuth
const { authUrl } = await fetch(
  `/api/social/auth/${platform}/connect?organizationId=${orgId}`
).then(r => r.json());

window.location.href = authUrl;

// 2. Após callback, salvar conta
await fetch(`/api/social/auth/${platform}/save-account`, {
  method: 'POST',
  body: JSON.stringify({
    organizationId,
    ...accountData
  })
});
```

**3. Criar post (linha 203-240)**
```typescript
// ANTES:
await fetch('/api/social-media/posts', {
  method: 'POST',
  body: JSON.stringify({
    title: newPost.title,
    content: newPost.content,
    accountId: newPost.accountId,
    publishMode: newPost.publishMode,
    scheduledAt: newPost.scheduledAt
  })
});

// DEPOIS:
await fetch('/api/social/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId,
    socialAccountId: newPost.accountId,
    platform: 'facebook', // ou instagram/youtube
    postType: 'post',
    content: newPost.content,
    scheduledFor: newPost.scheduledAt, // ISO string ou null
    createdBy: userId
  })
});
```

**4. Publicar post (linha 242-270)**
```typescript
// ANTES:
await fetch(`/api/social-media/posts/${postId}/publish`, {
  method: 'POST'
});

// DEPOIS:
await fetch(`/api/social/posts/${postId}/publish`, {
  method: 'POST'
});
```

---

### Opção 2: Criar Nova Página (30 min)

Criar uma página dedicada seguindo o padrão do projeto:

**1. Criar arquivo:** `client/src/pages/SocialMediaDashboard.tsx`

**2. Seguir design system existente:**
- Usar componentes do shadcn/ui: `Card`, `Button`, `Tabs`, `Badge`, etc.
- Seguir padrão de `MarketingDashboardComplete.tsx`
- Usar `glass-3d` class para cards (visual consistente)
- Usar gradientes para títulos: `bg-gradient-to-r from-purple-600 to-blue-600`

**3. Estrutura:**
```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ... mais imports

export default function SocialMediaDashboard() {
  const { toast } = useToast();

  // Buscar contas conectadas
  const { data: accounts } = useQuery({
    queryKey: ['social-accounts', organizationId],
    queryFn: () => fetch(`/api/social/accounts?organizationId=${organizationId}`)
      .then(r => r.json())
      .then(d => d.accounts)
  });

  // Buscar posts
  const { data: posts } = useQuery({
    queryKey: ['social-posts', organizationId],
    queryFn: () => fetch(`/api/social/posts?organizationId=${organizationId}`)
      .then(r => r.json())
      .then(d => d.posts)
  });

  // Conectar conta (via OAuth)
  const connectAccount = (platform: 'facebook' | 'instagram' | 'youtube') => {
    fetch(`/api/social/auth/${platform}/connect?organizationId=${organizationId}`)
      .then(r => r.json())
      .then(({ authUrl }) => {
        window.location.href = authUrl;
      });
  };

  // Criar post
  const createPostMutation = useMutation({
    mutationFn: (postData) =>
      fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: 'Post criado com sucesso!' });
      queryClient.invalidateQueries(['social-posts']);
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Social Media Manager
        </h1>
        <p className="text-gray-600">Gerencie suas redes sociais</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {/* Posts list and create form */}
        </TabsContent>

        <TabsContent value="accounts">
          {/* Connected accounts */}
          {accounts?.map(account => (
            <Card key={account.id} className="glass-3d">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{account.accountName}</h4>
                    <p className="text-sm text-gray-600">@{account.accountUsername}</p>
                  </div>
                  <Badge variant={account.isActive ? 'default' : 'secondary'}>
                    {account.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botões para conectar */}
          <div className="flex gap-3">
            <Button onClick={() => connectAccount('facebook')}>
              Conectar Facebook
            </Button>
            <Button onClick={() => connectAccount('youtube')}>
              Conectar YouTube
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {/* Métricas e gráficos */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## ⚠️ ATENÇÃO: CREDENCIAIS OAUTH NECESSÁRIAS

Para os OAuth flows funcionarem, você precisa configurar no `.env`:

### Facebook/Instagram

1. Criar app em: https://developers.facebook.com
2. Adicionar no `.env`:
```env
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
```

### YouTube

1. Criar projeto em: https://console.cloud.google.com
2. Habilitar YouTube Data API v3
3. Adicionar no `.env`:
```env
YOUTUBE_CLIENT_ID=seu_client_id
YOUTUBE_CLIENT_SECRET=seu_client_secret
```

**Sem essas credenciais, os OAuth flows vão falhar!**

---

## 🎯 FLUXO COMPLETO DE OAUTH

### Facebook (exemplo):

1. **Frontend:** Usuário clica em "Conectar Facebook"
   ```typescript
   const { authUrl } = await fetch(
     `/api/social/auth/facebook/connect?organizationId=${orgId}`
   ).then(r => r.json());

   window.location.href = authUrl; // Redireciona para Facebook
   ```

2. **Facebook:** Usuário autoriza o app

3. **Backend:** Recebe callback com `code`
   ```typescript
   // GET /api/social/auth/facebook/callback?code=ABC123&state=...
   ```

4. **Backend:** Troca `code` por token, busca páginas, salva no banco

5. **Backend:** Redireciona para frontend
   ```
   /app/settings?tab=social&success=facebook-connected
   ```

6. **Frontend:** Mostra mensagem de sucesso, recarrega lista de contas

---

## 📋 CHECKLIST PARA USAR

### Backend (100% ✅)
- [x] Migration rodada
- [x] Tabelas criadas
- [x] Serviços implementados
- [x] Workers ativos
- [x] Rotas registradas
- [ ] Credenciais OAuth configuradas ← **PRECISA**

### Frontend (50% ⏳)
- [x] Componente existe (`SocialMediaManager.tsx`)
- [ ] Atualizar para usar novas rotas ← **OPÇÃO 1**
- [ ] OU criar nova página ← **OPÇÃO 2**
- [ ] Adicionar tratamento de OAuth callback
- [ ] Adicionar gerenciamento de estado (React Query)
- [ ] Adicionar loading states
- [ ] Adicionar error handling

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Configure credenciais OAuth** (15 min) - Facebook + YouTube
2. **Atualize SocialMediaManager.tsx** (15 min) - Usar novas APIs
3. **Teste OAuth flow** (10 min) - Conectar uma conta
4. **Teste criação de post** (5 min) - Criar e agendar
5. **Teste publicação automática** (5 min) - Aguardar worker publicar

**Tempo total:** ~50 minutos para ter tudo funcionando!

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **API Reference:** [server/routes/social/index.ts](server/routes/social/index.ts)
- **OAuth Flows:** [server/routes/social/social-auth.ts](server/routes/social/social-auth.ts)
- **Workers:** [server/services/workers/](server/services/workers/)
- **Design System:** Veja [client/src/pages/MarketingDashboardComplete.tsx](client/src/pages/MarketingDashboardComplete.tsx) como exemplo

---

**Status:** Backend 100% pronto | Frontend precisa integração com novas APIs

**Decisão:** Escolha Opção 1 (atualizar) ou Opção 2 (criar nova página)
