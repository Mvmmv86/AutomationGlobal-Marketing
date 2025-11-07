# 🚀 MVP ROADMAP - AutomationGlobal Marketing

**Data de Criação:** 07/11/2025
**Versão:** 1.0
**Objetivo:** Lançar MVP funcional em 3-4 semanas
**Status:** 🔄 EM EXECUÇÃO

---

## 📊 ANÁLISE SITUAÇÃO ATUAL

### ✅ O QUE JÁ ESTÁ IMPLEMENTADO (80%)

**INFRAESTRUTURA COMPLETA:**
- ✅ Sistema multi-tenant robusto com isolamento de dados
- ✅ Autenticação JWT + Sessions funcionando
- ✅ 80+ tabelas no PostgreSQL (Supabase)
- ✅ Row Level Security (RLS) configurado
- ✅ Redis cache com fallback in-memory
- ✅ Bull queue para jobs assíncronos
- ✅ Rate limiting hierárquico
- ✅ Logging estruturado

**FUNCIONALIDADES DE MARKETING:**
- ✅ Automação de Blog (3 fases: trends + news + IA)
- ✅ Integração OpenAI + Anthropic (com fallback)
- ✅ Facebook/Instagram OAuth + publicação (80%)
- ✅ Agendamento de posts (estrutura pronta)
- ✅ Dashboard marketing completo
- ✅ Gestão de campanhas Facebook Ads
- ✅ Analytics em tempo real
- ✅ Sistema de métricas por canal

**ADMIN GLOBAL:**
- ✅ Dashboard administrativo
- ✅ Gestão de organizações (CRUD)
- ✅ Controle de permissões (6 níveis)
- ✅ Gestão de IAs globais

---

## 🔥 PONTOS CRÍTICOS IDENTIFICADOS

### 1. **CONFUSÃO ARQUITETURAL** 🚨 CRÍTICO
- Rotas misturadas entre Admin e Client
- Não há separação clara de acesso
- Riscos de segurança

### 2. **MÚLTIPLOS SISTEMAS DE AUTENTICAÇÃO** 🚨 CRÍTICO
- 6 arquivos de auth diferentes
- Código duplicado
- Difícil manutenção

### 3. **CAMPO USERNAME OBRIGATÓRIO** ⚠️ ALTO
- Schema exige mas código não gera
- Registro quebra

### 4. **INTEGRAÇÕES INCOMPLETAS** ⚠️ MÉDIO
- Facebook: 80% (falta publicação real)
- Instagram: 70% (falta Graph API)
- YouTube: 30%
- Twitter/X: 10%
- WhatsApp: 0%

### 5. **WORKER DE POSTS AGENDADOS** ⚠️ MÉDIO
- Estrutura existe mas cron job não implementado
- Posts não publicam automaticamente

### 6. **CÓDIGO DE TESTE EM PRODUÇÃO** ⚠️ BAIXO
- Páginas e rotas de teste poluindo código
- Confusão e possíveis riscos

---

## 🎯 ESTRATÉGIA MVP

### **FILOSOFIA: "LIMPAR, FOCAR, LANÇAR"**

**Princípios:**
1. **Separação Total:** Admin e Client são aplicações distintas
2. **Simplicidade:** Remover código não utilizado
3. **Foco:** Marketing é o core, multi-tenant é infraestrutura
4. **Qualidade:** Menos features, mais polimento

---

## 📅 ROADMAP COMPLETO (3-4 SEMANAS)

---

## **SEMANA 1: LIMPEZA E ESTRUTURAÇÃO** (20-25h)

### **Day 1-2: Consolidar Autenticação (5h)** ✅ PRIORIDADE MÁXIMA

#### **Task 1.1: Limpar Sistema de Auth (3h)**
- [ ] Manter apenas `server/blueprints/auth-unified.ts`
- [ ] Remover arquivos:
  - `server/blueprints/auth.ts`
  - `server/blueprints/auth-v2.ts`
  - `server/blueprints/auth-local.ts`
  - `server/middleware/auth-middleware.ts` (manter auth-unified.ts)
