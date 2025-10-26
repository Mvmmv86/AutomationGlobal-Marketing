# 🎯 PLANO DE AÇÃO DETALHADO - MVP MARKETING AUTOMATION

**Data:** 04/10/2025  
**Versão:** 1.0  
**Objetivo:** Lançar plataforma de automação de marketing com integrações completas

---

## 📊 DESCOBERTAS DA ANÁLISE PROFUNDA

### ✅ **O QUE JÁ ESTÁ IMPLEMENTADO E FUNCIONANDO:**

#### **1. INTEGRAÇÕES DE IA** ✅ 100% IMPLEMENTADO
**Arquivos:** `server/services/ai.ts`, `server/services/contentGenerationService.ts`

**Status:**
- ✅ OpenAI GPT integrado e funcionando
- ✅ Anthropic Claude integrado e funcionando
- ✅ Sistema de fallback automático (se um falha, usa outro)
- ✅ Load balancing entre provedores
- ✅ Log de uso de IA por organização
- ❌ Grok NÃO implementado (precisa adicionar)

**Funcionalidades:**
- Geração de conteúdo para blog
- Otimização de copy para redes sociais
- Reescrita de textos com IA
- Geração de imagens (via DALL-E)

---

#### **2. AUTOMAÇÃO DE BLOG** ✅ 90% IMPLEMENTADO
**Arquivos:** `client/src/pages/BlogAutomationEnhanced.tsx`, `server/services/contentGenerationService.ts`

**Status:**
- ✅ Sistema de 3 fases funcionando:
  - **Fase 1:** Coleta de trends (Google Trends, YouTube, Reddit)
  - **Fase 2:** Busca de notícias (News API)
  - **Fase 3:** Geração de post com IA
- ✅ Rota A: Post baseado em notícias
- ✅ Rota B: Post baseado em trends sociais
- ✅ Múltiplos nichos suportados
- ⚠️ **PRECISA MELHORAR:**
  - Agendamento automático
  - Publicação automática em CMS/WordPress
  - Deduplicação de conteúdo

---

#### **3. CRIAÇÃO DE POSTS COM IA** ✅ 100% IMPLEMENTADO
**Arquivos:** `server/routes.ts` (linha 1889-2092), `client/src/components/SocialMediaManager.tsx`

**Status:**
- ✅ Otimização de texto com Anthropic Claude
- ✅ Fallback para OpenAI se Claude falhar
- ✅ Geração de hashtags inteligentes
- ✅ Gatilhos mentais e copy persuasiva
- ✅ Suporte para múltiplas plataformas

---

#### **4. AGENDAMENTO DE POSTS** ✅ 80% IMPLEMENTADO
**Arquivos:** `server/socialMediaService.ts`, `shared/schema.ts` (scheduledPosts, scheduledJobs)

**Status:**
- ✅ Tabela `scheduled_posts` criada
- ✅ Tabela `scheduled_jobs` para jobs assíncronos
- ✅ Lógica de status: draft, scheduled, published, failed
- ⚠️ **PRECISA MELHORAR:**
  - Worker/Cron job para executar posts agendados
  - Retry automático em caso de falha
  - Notificações de sucesso/falha

---

#### **5. INTEGRAÇÕES SOCIAIS** ⚠️ 60% IMPLEMENTADO

**Facebook** ✅ 80%
- ✅ OAuth2 conectado
- ✅ Salvar access tokens
- ✅ API de posts implementada
- ⚠️ Falta: Publicação real via Graph API

**Instagram** ✅ 70%
- ✅ OAuth2 conectado
- ✅ Salvar access tokens
- ⚠️ Falta: Instagram Graph API para publicação
- ⚠️ Falta: Stories e Reels

**YouTube** ❌ 30%
- ✅ API Key configurável
- ❌ OAuth2 não implementado
- ❌ Upload de vídeos não implementado

**X (Twitter)** ❌ 10%
- ❌ Integração não iniciada
- ❌ API v2 precisa ser implementada

**WhatsApp** ❌ 0%
- ❌ Nenhuma integração encontrada
- ❌ WhatsApp Business API precisa ser implementada
- ❌ Bot de atendimento precisa ser criado

---

#### **6. CAMPANHAS FACEBOOK ADS** ✅ 90% IMPLEMENTADO
**Arquivos:** `server/facebookMarketingService.ts`, `client/src/components/NewCampaignWizard.tsx`

