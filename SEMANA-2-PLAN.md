# 📱 SEMANA 2 - INTEGRAÇÕES SOCIAIS COMPLETAS

**Data de Início:** 07/11/2025
**Duração:** 25-30 horas
**Status:** 🚀 EM ANDAMENTO

---

## 🎯 OBJETIVO PRINCIPAL

Implementar **integrações completas** com Facebook, Instagram e YouTube para:
1. ✅ **Publicar conteúdo** (posts, stories, vídeos)
2. ✅ **Coletar dados e métricas** (engajamento, alcance, comentários, etc.)
3. ✅ **Sincronização automática** de dados
4. ✅ **Agendamento** de publicações

---

## 📊 DADOS QUE VAMOS COLETAR

### **Facebook:**
- Métricas de posts (likes, comments, shares, reach, impressions)
- Dados da página (followers, engagement rate)
- Comentários e respostas
- Insights de audiência (demografia, localização)
- Horários de maior engajamento

### **Instagram:**
- Métricas de posts (likes, comments, saves, reach, impressions)
- Métricas de stories (views, replies, exits)
- Dados da conta (followers, following, engagement rate)
- Hashtags performance
- Insights de audiência

### **YouTube:**
- Métricas de vídeos (views, likes, dislikes, comments, shares)
- Dados do canal (subscribers, total views)
- Retention rate (quanto tempo as pessoas assistem)
- Traffic sources (de onde vem as visualizações)
- Demografia da audiência

---

## 🗄️ ESTRUTURA DE DADOS

### **Tabelas Necessárias:**

```typescript
// 1. social_accounts - Contas conectadas
{
  id: string
  organizationId: string
  platform: 'facebook' | 'instagram' | 'youtube'
  accountId: string (ID da conta na rede)
  accountName: string
  accessToken: string (criptografado)
  refreshToken: string (criptografado)
  tokenExpiresAt: timestamp
  isActive: boolean
  metadata: json (dados extras da conta)
  createdAt: timestamp
  updatedAt: timestamp
}

// 2. social_posts - Posts publicados/agendados
{
  id: string
  organizationId: string
  socialAccountId: string
  platform: 'facebook' | 'instagram' | 'youtube'
  postType: 'post' | 'story' | 'video' | 'reel'
  content: text
  mediaUrls: json (array de URLs)
  scheduledFor: timestamp (null se já publicado)
  publishedAt: timestamp
  platformPostId: string (ID na rede social)
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  metadata: json
  createdAt: timestamp
  updatedAt: timestamp
}

// 3. social_metrics - Métricas coletadas
{
  id: string
  organizationId: string
  socialAccountId: string
  socialPostId: string (nullable para métricas gerais)
  platform: 'facebook' | 'instagram' | 'youtube'
  metricType: string (likes, comments, views, etc.)
  value: number
  collectedAt: timestamp
  metadata: json
  createdAt: timestamp
}

// 4. social_sync_logs - Logs de sincronização
{
  id: string
  organizationId: string
  socialAccountId: string
  syncType: 'posts' | 'metrics' | 'account'
  status: 'success' | 'failed' | 'partial'
  itemsProcessed: number
  errors: json
  startedAt: timestamp
  completedAt: timestamp
}
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
server/
├── services/
│   ├── social/
│   │   ├── facebook-service.ts          # Facebook Graph API
│   │   ├── instagram-service.ts         # Instagram Graph API
│   │   ├── youtube-service.ts           # YouTube Data API
│   │   ├── social-auth-service.ts       # OAuth flows
│   │   └── social-metrics-service.ts    # Coleta de métricas
│   └── workers/
│       ├── scheduled-posts-worker.ts    # Processar posts agendados
│       └── metrics-sync-worker.ts       # Sincronizar métricas
├── routes/
│   └── social/
│       ├── facebook.ts                  # Rotas Facebook
│       ├── instagram.ts                 # Rotas Instagram
│       ├── youtube.ts                   # Rotas YouTube
│       └── social-auth.ts               # OAuth callbacks
└── db/
    └── migrations/
        └── 005_social_integrations.sql  # Tabelas sociais

client/src/
├── pages/
│   └── SocialAccountsManager.tsx        # Gerenciar contas sociais
├── components/
│   └── social/
│       ├── FacebookConnect.tsx
│       ├── InstagramConnect.tsx
│       ├── YoutubeConnect.tsx
│       ├── SocialMetricsCard.tsx
│       └── PostScheduler.tsx
└── lib/
    └── api/
        └── social-api.ts                # API client
```