- [ ] Atualizar todos os imports
- [ ] Adicionar geração automática de username:
```typescript
// No registro
const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
```

#### **Task 1.2: Criar Dois Sistemas de Login (2h)**
- [ ] **Login Admin:**
  - Rota: `POST /api/admin/auth/login`
  - Verificar role: `super_admin` ou `org_owner`
  - Retornar token JWT específico
- [ ] **Login Client:**
  - Rota: `POST /api/auth/login`
  - Aceitar qualquer role da organização
  - Retornar token JWT + organizationId

---

### **Day 3-4: Separar Estrutura Frontend (8h)** ✅ PRIORIDADE MÁXIMA

#### **Task 1.3: Reorganizar Estrutura de Pastas (2h)**
```
client/src/
├── admin/                    # 🔷 ADMIN PLATFORM
│   ├── pages/
│   │   ├── AdminLogin.tsx          ← NOVO
│   │   ├── AdminDashboard.tsx
│   │   ├── OrganizationsManagement.tsx
│   │   └── AIManagementGlobal.tsx
│   ├── components/
│   │   └── AdminLayout.tsx
│   └── styles/
│       └── admin-theme.css         # Design futurístico neon
│
├── app/                      # 🟢 CLIENT PLATFORM (Marketing)
│   ├── pages/
│   │   ├── ClientLogin.tsx         ← NOVO
│   │   ├── Dashboard.tsx
│   │   ├── Campaigns.tsx
│   │   ├── BlogAutomation.tsx
│   │   └── SocialMedia.tsx
│   ├── components/
│   │   └── AppLayout.tsx
│   └── styles/
│       └── app-theme.css           # Design glass morphism
│
├── shared/                   # 🔄 COMPARTILHADO
│   ├── components/ui/        # shadcn/ui components
│   ├── hooks/
│   └── lib/
│
└── dev/                      # 🧪 PÁGINAS DE TESTE (só dev)
    ├── DatabaseTest.tsx
    ├── AuthTest.tsx
    └── ...
```

#### **Task 1.4: Criar Login Admin (3h)**

**Arquivo: `client/src/admin/pages/AdminLogin.tsx`**

Design System Admin:
- Background: Matrix grid animado
- Colors: Azul escuro + Ciano neon + Roxo
- Glass morphism cards
- Neon borders pulsantes
- Silver icons com glow

Funcionalidades:
- [ ] Form com email + password
- [ ] Validação com Zod
- [ ] Chamar `POST /api/admin/auth/login`
- [ ] Salvar token em localStorage
- [ ] Redirect para `/admin/dashboard`
- [ ] Mostrar erros de validação
- [ ] Loading state

#### **Task 1.5: Criar Login Client (3h)**

**Arquivo: `client/src/app/pages/ClientLogin.tsx`**

Design System Client:
- Background: Gradient suave
- Colors: Branco + Glass morphism + Sombras 3D
- Cards elevados
- Transições suaves
- Icons coloridos

Funcionalidades:
- [ ] Form com email + password
- [ ] Validação com Zod
- [ ] Chamar `POST /api/auth/login`
- [ ] Salvar token + organizationId
- [ ] Redirect para `/app/dashboard`
- [ ] Mostrar erros de validação
- [ ] Loading state
- [ ] Link "Esqueci senha"

---

### **Day 5-6: Reorganizar Rotas (7h)**

#### **Task 1.6: Atualizar Roteamento Backend (3h)**

**Arquivo: `server/routes.ts`**