**Status:**
- ✅ Criação de campanhas via Facebook Marketing API
- ✅ Sincronização de campanhas existentes
- ✅ Busca de contas de anúncios
- ✅ Wizard completo no frontend
- ✅ Métricas em tempo real
- ⚠️ **PRECISA MELHORAR:**
  - Criação de Ad Sets
  - Criação de Ads (anúncios individuais)
  - Gestão de orçamento avançada

---

#### **7. ANALYTICS** ❌ 30% IMPLEMENTADO

**Google Analytics** ❌ 10%
- ✅ Tabelas no schema: `marketing_metrics`, `channel_performance`
- ❌ Integração com GA4 não implementada
- ❌ Tracking de eventos não configurado

**Google Ads** ❌ 5%
- ❌ Integração não encontrada
- ❌ API do Google Ads não implementada

---

## 🎯 PLANO DE AÇÃO DETALHADO

---

### **FASE 0: CORREÇÕES CRÍTICAS** (1h) 🔥

#### **Task 0.1: Corrigir campo `username` obrigatório**
**Tempo:** 15min  
**Prioridade:** 🔥 CRÍTICA

**O que fazer:**
1. Abrir `shared/schema.ts`
2. Gerar username automaticamente do email no `auth-unified.ts`
3. Testar registro de usuário

**Arquivos:**
- `server/blueprints/auth-unified.ts` (linha ~180)

**Código sugerido:**
```typescript
// Gerar username do email
const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
```

---

#### **Task 0.2: Atualizar cursor.md com novo plano**
**Tempo:** 10min  
**Prioridade:** ALTA

**O que fazer:**
1. Adicionar link para este plano no `cursor.md`
2. Atualizar status das tasks concluídas

---

### **FASE 1: INTEGRAÇÕES SOCIAIS COMPLETAS** (8-10h) 🌐

---

#### **Task 1.1: Finalizar Facebook - Publicação Real**
**Tempo:** 2h  
**Prioridade:** 🔥 CRÍTICA  
**Arquivos existentes:** `server/facebookMarketingService.ts`, `server/socialMediaService.ts`

**O que fazer:**

**1. Implementar publicação via Graph API (1h)**
```typescript
// server/socialMediaService.ts - Adicionar método
async publishToFacebook(postId: string, accountId: string) {
  // 1. Buscar post e account do banco
  // 2. Upload de imagem (se houver)
  // 3. Criar post via Graph API
  // 4. Atualizar status no banco
}
```

**2. Integrar com scheduler (30min)**
- Criar job no `scheduled_jobs`
- Executar no horário agendado

**3. Testar fluxo completo (30min)**
- Criar post
- Agendar
- Publicar
- Verificar no Facebook

**Endpoints a usar:**
- `POST /me/photos` (com imagem)
- `POST /me/feed` (texto)

---

#### **Task 1.2: Finalizar Instagram - Posts e Stories**
**Tempo:** 2-3h  
**Prioridade:** 🔥 CRÍTICA  
**Arquivos existentes:** `server/socialMediaService.ts`

**O que fazer:**

**1. Implementar Instagram Graph API (1.5h)**
```typescript
// Instagram precisa de 2 passos:
// 1. Upload da mídia (container)
// 2. Publicação do container

async publishToInstagram(postId: string, accountId: string) {
  // 1. Criar container de mídia
  const containerId = await createMediaContainer(imageUrl, caption);
  
  // 2. Publicar container
  const mediaId = await publishContainer(containerId);
  
  // 3. Atualizar banco
}
```

**2. Implementar Stories (1h)**
- Endpoint diferente: `/me/media` com `media_type=STORIES`
- Suportar imagens e vídeos curtos

**3. Testes (30min)**

**Limitações Instagram:**
- Precisa ser conta Business/Creator
- Imagens devem estar hospedadas (URL pública)

---

#### **Task 1.3: Implementar YouTube - Upload de Vídeos**
**Tempo:** 3h  
**Prioridade:** MÉDIA  
**Arquivos novos:** `server/services/youtubeService.ts`

**O que fazer:**

**1. Implementar OAuth2 YouTube (1h)**
```typescript
// server/services/youtubeService.ts
export class YouTubeService {
  async connectAccount(code: string) {
    // 1. Trocar code por tokens
    // 2. Salvar em socialMediaAccounts
  }
  
  async uploadVideo(postId: string, accountId: string) {
    // 1. Buscar vídeo do post
    // 2. Upload via YouTube Data API v3
    // 3. Definir título, descrição, tags
    // 4. Atualizar status
  }
}
```