---

## 🔧 IMPLEMENTAÇÃO DETALHADA

### **FASE 1: DATABASE SCHEMA (2h)**

#### **Task 1.1: Criar Migration**
```sql
-- 005_social_integrations.sql

-- Tabela de contas sociais conectadas
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube')),
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_username VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, platform, account_id)
);

-- Tabela de posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('post', 'story', 'video', 'reel', 'short')),
  content TEXT,
  media_urls JSONB DEFAULT '[]',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  platform_post_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas
CREATE TABLE social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  social_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de sincronização
CREATE TABLE social_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('posts', 'metrics', 'account', 'comments')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  items_processed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX idx_social_accounts_org ON social_accounts(organization_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_posts_org ON social_posts(organization_id);
CREATE INDEX idx_social_posts_account ON social_posts(social_account_id);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_social_metrics_post ON social_metrics(social_post_id);
CREATE INDEX idx_social_metrics_account ON social_metrics(social_account_id);
CREATE INDEX idx_social_metrics_collected ON social_metrics(collected_at);

-- RLS Policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies básicas (usuário só vê dados da sua organização)
CREATE POLICY social_accounts_policy ON social_accounts
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY social_posts_policy ON social_posts
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY social_metrics_policy ON social_metrics
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY social_sync_logs_policy ON social_sync_logs
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));
```

#### **Task 1.2: Criar Drizzle Schema**
```typescript
// server/db/schema/social.ts
```

---

### **FASE 2: FACEBOOK INTEGRATION (6-7h)**

#### **Task 2.1: Facebook Service - Publicação (3h)**

**Funcionalidades:**
- Publicar post com texto + imagem
- Publicar post com texto + múltiplas imagens
- Publicar post com vídeo
- Agendar publicação

**APIs Necessárias:**
- `POST /{page-id}/feed` - Post com texto
- `POST /{page-id}/photos` - Post com foto
- `POST /{page-id}/videos` - Post com vídeo

#### **Task 2.2: Facebook Service - Coleta de Dados (3-4h)**

**Dados a Coletar:**
```typescript
// Métricas de Posts
- post_impressions (quantas vezes foi visto)
- post_engaged_users (usuários que interagiram)
- post_reactions_like_total
- post_reactions_love_total
- post_clicks (cliques no post)
- post_comments
- post_shares

// Métricas da Página
- page_fans (total de seguidores)
- page_fan_adds (novos seguidores)
- page_impressions (alcance da página)
- page_engaged_users
- page_post_engagements

// Insights de Audiência
- page_fans_country
- page_fans_city
- page_fans_gender_age
```

**APIs Necessárias:**
- `GET /{page-id}/posts` - Listar posts
- `GET /{post-id}/insights` - Métricas do post
- `GET /{page-id}/insights` - Métricas da página
- `GET /{post-id}/comments` - Comentários

---

### **FASE 3: INSTAGRAM INTEGRATION (6-7h)**

#### **Task 3.1: Instagram Service - Publicação (3h)**

**Funcionalidades:**
- Publicar foto (2 steps: create container + publish)
- Publicar carrossel de fotos
- Publicar Reels
- Publicar Stories

**APIs Necessárias:**
- `POST /{ig-user-id}/media` - Criar container de mídia
- `POST /{ig-user-id}/media_publish` - Publicar container
- `POST /{ig-user-id}/media` (com `media_type=STORIES`) - Stories

#### **Task 3.2: Instagram Service - Coleta de Dados (3-4h)**