```typescript
// ADMIN ROUTES (Super Admin)
app.use('/api/admin/auth', adminAuthRouter);        // Login admin
app.use('/api/admin/organizations', adminOrgsRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/ai', adminAIRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);

// CLIENT ROUTES (Marketing Organizations)
app.use('/api/auth', authRouter);                   // Login client
app.use('/api/dashboard', dashboardRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/blog', blogRouter);
app.use('/api/social-media', socialMediaRouter);
app.use('/api/content', contentRouter);

// SHARED ROUTES
app.use('/api/health', healthRouter);

// DEV ROUTES (apenas em development)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', testRouter);
}
```

#### **Task 1.7: Atualizar Roteamento Frontend (2h)**

**Arquivo: `client/src/App.tsx`**

```typescript
// ADMIN ROUTES
<Route path="/admin/login" component={AdminLogin} />
<Route path="/admin/dashboard" component={AdminDashboard} />
<Route path="/admin/organizations" component={OrganizationsManagement} />
<Route path="/admin/ai" component={AIManagementGlobal} />

// CLIENT ROUTES
<Route path="/login" component={ClientLogin} />
<Route path="/app/dashboard" component={Dashboard} />
<Route path="/app/campaigns" component={Campaigns} />
<Route path="/app/blog" component={BlogAutomation} />
<Route path="/app/social" component={SocialMedia} />

// ROOT
<Route path="/" component={LandingPage} />
```

#### **Task 1.8: Criar Guards de Autenticação (2h)**

**Admin Guard:**
```typescript
// client/src/admin/components/AdminGuard.tsx
- Verificar token válido
- Verificar role = 'super_admin' ou 'org_owner'
- Redirect para /admin/login se não autorizado
```

**Client Guard:**
```typescript
// client/src/app/components/AppGuard.tsx
- Verificar token válido
- Verificar organizationId presente
- Redirect para /login se não autorizado
```

---

### **Day 7: Limpar Código Não Utilizado (5h)**

#### **Task 1.9: Mover Páginas de Teste (1h)**
- [ ] Mover todas `*Test.tsx` para `client/src/dev/`
- [ ] Adicionar guard: só acessível em development
- [ ] Atualizar imports

#### **Task 1.10: Remover Tabelas ML Não Usadas (2h)**
- [ ] Comentar ou remover do schema:
  - `ml_models`
  - `ml_predictions`
  - `analytics_datasets` (se não usado)
- [ ] Executar migration
- [ ] Testar que nada quebrou

#### **Task 1.11: Limpar Rotas de Teste Backend (1h)**
- [ ] Mover rotas `/api/test/*` para arquivo separado
- [ ] Adicionar condição: `if (NODE_ENV === 'development')`
- [ ] Documentar quais rotas são para teste

#### **Task 1.12: Limpar Imports Não Usados (1h)**
- [ ] Rodar linter em todo código
- [ ] Remover imports não utilizados
- [ ] Remover comentários antigos

---

## **SEMANA 2: FINALIZAR INTEGRAÇÕES SOCIAIS** (18-22h)

### **Day 1-2: Facebook Publicação Real (6h)**

#### **Task 2.1: Implementar Facebook Graph API (4h)**

**Arquivo: `server/services/facebookPublishService.ts`**

```typescript
export class FacebookPublishService {
  async publishPost(postId: string, accountId: string) {
    // 1. Buscar post e account do banco
    // 2. Upload de imagem (se houver) - POST /me/photos
    // 3. Criar post com texto - POST /me/feed
    // 4. Atualizar status no banco para 'published'
    // 5. Salvar facebook_post_id
    // 6. Log de sucesso
  }

  async publishWithImage(imageUrl: string, caption: string, accessToken: string) {
    // POST https://graph.facebook.com/v18.0/me/photos
  }

  async publishTextOnly(message: string, accessToken: string) {
    // POST https://graph.facebook.com/v18.0/me/feed
  }
}
```

**Endpoints:**
- [ ] `POST /api/social-media/facebook/publish/:postId`
- [ ] Testar com conta real
- [ ] Verificar post no Facebook
- [ ] Salvar metrics (reach, engagement)