**2. Implementar upload de vídeo (1.5h)**
- Usar `google-auth-library` e `googleapis`
- Endpoint: `youtube.videos.insert`
- Suportar até 256MB (free tier)

**3. Atualizar UI (30min)**
- Adicionar botão "Conectar YouTube"
- Suportar upload de vídeo no post editor

**Dependências novas:**
```json
"googleapis": "^118.0.0",
"@google-cloud/storage": "^7.7.0"
```

---

#### **Task 1.4: Implementar X (Twitter) - Tweets e Threads**
**Tempo:** 2h  
**Prioridade:** MÉDIA  
**Arquivos novos:** `server/services/twitterService.ts`

**O que fazer:**

**1. Implementar OAuth 2.0 Twitter (45min)**
```typescript
// server/services/twitterService.ts
export class TwitterService {
  async connectAccount(code: string) {
    // OAuth 2.0 com PKCE
  }
  
  async createTweet(postId: string, accountId: string) {
    // API v2: POST /2/tweets
  }
}
```

**2. Implementar publicação (45min)**
- Endpoint: `https://api.twitter.com/2/tweets`
- Suportar texto + até 4 imagens
- Suportar threads (múltiplos tweets)

**3. Upload de mídia (30min)**
- Endpoint separado para upload: `/1.1/media/upload`
- Depois adicionar media_ids ao tweet

**Dependências novas:**
```json
"twitter-api-v2": "^1.15.0"
```

---

#### **Task 1.5: Implementar WhatsApp Business API**
**Tempo:** 4-5h  
**Prioridade:** 🔥 ALTA  
**Arquivos novos:** `server/services/whatsappService.ts`

**O que fazer:**

**1. Configurar WhatsApp Business API (1h)**
- Criar conta Meta Business
- Configurar WhatsApp Business Account
- Obter Phone Number ID e Access Token
- Configurar Webhook

**2. Implementar envio de mensagens (1.5h)**
```typescript
// server/services/whatsappService.ts
export class WhatsAppService {
  async sendMessage(to: string, message: string) {
    // POST /v18.0/{phone_number_id}/messages
  }
  
  async sendTemplate(to: string, templateName: string, params: any) {
    // Enviar template aprovado
  }
  
  async sendMedia(to: string, mediaUrl: string, caption: string) {
    // Enviar imagem/vídeo/documento
  }
}
```

**3. Implementar Bot de Atendimento (2h)**
```typescript
// server/services/whatsappBot.ts
export class WhatsAppBot {
  async handleIncomingMessage(message: any) {
    // 1. Identificar intent com IA
    // 2. Gerar resposta
    // 3. Enviar resposta
  }
  
  async handleCommand(command: string, params: any) {
    // Comandos: /status, /help, /falar_com_humano
  }
}
```

**4. Criar painel de conversas (30min)**
- Listar conversas ativas
- Histórico de mensagens
- Status de entrega

**5. Testes (30min)**

**Endpoints principais:**
- `POST /{phone_number_id}/messages` - Enviar
- Webhook para receber mensagens

**Dependências novas:**
```json
"whatsapp-web.js": "^1.23.0" (alternativa)
```

---

### **FASE 2: ANALYTICS E MÉTRICAS** (4-5h) 📊

---

#### **Task 2.1: Integrar Google Analytics 4**
**Tempo:** 2h  
**Prioridade:** MÉDIA  
**Arquivos novos:** `server/services/googleAnalyticsService.ts`

**O que fazer:**

**1. Implementar Google Analytics Data API (1h)**
```typescript
// server/services/googleAnalyticsService.ts
export class GoogleAnalyticsService {
  async getMetrics(organizationId: string, dateRange: any) {
    // 1. Buscar credenciais da org
    // 2. Chamar GA4 Data API
    // 3. Retornar métricas: views, users, sessions, bounce rate
  }
  
  async getTopPages(propertyId: string, limit: number) {
    // Páginas mais visitadas
  }
  
  async getTrafficSources(propertyId: string) {
    // Origem do tráfego
  }
}
```

**2. Criar dashboard de métricas (1h)**
- Gráficos de visitantes
- Páginas mais acessadas
- Taxa de conversão

**Dependências:**
```json
"@google-analytics/data": "^4.0.0"
```

---

#### **Task 2.2: Integrar Google Ads**
**Tempo:** 2-3h  
**Prioridade:** MÉDIA  
**Arquivos novos:** `server/services/googleAdsService.ts`