**Dados a Coletar:**
```typescript
// Métricas de Posts
- impressions
- reach
- engagement (likes + comments + saves)
- saved
- video_views (se for vídeo)

// Métricas de Stories
- impressions
- reach
- replies
- exits
- taps_forward
- taps_back

// Métricas da Conta
- follower_count
- media_count
- profile_views

// Insights de Audiência
- audience_city
- audience_country
- audience_gender_age
```

**APIs Necessárias:**
- `GET /{ig-user-id}/media` - Listar posts
- `GET /{ig-media-id}/insights` - Métricas do post
- `GET /{ig-user-id}/insights` - Métricas da conta
- `GET /{ig-media-id}/comments` - Comentários

---

### **FASE 4: YOUTUBE INTEGRATION (6-7h)**

#### **Task 4.1: YouTube Service - Upload de Vídeos (3-4h)**

**Funcionalidades:**
- Upload de vídeo
- Definir título, descrição, tags
- Definir thumbnail
- Agendar publicação
- Definir privacidade (public, unlisted, private)

**APIs Necessárias:**
- `POST /youtube/v3/videos` - Upload de vídeo (multipart)
- `POST /youtube/v3/thumbnails/set` - Definir thumbnail

#### **Task 4.2: YouTube Service - Coleta de Dados (3h)**

**Dados a Coletar:**
```typescript
// Métricas de Vídeos
- views
- likes
- dislikes
- comments
- shares
- averageViewDuration
- averageViewPercentage
- subscribersGained
- subscribersLost

// Métricas do Canal
- subscriberCount
- videoCount
- viewCount
- estimatedMinutesWatched

// Analytics Avançado
- traffic_sources (de onde vem as views)
- demographics (idade, gênero, localização)
- playback_locations (onde assistem)
- device_types (desktop, mobile, tv)
```

**APIs Necessárias:**
- `GET /youtube/v3/videos` - Dados do vídeo
- `GET /youtube/v3/channels` - Dados do canal
- `GET /youtubeAnalytics/v2/reports` - Analytics avançado
- `GET /youtube/v3/commentThreads` - Comentários

---

### **FASE 5: OAUTH & AUTENTICAÇÃO (4-5h)**

#### **Task 5.1: OAuth Flow (2-3h)**

**Implementar OAuth para cada plataforma:**

**Facebook/Instagram:**
```typescript
// 1. Redirect para autorização
GET https://www.facebook.com/v18.0/dialog/oauth?
  client_id={app-id}&
  redirect_uri={redirect-uri}&
  scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish

// 2. Callback recebe code
GET /api/social/facebook/callback?code={code}

// 3. Trocar code por token
POST https://graph.facebook.com/v18.0/oauth/access_token

// 4. Salvar tokens no banco (criptografados)
```

**YouTube:**
```typescript
// 1. Redirect para autorização
GET https://accounts.google.com/o/oauth2/v2/auth?
  client_id={client-id}&
  redirect_uri={redirect-uri}&
  scope=https://www.googleapis.com/auth/youtube.upload

// 2. Callback e troca de code
// 3. Refresh token automático
```

#### **Task 5.2: Token Management (2h)**

- Criptografar tokens no banco
- Auto-refresh de tokens expirados
- Detectar tokens revogados
- Reconectar contas

---

### **FASE 6: WORKERS & AUTOMAÇÃO (4-5h)**

#### **Task 6.1: Scheduled Posts Worker (2-3h)**

```typescript
// server/services/workers/scheduled-posts-worker.ts

// Cron job que roda a cada 5 minutos
// 1. Buscar posts com status='scheduled' e scheduledFor <= NOW
// 2. Para cada post, publicar na rede social
// 3. Atualizar status para 'published' ou 'failed'
// 4. Salvar platformPostId
```

#### **Task 6.2: Metrics Sync Worker (2h)**

```typescript
// server/services/workers/metrics-sync-worker.ts

// Cron job que roda a cada 1 hora
// 1. Para cada conta social ativa
// 2. Coletar métricas dos últimos posts (últimos 7 dias)
// 3. Coletar métricas da conta/página/canal
// 4. Salvar no banco
// 5. Criar log de sincronização
```

---

### **FASE 7: FRONTEND (3-4h)**