#### **Task 2.2: Integrar com Scheduler (2h)**
- [ ] Conectar publishService com scheduledPostsWorker
- [ ] Quando scheduler executar, chamar publishPost()
- [ ] Atualizar status: scheduled → published
- [ ] Tratar erros: scheduled → failed

---

### **Day 3-4: Instagram Publicação Real (7h)**

#### **Task 2.3: Implementar Instagram Graph API (5h)**

**Arquivo: `server/services/instagramPublishService.ts`**

```typescript
export class InstagramPublishService {
  // Instagram precisa de 2 passos

  async publishPost(postId: string, accountId: string) {
    // 1. Criar container de mídia
    const containerId = await this.createMediaContainer(imageUrl, caption);

    // 2. Aguardar processamento (polling)
    await this.waitForContainerReady(containerId);

    // 3. Publicar container
    const mediaId = await this.publishContainer(containerId);

    // 4. Atualizar banco
  }

  async createMediaContainer(imageUrl: string, caption: string, accessToken: string) {
    // POST https://graph.facebook.com/v18.0/{ig-user-id}/media
    // body: { image_url, caption }
  }

  async publishContainer(containerId: string, accessToken: string) {
    // POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
    // body: { creation_id }
  }
}
```

**Limitações Instagram:**
- Conta precisa ser Business ou Creator
- Imagem deve estar hospedada (URL pública)
- Máximo 25 posts por dia

**Endpoints:**
- [ ] `POST /api/social-media/instagram/publish/:postId`
- [ ] Testar com conta real
- [ ] Verificar post no Instagram

#### **Task 2.4: Implementar Instagram Stories (2h)**
```typescript
async publishStory(imageUrl: string, accountId: string) {
  // POST /me/media com media_type=STORIES
}
```

---

### **Day 5: Worker de Agendamento (5h)**

#### **Task 2.5: Criar Scheduled Posts Worker (4h)**

**Arquivo: `server/workers/scheduledPostsWorker.ts`**

```typescript
import cron from 'node-cron';
import { db } from '../database';
import { scheduledPosts, scheduledJobs } from '../shared/schema';
import { FacebookPublishService } from '../services/facebookPublishService';
import { InstagramPublishService } from '../services/instagramPublishService';

export class ScheduledPostsWorker {

  async processScheduledPosts() {
    // 1. Buscar posts com scheduledAt <= NOW e status = 'scheduled'
    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(
        and(
          lte(scheduledPosts.scheduledAt, new Date()),
          eq(scheduledPosts.status, 'scheduled')
        )
      )
      .limit(50);

    // 2. Para cada post
    for (const post of posts) {
      try {
        // 2.1. Publicar na plataforma
        if (post.platform === 'facebook') {
          await this.facebookService.publishPost(post.id, post.accountId);
        } else if (post.platform === 'instagram') {
          await this.instagramService.publishPost(post.id, post.accountId);
        }

        // 2.2. Atualizar status para 'published'
        await db.update(scheduledPosts)
          .set({
            status: 'published',
            publishedAt: new Date()
          })
          .where(eq(scheduledPosts.id, post.id));

        // 2.3. Registrar em scheduled_jobs
        await db.insert(scheduledJobs).values({
          postId: post.id,
          status: 'completed',
          completedAt: new Date()
        });

      } catch (error) {
        // 2.4. Em caso de erro, marcar como failed
        await db.update(scheduledPosts)
          .set({
            status: 'failed',
            errorMessage: error.message
          })
          .where(eq(scheduledPosts.id, post.id));
      }
    }
  }

  async retryFailedJobs() {
    // Tentar novamente jobs com falha (retry_count < max_retries)
  }

  async start() {
    // Executar a cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      console.log('🔄 Processing scheduled posts...');
      this.processScheduledPosts();
    });

    // Retry de jobs falhados a cada 30 minutos
    cron.schedule('*/30 * * * *', () => {
      console.log('🔁 Retrying failed jobs...');
      this.retryFailedJobs();
    });
  }
}
```