**O que fazer:**

**1. Implementar Google Ads API (1.5h)**
```typescript
// server/services/googleAdsService.ts
export class GoogleAdsService {
  async getCampaigns(customerId: string) {
    // Buscar campanhas ativas
  }
  
  async getMetrics(campaignId: string) {
    // Impressões, cliques, CTR, CPC, conversões
  }
  
  async createCampaign(data: any) {
    // Criar campanha no Google Ads
  }
}
```

**2. Sincronizar com banco (1h)**
- Salvar campanhas em `marketing_campaigns`
- Atualizar métricas periodicamente

**3. Criar dashboard (30min)**

**Dependências:**
```json
"google-ads-api": "^13.0.0"
```

---

### **FASE 3: MELHORIAS DE AUTOMAÇÃO** (6-8h) ⚡

---

#### **Task 3.1: Implementar Worker para Posts Agendados**
**Tempo:** 2h  
**Prioridade:** 🔥 ALTA  
**Arquivos novos:** `server/workers/scheduledPostsWorker.ts`

**O que fazer:**

**1. Criar worker (1h)**
```typescript
// server/workers/scheduledPostsWorker.ts
export class ScheduledPostsWorker {
  async processScheduledPosts() {
    // 1. Buscar posts com scheduledAt <= NOW e status = 'scheduled'
    // 2. Para cada post:
    //    - Publicar na plataforma
    //    - Atualizar status para 'published' ou 'failed'
    //    - Registrar em scheduled_jobs
  }
  
  async retryFailedJobs() {
    // Tentar novamente jobs com falha (retry_count < max_retries)
  }
}
```

**2. Configurar cron job (30min)**
```typescript
// server/index.ts
import cron from 'node-cron';

// Executar a cada 5 minutos
cron.schedule('*/5 * * * *', () => {
  scheduledPostsWorker.processScheduledPosts();
});
```

**3. Adicionar notificações (30min)**
- Email ou webhook quando post for publicado
- Alerta se falhar

**Dependências:**
```json
"node-cron": "^3.0.3"
```

---

#### **Task 3.2: Melhorar Blog Automation - Publicação Automática**
**Tempo:** 3h  
**Prioridade:** ALTA  
**Arquivos existentes:** `server/services/contentGenerationService.ts`

**O que fazer:**

**1. Integrar com WordPress (1.5h)**
```typescript
// server/services/wordpressService.ts
export class WordPressService {
  async publishPost(post: any, credentials: any) {
    // POST /wp-json/wp/v2/posts
    // Título, conteúdo, featured image, tags, categorias
  }
  
  async uploadFeaturedImage(imageUrl: string) {
    // Upload de imagem
  }
}
```

**2. Adicionar deduplicação (1h)**
```typescript
// server/services/contentDeduplication.ts
export class ContentDeduplication {
  async checkDuplicate(title: string, content: string) {
    // 1. Gerar hash do conteúdo
    // 2. Buscar no banco posts com hash similar
    // 3. Calcular similaridade (Levenshtein distance)
    // 4. Retornar se é duplicado (> 80% similar)
  }
}
```

**3. Agendar publicação automática (30min)**
- Configurar frequência (diária, 3x semana, etc)
- Escolher melhor horário

---

#### **Task 3.3: Implementar Automação WhatsApp Bot**
**Tempo:** 3h  
**Prioridade:** ALTA  
**Arquivos:** `server/services/whatsappBot.ts`

**O que fazer:**

**1. Criar sistema de intents com IA (1.5h)**
```typescript
// server/services/whatsappBot.ts
async classifyIntent(message: string) {
  // Usar GPT para identificar:
  // - Saudação
  // - Dúvida sobre produto
  // - Reclamação
  // - Solicitação de suporte
  // - Cancelamento
}

async generateResponse(intent: string, context: any) {
  // Gerar resposta personalizada com IA
}
```

**2. Implementar fluxo de conversação (1h)**
```typescript
async handleConversation(userId: string, message: string) {
  // 1. Buscar contexto da conversa (últimas 5 msgs)
  // 2. Classificar intent
  // 3. Gerar resposta
  // 4. Salvar histórico
  // 5. Enviar resposta
}
```

**3. Adicionar comandos especiais (30min)**
- `/falar_com_humano` - Transferir para atendente
- `/status` - Ver status de pedido/suporte
- `/ajuda` - Menu de opções

---