#### **Task 7.1: Social Accounts Manager (2h)**

```typescript
// client/src/pages/SocialAccountsManager.tsx

// Lista de contas conectadas
// Botões: "Conectar Facebook", "Conectar Instagram", "Conectar YouTube"
// Status de cada conta (ativa, token expirado, erro)
// Botão para reconectar
// Últimas métricas de cada conta
```

#### **Task 7.2: Post Scheduler (1-2h)**

```typescript
// client/src/components/social/PostScheduler.tsx

// Form para criar post:
// - Selecionar conta(s) social(is)
// - Texto do post
// - Upload de mídia
// - Agendar data/hora
// - Preview do post
// - Botão "Publicar Agora" ou "Agendar"
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

```env
# Facebook/Instagram
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/social/facebook/callback

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:5000/api/social/youtube/callback

# Encryption (para criptografar tokens)
TOKEN_ENCRYPTION_KEY=your_32_character_secret_key
```

---

## 📊 CRONOGRAMA DETALHADO

### **Day 1-2: Database + Facebook (8-9h)**
- [x] Criar migration SQL
- [x] Criar Drizzle schema
- [ ] Facebook Service - Publicação
- [ ] Facebook Service - Coleta de dados
- [ ] Testar publicação real

### **Day 3-4: Instagram (6-7h)**
- [ ] Instagram Service - Publicação
- [ ] Instagram Service - Coleta de dados
- [ ] Testar publicação real

### **Day 4-5: YouTube (6-7h)**
- [ ] YouTube Service - Upload
- [ ] YouTube Service - Coleta de dados
- [ ] Testar upload real

### **Day 5-6: OAuth + Workers (8-10h)**
- [ ] OAuth flow Facebook/Instagram
- [ ] OAuth flow YouTube
- [ ] Scheduled Posts Worker
- [ ] Metrics Sync Worker

### **Day 6-7: Frontend (3-4h)**
- [ ] Social Accounts Manager
- [ ] Post Scheduler
- [ ] Métricas Dashboard

---

## ✅ TESTES NECESSÁRIOS

### **Publicação:**
- [ ] Publicar post com texto no Facebook
- [ ] Publicar post com imagem no Facebook
- [ ] Publicar post no Instagram
- [ ] Publicar story no Instagram
- [ ] Fazer upload de vídeo no YouTube
- [ ] Agendar post para daqui 10 minutos e verificar publicação automática

### **Coleta de Dados:**
- [ ] Coletar métricas de post do Facebook
- [ ] Coletar métricas da página do Facebook
- [ ] Coletar métricas de post do Instagram
- [ ] Coletar métricas da conta do Instagram
- [ ] Coletar métricas de vídeo do YouTube
- [ ] Coletar métricas do canal do YouTube

### **OAuth:**
- [ ] Conectar conta do Facebook
- [ ] Conectar conta do Instagram
- [ ] Conectar conta do YouTube
- [ ] Refresh automático de token

---

## 🎯 RESULTADO ESPERADO

Ao final da Semana 2, a plataforma terá:

✅ **Publicação Completa:**
- Publicar posts no Facebook (texto + foto + vídeo)
- Publicar posts e stories no Instagram
- Fazer upload de vídeos no YouTube
- Agendar publicações

✅ **Coleta de Dados Completa:**
- Métricas de posts (likes, comments, shares, views, reach, impressions)
- Métricas de contas (followers, engagement rate)
- Insights de audiência (demografia, localização)
- Sincronização automática a cada 1 hora

✅ **Interface Funcional:**
- Conectar/desconectar contas sociais
- Criar e agendar posts
- Visualizar métricas em tempo real

---

## 📝 PRÓXIMOS PASSOS (SEMANA 3)

- Analytics dashboard com gráficos
- Comparação de performance entre plataformas
- Sugestões de melhor horário para postar
- Análise de hashtags mais performáticas
- Responder comentários pela plataforma

---

**Status:** 🚀 INICIANDO AGORA
**Foco:** Database + Facebook Integration
**Tempo Estimado Total:** 25-30 horas