#### **Task 2.6: Iniciar Worker no Server (1h)**

**Arquivo: `server/index.ts`**

```typescript
import { ScheduledPostsWorker } from './workers/scheduledPostsWorker';

// ...

const worker = new ScheduledPostsWorker();
worker.start();

console.log('✅ Scheduled posts worker started');
```

---

## **SEMANA 3: MELHORIAS DE UX E FUNCIONALIDADES** (15-18h)

### **Day 1-2: WhatsApp Business Básico (6h)**

#### **Task 3.1: Configurar WhatsApp Business API (2h)**
- [ ] Criar conta Meta Business
- [ ] Configurar WhatsApp Business Account
- [ ] Obter Phone Number ID e Access Token
- [ ] Configurar Webhook URL
- [ ] Salvar credenciais no banco

#### **Task 3.2: Implementar Envio de Mensagens (4h)**

**Arquivo: `server/services/whatsappService.ts`**

```typescript
export class WhatsAppService {
  async sendMessage(to: string, message: string, organizationId: string) {
    // POST /v18.0/{phone_number_id}/messages
    // body: { messaging_product: "whatsapp", to, text: { body: message } }
  }

  async sendImage(to: string, imageUrl: string, caption: string) {
    // Enviar imagem com caption
  }

  async sendTemplate(to: string, templateName: string, params: any) {
    // Enviar template aprovado
  }
}
```

**Endpoints:**
- [ ] `POST /api/whatsapp/send`
- [ ] `POST /api/whatsapp/send-image`
- [ ] Testar envio real

---

### **Day 3: Dashboard Marketing Consolidado (5h)**

#### **Task 3.3: Consolidar Dashboard (3h)**
- [ ] Manter apenas `client/src/app/pages/Dashboard.tsx`
- [ ] Remover dashboards duplicados
- [ ] Organizar em abas:
  - Overview (métricas principais)
  - Campanhas
  - Conteúdo (blog)
  - Redes Sociais
  - Analytics

#### **Task 3.4: Otimizar Queries (2h)**
- [ ] Adicionar loading states
- [ ] Implementar cache de métricas (5min TTL)
- [ ] Lazy load de gráficos
- [ ] Skeleton loaders

---

### **Day 4-5: Onboarding e Primeira Experiência (7h)**

#### **Task 3.5: Wizard de Configuração Inicial (4h)**

**Arquivo: `client/src/app/pages/Onboarding.tsx`**

**Steps:**
1. Bem-vindo
2. Conectar redes sociais (Facebook/Instagram)
3. Configurar blog automation (nicho)
4. Criar primeiro post
5. Finalizar (redirect para dashboard)

#### **Task 3.6: Tour Guiado (3h)**
- [ ] Usar biblioteca Intro.js ou React Joyride
- [ ] Destacar principais features
- [ ] Permitir pular tour
- [ ] Salvar em localStorage que já viu

---

## **SEMANA 4: TESTES E DEPLOY** (12-15h)

### **Day 1-2: Testes E2E (6h)**

#### **Task 4.1: Fluxo Admin (2h)**
- [ ] Login admin
- [ ] Criar nova organização
- [ ] Configurar plano
- [ ] Visualizar analytics
- [ ] Logout

#### **Task 4.2: Fluxo Cliente (4h)**
- [ ] Login cliente
- [ ] Conectar Facebook/Instagram
- [ ] Criar post manual
- [ ] Agendar post
- [ ] Verificar publicação
- [ ] Criar automação de blog
- [ ] Ver métricas
- [ ] Logout

---

### **Day 3: Performance e Otimização (4h)**

#### **Task 4.3: Otimizar Banco de Dados (2h)**
- [ ] Adicionar índices:
```sql
CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_social_media_posts_org_id ON social_media_posts(organization_id);
CREATE INDEX idx_ai_usage_logs_org_id ON ai_usage_logs(organization_id);
```