#### **Task 3.4: Adicionar Grok AI como 3º provedor**
**Tempo:** 1-2h  
**Prioridade:** BAIXA  
**Arquivos:** `server/services/ai.ts`

**O que fazer:**

**1. Implementar integração Grok (1h)**
```typescript
// server/services/ai.ts - Adicionar
private async generateGrokCompletion(request: AiRequest): Promise<AiResponse> {
  // API da xAI (Grok)
  // Similar ao OpenAI
}
```

**2. Adicionar ao fallback chain (30min)**
- Ordem: Anthropic → OpenAI → Grok

**3. Configurar no .env (5min)**
```
GROK_API_KEY=seu_key_aqui
```

**Status:** Aguardar acesso à API do Grok (beta fechado)

---

### **FASE 4: LIMPEZA E ORGANIZAÇÃO** (3-4h) 🧹

---

#### **Task 4.1: Remover código não usado**
**Tempo:** 1h  
**Prioridade:** MÉDIA

**O que fazer:**
1. Remover tabelas ML (ml_models, ml_predictions) se não usadas
2. Remover páginas de teste do frontend
3. Remover arquivos DEPRECATED_*
4. Limpar imports não usados

---

#### **Task 4.2: Documentar APIs**
**Tempo:** 2h  
**Prioridade:** BAIXA

**O que fazer:**
1. Criar `API.md` com todos os endpoints
2. Exemplos de request/response
3. Códigos de erro

---

#### **Task 4.3: Separar rotas Admin vs Marketing**
**Tempo:** 1h  
**Prioridade:** MÉDIA

**O que fazer:**
1. Mover rotas admin para `/api/admin/*`
2. Mover rotas marketing para `/api/marketing/*`
3. Adicionar guards de autorização

---

## 📅 CRONOGRAMA SUGERIDO

### **Semana 1: Fundação (13-15h)**
- ✅ Fase 0: Correções Críticas (1h)
- ✅ Task 1.1: Facebook Publicação (2h)
- ✅ Task 1.2: Instagram Posts/Stories (3h)
- ✅ Task 1.5: WhatsApp Base (3h)
- ✅ Task 3.1: Worker Posts Agendados (2h)
- ✅ Task 3.3: WhatsApp Bot (3h)

### **Semana 2: Integrações (10-12h)**
- ✅ Task 1.3: YouTube Upload (3h)
- ✅ Task 1.4: Twitter/X (2h)
- ✅ Task 2.1: Google Analytics (2h)
- ✅ Task 2.2: Google Ads (3h)
- ✅ Task 3.2: Blog WordPress (3h)

### **Semana 3: Finalização (5-7h)**
- ✅ Task 3.4: Grok AI (2h)
- ✅ Fase 4: Limpeza (4h)
- ✅ Testes finais (1h)

**Total: 28-34 horas**

---

## 🎯 MVP MÍNIMO PARA LANÇAR

Se precisar lançar RÁPIDO, fazer APENAS:

### **MVP Crítico (8-10h):**
1. ✅ Task 0.1: Fix username (15min)
2. ✅ Task 1.1: Facebook publicação (2h)
3. ✅ Task 1.2: Instagram posts (2h)
4. ✅ Task 1.5: WhatsApp envio (2h)
5. ✅ Task 3.1: Worker agendados (2h)
6. ✅ Task 3.3: WhatsApp bot básico (2h)

**Com isso você tem:**
- ✅ Facebook e Instagram funcionando
- ✅ WhatsApp bot respondendo
- ✅ Posts agendados executando automaticamente
- ✅ Blog automation já funciona

---

## 🚨 IMPORTANTE - ANTES DE CADA TASK

**SEMPRE FAZER:**

1. ✅ Ler o plano da task completamente
2. ✅ Buscar no código se já existe algo relacionado
3. ✅ Verificar dependências instaladas
4. ✅ Executar
5. ✅ Testar completamente
6. ✅ Marcar como concluído
7. ✅ Próxima task

**NÃO DUPLICAR CÓDIGO!**

---

## 📊 DEPENDÊNCIAS NOVAS NECESSÁRIAS

```json
{
  "googleapis": "^118.0.0",
  "@google-analytics/data": "^4.0.0",
  "google-ads-api": "^13.0.0",
  "twitter-api-v2": "^1.15.0",
  "node-cron": "^3.0.3",
  "whatsapp-web.js": "^1.23.0"
}
```

---

**Fim do Plano de Ação - Pronto para Execução! 🚀**