#### **Task 4.4: Otimizar Frontend (2h)**
- [ ] Code splitting por rota
- [ ] Lazy load de componentes pesados
- [ ] Comprimir imagens
- [ ] Minificar CSS/JS

---

### **Day 4-5: Deploy e Monitoramento (5h)**

#### **Task 4.5: Preparar Deploy (3h)**
- [ ] Criar `.env.production`
- [ ] Configurar variáveis de ambiente
- [ ] Testar build de produção
- [ ] Configurar CORS correto
- [ ] Configurar rate limits

#### **Task 4.6: Deploy em Produção (2h)**
- [ ] Deploy backend (Railway/Render/Heroku)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configurar domínio
- [ ] SSL/HTTPS
- [ ] Testar em produção

---

## 🎯 MVP FINAL - FUNCIONALIDADES ENTREGUES

### ✅ ADMIN PLATFORM
- Login exclusivo para super admins
- Dashboard com métricas globais
- Gestão de organizações (CRUD)
- Gestão de IAs globais
- Analytics de uso do sistema

### ✅ CLIENT PLATFORM (Marketing)
- Login para usuários de organizações
- Dashboard marketing completo
- Automação de blog (trends + news + IA)
- Gestão de redes sociais:
  - Conectar Facebook/Instagram
  - Criar posts
  - Agendar publicação
  - Publicação automática
  - Métricas e analytics
- WhatsApp envio de mensagens
- Onboarding guiado

### ✅ INTEGRAÇÕES
- OpenAI GPT-4
- Anthropic Claude
- Facebook Graph API (publicação completa)
- Instagram Graph API (posts + stories)
- WhatsApp Business API (envio de mensagens)
- News API
- Google Trends

### ✅ INFRAESTRUTURA
- Multi-tenant com isolamento
- Autenticação consolidada
- Worker de agendamento
- Cache distribuído
- Rate limiting
- Logging estruturado
- Health checks

---

## ⏳ PARA VERSÃO 2.0

- YouTube upload de vídeos
- Twitter/X integração
- WhatsApp bot com IA conversacional
- Google Analytics completo
- Google Ads gestão
- Analytics avançado (ML)
- Templates marketplace
- API pública
- Mobile app
- Webhooks customizados

---

## 📊 CRONOGRAMA RESUMIDO

| Semana | Foco | Horas | Status |
|--------|------|-------|--------|
| **1** | Limpeza e Estruturação | 20-25h | 🔄 EM PROGRESSO |
| **2** | Integrações Sociais | 18-22h | ⏳ PENDENTE |
| **3** | UX e Features | 15-18h | ⏳ PENDENTE |
| **4** | Testes e Deploy | 12-15h | ⏳ PENDENTE |
| **TOTAL** | | **65-80h** | **~2-3 semanas full-time** |

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### **HOJE (Próximas 4-6h):**
1. ✅ Consolidar autenticação
2. ✅ Criar estrutura de pastas admin/app
3. ✅ Criar AdminLogin.tsx
4. ✅ Criar ClientLogin.tsx

### **AMANHÃ (6-8h):**
1. ✅ Reorganizar rotas backend
2. ✅ Reorganizar rotas frontend
3. ✅ Criar guards de autenticação
4. ✅ Mover páginas de teste

---

## 📝 NOTAS IMPORTANTES

1. **Design Systems:**
   - Admin: Futurístico neon/matrix (já existe)
   - Client: Glass morphism 3D (já existe)

2. **Segurança:**
   - Admin e Client completamente separados
   - Tokens JWT diferentes
   - Rotas com guards específicos

3. **Testes:**
   - Páginas de teste apenas em development
   - Não acessíveis em produção

4. **Performance:**
   - Cache de 5min para métricas
   - Índices no banco otimizados
   - Code splitting no frontend

---

**Versão:** 1.0
**Última Atualização:** 07/11/2025
**Status:** 🔄 EXECUÇÃO INICIADA
