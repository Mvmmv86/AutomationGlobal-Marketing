# 🚀 PLANO DE AÇÃO COMPLETO - INTEGRAÇÃO META ADS + DASHBOARD DE MÉTRICAS

**Versão:** 1.0
**Data:** 19 de Novembro de 2025
**API Version:** Meta Marketing API v24.0
**Objetivo:** Implementação completa de criação de campanhas Meta Ads + Dashboard com todas as métricas disponíveis

---

## 📋 ÍNDICE

1. [Contexto e Descobertas](#contexto)
2. [Arquitetura da Solução](#arquitetura)
3. [FASE 1: OAuth e Configuração](#fase-1)
4. [FASE 2: Meta Ads Manager Integration](#fase-2)
5. [FASE 3: Dashboard de Métricas](#fase-3)
6. [FASE 4: Testes e Validação](#fase-4)
7. [Métricas Disponíveis Meta 2025](#metricas)
8. [Mudanças Críticas API v24.0](#mudancas)
9. [Cronograma e Esforço](#cronograma)

---

## 🔍 1. CONTEXTO E DESCOBERTAS {#contexto}

### ✅ O Que Já Temos (95% Pronto)

**Backend Completo:**
- ✅ OAuth Service (`server/services/social/oauth-service.ts`) - 434 linhas
- ✅ Facebook Service (`server/services/social/facebook-service.ts`) - 605 linhas
- ✅ Instagram Service (`server/services/social/instagram-service.ts`) - 735 linhas
- ✅ Token Encryption (AES-256-GCM)
- ✅ Rotas de autenticação (`/api/social/auth/*`)
- ✅ Publicação de posts, stories, reels
- ✅ Coleta de métricas básicas

**Banco de Dados:**
- ✅ Tabela `social_accounts` com tokens criptografados
- ✅ Tabela `social_posts` com agendamento
- ✅ Tabela `social_metrics` para coleta
- ✅ Tabela `social_sync_logs` para rastreamento

**Credenciais Configuradas:**
- ✅ `FACEBOOK_APP_ID=1277186293202053`
- ✅ `FACEBOOK_APP_SECRET=68ecc6859c1c2abcdd805e39b423e1e6`
- ✅ `INSTAGRAM_CLIENT_ID=1284617896404308`

### ❌ O Que Falta (5%)

1. **Meta Ads Manager API Integration** (NÃO EXISTE)
   - Criação de campanhas via Marketing API
   - Obter/configurar Ad Account ID
   - Criar Ad Sets (conjuntos de anúncios)
   - Criar Ads (anúncios)

2. **Dashboard Avançado de Métricas** (BÁSICO)
   - Métricas completas da Marketing API
   - Gráficos interativos
   - Comparação entre campanhas
   - Breakdown por demografia

3. **System User Tokens** (NÃO CONFIGURADO)
   - Tokens de longa duração para produção
   - Renovação automática

---

## 🏗️ 2. ARQUITETURA DA SOLUÇÃO {#arquitetura}

### Fluxo Completo E2E

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. AUTENTICAÇÃO (OAuth)                       │
├─────────────────────────────────────────────────────────────────┤
│ Home → Conectar FB/IG → OAuth Meta → Token → Salvar Conta       │
│                                                                  │
│ Frontend:                                                        │
│ - ConnectSocialModal.tsx                                         │
│ - SocialMediaCallback.tsx (recebe callback)                     │
│                                                                  │
│ Backend:                                                         │
│ - /api/social/auth/facebook/connect                             │
│ - /api/social/auth/facebook/callback                            │
│ - /api/social/auth/facebook/save-account                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              2. OBTER AD ACCOUNT ID (NOVO)                       │
├─────────────────────────────────────────────────────────────────┤
│ Após salvar conta → Buscar Ad Accounts → Salvar Ad Account ID   │
│                                                                  │
│ Backend:                                                         │
│ - GET /me/adaccounts (via Graph API)                            │
│ - Salvar em social_accounts.metadata.ad_account_id              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           3. CRIAR CAMPANHA (Meta Marketing API)                 │
├─────────────────────────────────────────────────────────────────┤
│ Campanhas → Nova Campanha → Wizard 3 Passos → Criar via API     │
│                                                                  │
│ Frontend:                                                        │
│ - MetaAdsWizard.tsx (já existe)                                 │
│                                                                  │
│ Backend (NOVO):                                                  │
│ - POST /api/meta-ads/campaigns/create                           │
│   ├─ Passo 1: Criar Campaign                                    │
│   ├─ Passo 2: Criar Ad Set                                      │
│   ├─ Passo 3: Criar Ad Creative                                 │
│   └─ Passo 4: Criar Ad                                          │
│                                                                  │
│ Service (NOVO):                                                  │
│ - server/services/meta-ads/meta-ads-service.ts                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              4. COLETAR MÉTRICAS (Marketing API)                 │
├─────────────────────────────────────────────────────────────────┤
│ Worker → A cada 1h → Coletar Insights → Salvar no Banco         │
│                                                                  │
│ Backend:                                                         │
│ - GET /act_{ad_account_id}/insights                             │
│ - GET /{campaign_id}/insights                                   │
│ - GET /{adset_id}/insights                                      │
│ - GET /{ad_id}/insights                                         │
│                                                                  │
│ Métricas:                                                        │
│ - impressions, clicks, spend, conversions                       │
│ - ctr, cpc, cpm, roas, frequency                                │
│ - reach, engagement, video_views                                │
│ - Breakdown: age, gender, country, placement                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                5. DASHBOARD DE MÉTRICAS                          │
├─────────────────────────────────────────────────────────────────┤
│ Dashboard → Visualizar Métricas → Gráficos Interativos          │
│                                                                  │
│ Frontend (NOVO):                                                 │
│ - pages/MetaAdsDashboard.tsx                                    │
│ - components/meta-ads/CampaignMetricsCard.tsx                   │
│ - components/meta-ads/PerformanceChart.tsx                      │
│ - components/meta-ads/DemographicsBreakdown.tsx                 │
│                                                                  │
│ Backend:                                                         │
│ - GET /api/meta-ads/campaigns                                   │
│ - GET /api/meta-ads/campaigns/{id}/insights                     │
│ - GET /api/meta-ads/campaigns/{id}/demographics                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 3. FASE 1: OAuth e Configuração Ad Account {#fase-1}

### 📝 Objetivos

1. ✅ Verificar OAuth existente funcionando
2. 🆕 Obter Ad Account ID após conectar
3. 🆕 Salvar Ad Account ID no banco
4. 🆕 Criar página de callback atualizada

### 📂 Arquivos a Criar/Modificar

#### 1.1 Verificar Página de Callback OAuth

**Arquivo:** `client/src/pages/SocialMediaCallback.tsx`

**Status:** Verificar se existe e se está atualizada

**Implementação Necessária:**

```typescript
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SocialMediaCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando sua conta...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse query params
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');
        const accountsParam = params.get('accounts');

        if (error) {
          throw new Error(error);
        }

        if (success === 'facebook-connected' && accountsParam) {
          const accounts = JSON.parse(decodeURIComponent(accountsParam));

          setMessage(`Salvando ${accounts.length} conta(s)...`);

          // Salvar cada conta
          for (const account of accounts) {
            if (account.type === 'facebook') {
              await fetch('/api/social/auth/facebook/save-account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  organizationId: localStorage.getItem('organizationId'),
                  pageId: account.id,
                  pageName: account.name,
                  pageAccessToken: account.access_token
                })
              });
            } else if (account.type === 'instagram') {
              await fetch('/api/social/auth/instagram/save-account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  organizationId: localStorage.getItem('organizationId'),
                  igUserId: account.id,
                  igUsername: account.username,
                  pageAccessToken: account.page_access_token,
                  pageId: account.page_id
                })
              });
            }
          }

          setStatus('success');
          setMessage('Contas conectadas com sucesso!');

          toast({
            title: 'Sucesso!',
            description: `${accounts.length} conta(s) conectada(s) com sucesso.`,
          });

          // Redirecionar para dashboard após 2s
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        } else {
          throw new Error('Resposta inválida do servidor');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Erro ao conectar conta');

        toast({
          title: 'Erro',
          description: err.message || 'Erro ao conectar conta',
          variant: 'destructive'
        });

        // Redirecionar para dashboard após 3s
        setTimeout(() => {
          setLocation('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="glass-3d p-8 rounded-2xl max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Processando...</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Erro</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

#### 1.2 Adicionar Busca de Ad Account ID

**Arquivo NOVO:** `server/services/social/ad-account-service.ts`

```typescript
import { db } from '@/db';
import { socialAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { tokenEncryption } from './token-encryption';

interface AdAccount {
  id: string; // act_123456789
  accountId: string; // 123456789
  name: string;
  currency: string;
  timezone: string;
  accountStatus: number;
}

export class AdAccountService {
  /**
   * Buscar Ad Accounts do usuário via Graph API
   */
  async getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v24.0/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      return data.data.map((acc: any) => ({
        id: acc.id, // act_123456789
        accountId: acc.account_id, // 123456789
        name: acc.name,
        currency: acc.currency,
        timezone: acc.timezone_name,
        accountStatus: acc.account_status
      }));
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  /**
   * Salvar Ad Account ID no banco (metadata da conta social)
   */
  async saveAdAccountId(
    socialAccountId: string,
    adAccountId: string,
    adAccountName: string
  ): Promise<void> {
    try {
      // Buscar conta atual
      const [account] = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.id, socialAccountId))
        .limit(1);

      if (!account) {
        throw new Error('Social account not found');
      }

      // Atualizar metadata
      const updatedMetadata = {
        ...(account.metadata || {}),
        ad_account_id: adAccountId,
        ad_account_name: adAccountName,
        ad_account_updated_at: new Date().toISOString()
      };

      await db
        .update(socialAccounts)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(eq(socialAccounts.id, socialAccountId));

      console.log(`✅ Ad Account ${adAccountId} saved to social account ${socialAccountId}`);
    } catch (error) {
      console.error('Error saving ad account ID:', error);
      throw error;
    }
  }

  /**
   * Obter Ad Account ID de uma conta social
   */
  async getAdAccountId(socialAccountId: string): Promise<string | null> {
    try {
      const [account] = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.id, socialAccountId))
        .limit(1);

      if (!account || !account.metadata) {
        return null;
      }

      return (account.metadata as any).ad_account_id || null;
    } catch (error) {
      console.error('Error getting ad account ID:', error);
      return null;
    }
  }
}

export const adAccountService = new AdAccountService();
```

#### 1.3 Nova Rota para Selecionar Ad Account

**Arquivo:** `server/routes/social/social-auth.ts` (adicionar)

```typescript
// Adicionar no final do arquivo, antes do export default router

/**
 * POST /api/social/auth/facebook/select-ad-account
 * Selecionar Ad Account para usar em campanhas
 */
router.post('/facebook/select-ad-account', requireAuth, async (req, res) => {
  try {
    const { socialAccountId, adAccountId, adAccountName } = req.body;

    if (!socialAccountId || !adAccountId) {
      return res.status(400).json({
        success: false,
        message: 'socialAccountId and adAccountId are required'
      });
    }

    await adAccountService.saveAdAccountId(
      socialAccountId,
      adAccountId,
      adAccountName
    );

    res.json({
      success: true,
      message: 'Ad Account saved successfully'
    });
  } catch (error: any) {
    console.error('Error selecting ad account:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save ad account'
    });
  }
});
```

### ✅ Checklist FASE 1

- [ ] Verificar `SocialMediaCallback.tsx` existe e funciona
- [ ] Criar `ad-account-service.ts`
- [ ] Adicionar rota `/select-ad-account`
- [ ] Testar OAuth flow completo
- [ ] Verificar Ad Account ID sendo salvo

### ⏱️ Tempo Estimado: 2 horas

---

## 🎯 4. FASE 2: Meta Ads Manager Integration {#fase-2}

### 📝 Objetivos

1. Criar serviço Meta Ads Marketing API v24.0
2. Implementar criação de campanhas (Campaign)
3. Implementar criação de Ad Sets (targeting + orçamento)
4. Implementar criação de Ads (criativos)
5. Integrar com wizard frontend

### 🚨 MUDANÇAS CRÍTICAS API v24.0 (2025)

Baseado na pesquisa da documentação oficial:

**1. Advantage+ Migration (CRÍTICO)**
- ✅ A partir de v24.0 (08/10/2025), **NÃO é mais possível criar** ASC (Advantage Shopping Campaigns) e AAC (Advantage App Campaigns) via API legacy
- ✅ Precisamos usar a **estrutura Advantage+** nova
- ⚠️ Em v25.0 (Q1 2026), será **proibido completamente** em todas as versões

**2. Placement Spending Update**
- ✅ API v24.0 permite até **5% de gasto em placements excluídos**
- ✅ Melhora performance para objetivos Sales e Leads

**3. Dynamic Media Default**
- ✅ Campo `media_type_automation` agora tem default **OPT_IN**
- ✅ Implementado desde 01/09/2025, enforcement completo em 20/10/2025

**4. Targeting Consolidations**
- ⚠️ Certas opções de targeting foram consolidadas desde 08/10/2025
- ⚠️ Campanhas antigas rodam até 06/01/2026

**5. Deprecations**
- ❌ Facebook video feeds ad placement (descontinuado)
- ❌ Click to Messenger Lead Gen Ads (deprecated)

### 📂 Arquivo NOVO: Meta Ads Service

**Arquivo:** `server/services/meta-ads/meta-ads-service.ts`

```typescript
import { db } from '@/db';
import { socialAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { tokenEncryption } from '../social/token-encryption';
import { adAccountService } from '../social/ad-account-service';

interface CreateCampaignParams {
  socialAccountId: string;
  name: string;
  objective: 'OUTCOME_SALES' | 'OUTCOME_LEADS' | 'OUTCOME_AWARENESS' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_TRAFFIC' | 'OUTCOME_APP_PROMOTION';
  status?: 'ACTIVE' | 'PAUSED';
  special_ad_categories?: string[];
  budget_optimization?: 'CAMPAIGN_BUDGET_OPTIMIZATION'; // CBO
}

interface CreateAdSetParams {
  campaignId: string;
  name: string;
  targeting: {
    geoLocations?: {
      countries?: string[];
      regions?: Array<{ key: string }>;
      cities?: Array<{ key: string }>;
    };
    ageMin?: number;
    ageMax?: number;
    genders?: number[]; // 1=male, 2=female
    interests?: Array<{ id: string; name?: string }>;
    flexibleSpec?: any;
  };
  optimizationGoal: string;
  billingEvent: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT';
  bidAmount?: number;
  dailyBudget: number; // em centavos (R$ 20.00 = 2000)
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  status?: 'ACTIVE' | 'PAUSED';
}

interface CreateAdCreativeParams {
  name: string;
  objectStorySpec: {
    pageId: string;
    linkData?: {
      link: string;
      message?: string;
      name?: string;
      description?: string;
      picture?: string;
      callToAction?: {
        type: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'DOWNLOAD' | 'CONTACT_US' | 'BOOK_NOW';
        value?: { link: string };
      };
    };
    videoData?: {
      videoId: string;
      message?: string;
      callToAction?: any;
    };
  };
}

interface CreateAdParams {
  adSetId: string;
  name: string;
  creative: CreateAdCreativeParams;
  status?: 'ACTIVE' | 'PAUSED';
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  createdTime: string;
  updatedTime: string;
}

interface AdSet {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  dailyBudget: number;
  targeting: any;
  optimizationGoal: string;
}

interface Ad {
  id: string;
  name: string;
  adSetId: string;
  status: string;
  creative: any;
}

export class MetaAdsService {
  private baseUrl = 'https://graph.facebook.com/v24.0';

  /**
   * Obter access token e ad account ID de uma conta social
   */
  private async getCredentials(socialAccountId: string): Promise<{ accessToken: string; adAccountId: string }> {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, socialAccountId))
      .limit(1);

    if (!account) {
      throw new Error('Social account not found');
    }

    // Descriptografar token
    const accessToken = tokenEncryption.decrypt(account.accessToken);

    // Obter ad account ID do metadata
    const adAccountId = await adAccountService.getAdAccountId(socialAccountId);

    if (!adAccountId) {
      throw new Error('Ad Account ID not configured. Please select an Ad Account first.');
    }

    return { accessToken, adAccountId };
  }

  /**
   * 1. CRIAR CAMPANHA (Campaign)
   * Docs: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign
   */
  async createCampaign(params: CreateCampaignParams): Promise<Campaign> {
    try {
      const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

      // Validar objetivo (v24.0 usa OUTCOME_*)
      const validObjectives = [
        'OUTCOME_SALES',
        'OUTCOME_LEADS',
        'OUTCOME_AWARENESS',
        'OUTCOME_ENGAGEMENT',
        'OUTCOME_TRAFFIC',
        'OUTCOME_APP_PROMOTION'
      ];

      if (!validObjectives.includes(params.objective)) {
        throw new Error(`Invalid objective. Must be one of: ${validObjectives.join(', ')}`);
      }

      const body = {
        name: params.name,
        objective: params.objective,
        status: params.status || 'PAUSED', // Sempre criar pausada por segurança
        special_ad_categories: params.special_ad_categories || [],
        access_token: accessToken
      };

      // Se usar CBO (Campaign Budget Optimization)
      if (params.budget_optimization) {
        (body as any).bid_strategy = params.budget_optimization;
      }

      const response = await fetch(`${this.baseUrl}/${adAccountId}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || JSON.stringify(error)}`);
      }

      const data = await response.json();

      console.log(`✅ Campaign created: ${data.id}`);

      // Buscar detalhes completos da campanha
      return this.getCampaignDetails(params.socialAccountId, data.id);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * 2. CRIAR AD SET (Targeting + Orçamento)
   * Docs: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/adsets
   */
  async createAdSet(socialAccountId: string, params: CreateAdSetParams): Promise<AdSet> {
    try {
      const { accessToken, adAccountId } = await this.getCredentials(socialAccountId);

      // Targeting simplificado baseado no wizard
      const targeting: any = {
        targeting_optimization: 'expansion_all' // Permite IA da Meta otimizar
      };

      // Localizações
      if (params.targeting.geoLocations) {
        targeting.geo_locations = params.targeting.geoLocations;
      } else {
        // Default: Brasil inteiro
        targeting.geo_locations = {
          countries: ['BR']
        };
      }

      // Idade
      if (params.targeting.ageMin) targeting.age_min = params.targeting.ageMin;
      if (params.targeting.ageMax) targeting.age_max = params.targeting.ageMax;

      // Gênero
      if (params.targeting.genders && params.targeting.genders.length > 0) {
        targeting.genders = params.targeting.genders;
      }

      // Interesses
      if (params.targeting.interests && params.targeting.interests.length > 0) {
        targeting.interests = params.targeting.interests;
      }

      // Flexible Spec (targeting avançado)
      if (params.targeting.flexibleSpec) {
        targeting.flexible_spec = params.targeting.flexibleSpec;
      }

      const body = {
        name: params.name,
        campaign_id: params.campaignId,
        targeting: targeting,
        optimization_goal: params.optimizationGoal,
        billing_event: params.billingEvent,
        daily_budget: params.dailyBudget, // em centavos
        status: params.status || 'PAUSED',
        access_token: accessToken
      };

      // Bid amount (opcional)
      if (params.bidAmount) {
        (body as any).bid_amount = params.bidAmount;
      }

      // Datas de início/fim
      if (params.startTime) (body as any).start_time = params.startTime;
      if (params.endTime) (body as any).end_time = params.endTime;

      const response = await fetch(`${this.baseUrl}/${adAccountId}/adsets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || JSON.stringify(error)}`);
      }

      const data = await response.json();

      console.log(`✅ Ad Set created: ${data.id}`);

      return {
        id: data.id,
        name: params.name,
        campaignId: params.campaignId,
        status: params.status || 'PAUSED',
        dailyBudget: params.dailyBudget,
        targeting: targeting,
        optimizationGoal: params.optimizationGoal
      };
    } catch (error) {
      console.error('Error creating ad set:', error);
      throw error;
    }
  }

  /**
   * 3. CRIAR AD CREATIVE (Criativo do Anúncio)
   * Docs: https://developers.facebook.com/docs/marketing-api/reference/ad-creative
   */
  async createAdCreative(socialAccountId: string, params: CreateAdCreativeParams): Promise<{ id: string }> {
    try {
      const { accessToken, adAccountId } = await this.getCredentials(socialAccountId);

      const body = {
        name: params.name,
        object_story_spec: params.objectStorySpec,
        access_token: accessToken
      };

      const response = await fetch(`${this.baseUrl}/${adAccountId}/adcreatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || JSON.stringify(error)}`);
      }

      const data = await response.json();

      console.log(`✅ Ad Creative created: ${data.id}`);

      return { id: data.id };
    } catch (error) {
      console.error('Error creating ad creative:', error);
      throw error;
    }
  }

  /**
   * 4. CRIAR AD (Anúncio Final)
   * Docs: https://developers.facebook.com/docs/marketing-api/reference/adgroup
   */
  async createAd(socialAccountId: string, params: CreateAdParams): Promise<Ad> {
    try {
      const { accessToken, adAccountId } = await this.getCredentials(socialAccountId);

      // Primeiro criar o creative
      const creative = await this.createAdCreative(socialAccountId, params.creative);

      // Depois criar o ad
      const body = {
        name: params.name,
        adset_id: params.adSetId,
        creative: { creative_id: creative.id },
        status: params.status || 'PAUSED',
        access_token: accessToken
      };

      const response = await fetch(`${this.baseUrl}/${adAccountId}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || JSON.stringify(error)}`);
      }

      const data = await response.json();

      console.log(`✅ Ad created: ${data.id}`);

      return {
        id: data.id,
        name: params.name,
        adSetId: params.adSetId,
        status: params.status || 'PAUSED',
        creative: creative
      };
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  }

  /**
   * MÉTODO COMPLETO: Criar campanha + ad set + ad (tudo de uma vez)
   */
  async createFullCampaign(params: {
    socialAccountId: string;
    campaignName: string;
    objective: CreateCampaignParams['objective'];
    adSetName: string;
    targeting: CreateAdSetParams['targeting'];
    dailyBudget: number;
    duration: number; // dias
    adName: string;
    adCreative: CreateAdCreativeParams;
  }): Promise<{ campaign: Campaign; adSet: AdSet; ad: Ad }> {
    try {
      console.log(`🚀 Starting full campaign creation: ${params.campaignName}`);

      // 1. Criar Campaign
      const campaign = await this.createCampaign({
        socialAccountId: params.socialAccountId,
        name: params.campaignName,
        objective: params.objective,
        status: 'PAUSED' // Sempre criar pausada
      });

      // 2. Calcular datas
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + params.duration * 24 * 60 * 60 * 1000).toISOString();

      // 3. Mapear objetivo para optimization goal
      const optimizationGoalMap: Record<string, string> = {
        'OUTCOME_SALES': 'OFFSITE_CONVERSIONS',
        'OUTCOME_LEADS': 'LEAD_GENERATION',
        'OUTCOME_AWARENESS': 'REACH',
        'OUTCOME_ENGAGEMENT': 'POST_ENGAGEMENT',
        'OUTCOME_TRAFFIC': 'LINK_CLICKS',
        'OUTCOME_APP_PROMOTION': 'APP_INSTALLS'
      };

      // 4. Criar Ad Set
      const adSet = await this.createAdSet(params.socialAccountId, {
        campaignId: campaign.id,
        name: params.adSetName,
        targeting: params.targeting,
        optimizationGoal: optimizationGoalMap[params.objective] || 'LINK_CLICKS',
        billingEvent: 'IMPRESSIONS',
        dailyBudget: params.dailyBudget * 100, // Converter para centavos
        startTime,
        endTime,
        status: 'PAUSED'
      });

      // 5. Criar Ad
      const ad = await this.createAd(params.socialAccountId, {
        adSetId: adSet.id,
        name: params.adName,
        creative: params.adCreative,
        status: 'PAUSED'
      });

      console.log(`✅ Full campaign created successfully!`);
      console.log(`   Campaign ID: ${campaign.id}`);
      console.log(`   Ad Set ID: ${adSet.id}`);
      console.log(`   Ad ID: ${ad.id}`);

      return { campaign, adSet, ad };
    } catch (error) {
      console.error('Error creating full campaign:', error);
      throw error;
    }
  }

  /**
   * OBTER DETALHES DA CAMPANHA
   */
  async getCampaignDetails(socialAccountId: string, campaignId: string): Promise<Campaign> {
    try {
      const { accessToken } = await this.getCredentials(socialAccountId);

      const response = await fetch(
        `${this.baseUrl}/${campaignId}?fields=id,name,objective,status,created_time,updated_time&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        objective: data.objective,
        status: data.status,
        createdTime: data.created_time,
        updatedTime: data.updated_time
      };
    } catch (error) {
      console.error('Error getting campaign details:', error);
      throw error;
    }
  }

  /**
   * LISTAR CAMPANHAS
   */
  async listCampaigns(socialAccountId: string, limit: number = 100): Promise<Campaign[]> {
    try {
      const { accessToken, adAccountId } = await this.getCredentials(socialAccountId);

      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,objective,status,created_time,updated_time&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      return data.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        objective: c.objective,
        status: c.status,
        createdTime: c.created_time,
        updatedTime: c.updated_time
      }));
    } catch (error) {
      console.error('Error listing campaigns:', error);
      throw error;
    }
  }
}

export const metaAdsService = new MetaAdsService();
```

### 📂 Arquivo NOVO: Rotas Meta Ads

**Arquivo:** `server/routes/meta-ads/meta-ads-routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '@/middleware/auth-unified';
import { metaAdsService } from '@/services/meta-ads/meta-ads-service';

const router = Router();

/**
 * POST /api/meta-ads/campaigns/create
 * Criar campanha completa (campaign + ad set + ad)
 */
router.post('/campaigns/create', requireAuth, async (req, res) => {
  try {
    const {
      socialAccountId,
      objective,
      targeting,
      budget,
      duration,
      pageId
    } = req.body;

    // Validações
    if (!socialAccountId || !objective || !budget || !duration || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Criar campanha completa
    const result = await metaAdsService.createFullCampaign({
      socialAccountId,
      campaignName: `Campaign - ${new Date().toLocaleDateString('pt-BR')}`,
      objective,
      adSetName: `Ad Set - ${objective}`,
      targeting,
      dailyBudget: budget,
      duration,
      adName: `Ad - ${new Date().toLocaleDateString('pt-BR')}`,
      adCreative: {
        name: `Creative - ${new Date().toLocaleDateString('pt-BR')}`,
        objectStorySpec: {
          pageId: pageId,
          linkData: {
            link: 'https://example.com', // TODO: Pegar do wizard
            message: 'Check out our amazing product!', // TODO: Pegar do wizard
            name: 'Limited Time Offer',
            description: 'Don\'t miss out on this incredible deal!',
            callToAction: {
              type: 'LEARN_MORE',
              value: { link: 'https://example.com' }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create campaign'
    });
  }
});

/**
 * GET /api/meta-ads/campaigns
 * Listar campanhas
 */
router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const { socialAccountId } = req.query;

    if (!socialAccountId || typeof socialAccountId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'socialAccountId is required'
      });
    }

    const campaigns = await metaAdsService.listCampaigns(socialAccountId);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error: any) {
    console.error('Error listing campaigns:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list campaigns'
    });
  }
});

/**
 * GET /api/meta-ads/campaigns/:id
 * Obter detalhes de uma campanha
 */
router.get('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { socialAccountId } = req.query;

    if (!socialAccountId || typeof socialAccountId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'socialAccountId is required'
      });
    }

    const campaign = await metaAdsService.getCampaignDetails(socialAccountId, id);

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    console.error('Error getting campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get campaign'
    });
  }
});

export default router;
```

### 📂 Registrar Rotas

**Arquivo:** `server/routes.ts` (adicionar)

```typescript
// Adicionar no topo
import metaAdsRoutes from "./routes/meta-ads/meta-ads-routes";

// Adicionar depois das outras rotas social
app.use('/api/meta-ads', metaAdsRoutes);
console.log('✅ Meta Ads routes registered at /api/meta-ads');
```

### 📂 Integrar com Frontend (MetaAdsWizard)

**Arquivo:** `client/src/components/campaigns/wizards/MetaAdsWizard.tsx`

Substituir o `handleCreate()`:

```typescript
const handleCreate = async () => {
  try {
    setIsCreating(true);

    // Preparar targeting baseado no público selecionado
    let targeting: any = {};

    if (selectedAudience === 'broad') {
      // Público amplo - Brasil inteiro, todas idades/gêneros
      targeting = {
        geoLocations: { countries: ['BR'] }
      };
    } else if (selectedAudience === 'local') {
      // TODO: Adicionar seletor de localização no wizard
      targeting = {
        geoLocations: {
          countries: ['BR'],
          cities: [{ key: '2417347' }] // São Paulo (exemplo)
        }
      };
    } else if (selectedAudience === 'interests') {
      // TODO: Adicionar seletor de interesses no wizard
      targeting = {
        geoLocations: { countries: ['BR'] },
        interests: [
          { id: '6003107902433', name: 'E-commerce' }
        ]
      };
    } else if (selectedAudience === 'lookalike') {
      // TODO: Implementar lookalike audiences
      targeting = {
        geoLocations: { countries: ['BR'] }
      };
    }

    // Fazer request para criar campanha
    const response = await fetch('/api/meta-ads/campaigns/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        socialAccountId: selectedSocialAccountId, // TODO: Pegar do contexto
        objective: selectedObjective,
        targeting,
        budget,
        duration,
        pageId: pageId // TODO: Pegar do contexto
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar campanha');
    }

    const result = await response.json();

    toast({
      title: 'Campanha criada com sucesso!',
      description: `ID: ${result.data.campaign.id}`
    });

    onClose();
  } catch (error: any) {
    toast({
      title: 'Erro ao criar campanha',
      description: error.message,
      variant: 'destructive'
    });
  } finally {
    setIsCreating(false);
  }
};
```

### ✅ Checklist FASE 2

- [ ] Criar `meta-ads-service.ts`
- [ ] Criar `meta-ads-routes.ts`
- [ ] Registrar rotas em `routes.ts`
- [ ] Atualizar `MetaAdsWizard.tsx` com integração
- [ ] Testar criação de campanha real
- [ ] Verificar campanha no Meta Ads Manager

### ⏱️ Tempo Estimado: 6 horas

---

## 🎯 5. FASE 3: Dashboard de Métricas {#fase-3}

### 📝 Objetivos

1. Coletar métricas via Insights API
2. Salvar métricas no banco
3. Criar componentes dashboard
4. Implementar gráficos interativos
5. Breakdown por demografia

### 📊 MÉTRICAS DISPONÍVEIS META 2025 {#metricas}

Baseado na pesquisa oficial:

#### Métricas Principais (Account/Campaign/AdSet/Ad Level)

**Performance Básica:**
- `impressions` - Total de impressões
- `reach` - Alcance único
- `frequency` - Frequência média
- `clicks` - Cliques totais
- `ctr` - Click-through rate (%)
- `spend` - Gasto total (R$)

**Engagement:**
- `post_reactions` - Reações (curtidas, amor, etc)
- `post_comments` - Comentários
- `post_shares` - Compartilhamentos
- `post_saves` - Salvamentos

**Conversões:**
- `conversions` - Conversões totais
- `conversion_values` - Valor das conversões (R$)
- `cost_per_conversion` - Custo por conversão
- `roas` - Return on ad spend

**Vídeo (se aplicável):**
- `video_views` - Visualizações
- `video_avg_time_watched` - Tempo médio assistido
- `video_p25_watched` - 25% assistido
- `video_p50_watched` - 50% assistido
- `video_p75_watched` - 75% assistido
- `video_p100_watched` - 100% assistido

**Custos:**
- `cpc` - Cost per click
- `cpm` - Cost per mille (1000 impressões)
- `cpp` - Cost per post engagement

#### Breakdowns Disponíveis

**Demografia:**
- `age` - Faixa etária (18-24, 25-34, 35-44, etc)
- `gender` - Gênero (male, female, unknown)
- `age_gender` - Combinação idade + gênero

**Localização:**
- `country` - País
- `region` - Estado/Região
- `dma` - Área metropolitana
- `city` - Cidade

**Dispositivo:**
- `device_platform` - Plataforma (mobile, desktop, unknown)
- `platform_position` - Posição (feed, story, reels, etc)
- `publisher_platform` - Plataforma publisher (facebook, instagram, etc)

**Tempo:**
- `hourly_stats_aggregated_by_advertiser_time_zone`
- `hourly_stats_aggregated_by_audience_time_zone`

### 📂 Arquivo NOVO: Meta Insights Service

**Arquivo:** `server/services/meta-ads/meta-insights-service.ts`

```typescript
import { db } from '@/db';
import { socialMetrics } from '@shared/schema';
import { metaAdsService } from './meta-ads-service';

interface InsightsParams {
  level: 'account' | 'campaign' | 'adset' | 'ad';
  objectId: string; // act_123456, campaign_id, adset_id, ad_id
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'lifetime';
  timeRange?: {
    since: string; // YYYY-MM-DD
    until: string; // YYYY-MM-DD
  };
  fields?: string[]; // Métricas específicas
  breakdowns?: string[]; // age, gender, country, etc
}

interface Insights {
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  cost_per_conversion?: number;
  roas?: number;
  // Demographics breakdown
  age_gender_breakdown?: Array<{
    age: string;
    gender: string;
    impressions: number;
    clicks: number;
    spend: number;
  }>;
  // Location breakdown
  country_breakdown?: Array<{
    country: string;
    impressions: number;
    clicks: number;
    spend: number;
  }>;
}

export class MetaInsightsService {
  private baseUrl = 'https://graph.facebook.com/v24.0';

  /**
   * Buscar Insights da Meta Marketing API
   */
  async getInsights(socialAccountId: string, params: InsightsParams): Promise<Insights> {
    try {
      const { accessToken } = await (metaAdsService as any).getCredentials(socialAccountId);

      // Campos padrão
      const defaultFields = [
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'spend',
        'cpc',
        'cpm',
        'actions', // Para conversões
        'cost_per_action_type',
        'action_values' // Para ROAS
      ];

      const fields = params.fields || defaultFields;

      // Construir query params
      const queryParams = new URLSearchParams({
        level: params.level,
        fields: fields.join(','),
        access_token: accessToken
      });

      // Date preset ou time range
      if (params.datePreset) {
        queryParams.append('date_preset', params.datePreset);
      } else if (params.timeRange) {
        queryParams.append('time_range', JSON.stringify(params.timeRange));
      } else {
        queryParams.append('date_preset', 'last_7d'); // Default
      }

      // Breakdowns
      if (params.breakdowns && params.breakdowns.length > 0) {
        queryParams.append('breakdowns', params.breakdowns.join(','));
      }

      const response = await fetch(
        `${this.baseUrl}/${params.objectId}/insights?${queryParams.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Processar resposta
      if (!data.data || data.data.length === 0) {
        // Sem dados
        return {
          impressions: 0,
          reach: 0,
          frequency: 0,
          clicks: 0,
          ctr: 0,
          spend: 0,
          cpc: 0,
          cpm: 0
        };
      }

      // Agregar dados (se houver múltiplos resultados por breakdown)
      const insights = this.aggregateInsights(data.data);

      return insights;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }

  /**
   * Agregar insights de múltiplos resultados (breakdowns)
   */
  private aggregateInsights(data: any[]): Insights {
    const totals: Insights = {
      impressions: 0,
      reach: 0,
      frequency: 0,
      clicks: 0,
      ctr: 0,
      spend: 0,
      cpc: 0,
      cpm: 0,
      conversions: 0,
      cost_per_conversion: 0,
      roas: 0
    };

    for (const row of data) {
      totals.impressions += parseInt(row.impressions || '0');
      totals.reach += parseInt(row.reach || '0');
      totals.clicks += parseInt(row.clicks || '0');
      totals.spend += parseFloat(row.spend || '0');

      // Conversões (buscar em actions)
      if (row.actions) {
        const conversions = row.actions.find((a: any) =>
          a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_lead' ||
          a.action_type === 'offsite_conversion.fb_pixel_complete_registration'
        );
        if (conversions) {
          totals.conversions! += parseInt(conversions.value);
        }
      }

      // ROAS (buscar em action_values)
      if (row.action_values) {
        const revenue = row.action_values.find((a: any) =>
          a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        if (revenue) {
          const revenueValue = parseFloat(revenue.value);
          totals.roas! += (revenueValue / parseFloat(row.spend || '1')) * 100;
        }
      }
    }

    // Calcular médias
    const count = data.length;
    totals.frequency = totals.impressions / (totals.reach || 1);
    totals.ctr = (totals.clicks / (totals.impressions || 1)) * 100;
    totals.cpc = totals.spend / (totals.clicks || 1);
    totals.cpm = (totals.spend / (totals.impressions || 1)) * 1000;

    if (totals.conversions && totals.conversions > 0) {
      totals.cost_per_conversion = totals.spend / totals.conversions;
    }

    return totals;
  }

  /**
   * Salvar insights no banco
   */
  async saveInsights(
    socialAccountId: string,
    campaignId: string,
    insights: Insights,
    organizationId: string
  ): Promise<void> {
    try {
      // Salvar cada métrica separadamente
      const metrics = [
        { type: 'impressions', value: insights.impressions },
        { type: 'reach', value: insights.reach },
        { type: 'frequency', value: insights.frequency },
        { type: 'clicks', value: insights.clicks },
        { type: 'ctr', value: insights.ctr },
        { type: 'spend', value: insights.spend },
        { type: 'cpc', value: insights.cpc },
        { type: 'cpm', value: insights.cpm }
      ];

      if (insights.conversions) {
        metrics.push({ type: 'conversions', value: insights.conversions });
      }

      if (insights.cost_per_conversion) {
        metrics.push({ type: 'cost_per_conversion', value: insights.cost_per_conversion });
      }

      if (insights.roas) {
        metrics.push({ type: 'roas', value: insights.roas });
      }

      // Inserir no banco
      for (const metric of metrics) {
        await db.insert(socialMetrics).values({
          organizationId,
          socialAccountId,
          platform: 'facebook', // ou 'instagram'
          metricType: metric.type,
          value: metric.value,
          metadata: { campaign_id: campaignId },
          collectedAt: new Date(),
          createdAt: new Date()
        });
      }

      console.log(`✅ Insights saved for campaign ${campaignId}`);
    } catch (error) {
      console.error('Error saving insights:', error);
      throw error;
    }
  }

  /**
   * Coletar e salvar insights de todas as campanhas
   */
  async syncAllCampaigns(socialAccountId: string, organizationId: string): Promise<void> {
    try {
      // Listar campanhas
      const campaigns = await metaAdsService.listCampaigns(socialAccountId);

      console.log(`📊 Syncing insights for ${campaigns.length} campaigns...`);

      // Para cada campanha, buscar insights
      for (const campaign of campaigns) {
        try {
          const insights = await this.getInsights(socialAccountId, {
            level: 'campaign',
            objectId: campaign.id,
            datePreset: 'last_7d'
          });

          // Salvar no banco
          await this.saveInsights(socialAccountId, campaign.id, insights, organizationId);

          console.log(`✅ Synced campaign ${campaign.id}`);
        } catch (error) {
          console.error(`❌ Error syncing campaign ${campaign.id}:`, error);
          // Continuar com as próximas
        }
      }

      console.log(`✅ All campaigns synced`);
    } catch (error) {
      console.error('Error syncing campaigns:', error);
      throw error;
    }
  }
}

export const metaInsightsService = new MetaInsightsService();
```

### 📂 Adicionar Rotas de Insights

**Arquivo:** `server/routes/meta-ads/meta-ads-routes.ts` (adicionar)

```typescript
// Adicionar no final antes do export

/**
 * GET /api/meta-ads/campaigns/:id/insights
 * Obter insights de uma campanha
 */
router.get('/campaigns/:id/insights', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { socialAccountId, datePreset } = req.query;

    if (!socialAccountId || typeof socialAccountId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'socialAccountId is required'
      });
    }

    const insights = await metaInsightsService.getInsights(socialAccountId, {
      level: 'campaign',
      objectId: id,
      datePreset: (datePreset as any) || 'last_7d'
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error getting campaign insights:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get insights'
    });
  }
});

/**
 * POST /api/meta-ads/campaigns/sync
 * Sincronizar insights de todas as campanhas
 */
router.post('/campaigns/sync', requireAuth, async (req, res) => {
  try {
    const { socialAccountId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!socialAccountId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'socialAccountId and organizationId are required'
      });
    }

    await metaInsightsService.syncAllCampaigns(socialAccountId, organizationId);

    res.json({
      success: true,
      message: 'Campaigns synced successfully'
    });
  } catch (error: any) {
    console.error('Error syncing campaigns:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync campaigns'
    });
  }
});
```

### ✅ Checklist FASE 3

- [ ] Criar `meta-insights-service.ts`
- [ ] Adicionar rotas de insights
- [ ] Criar componentes dashboard frontend
- [ ] Implementar gráficos (Chart.js ou Recharts)
- [ ] Testar coleta de métricas
- [ ] Criar worker automático de sincronização

### ⏱️ Tempo Estimado: 4 horas

---

## 🎯 6. FASE 4: Testes e Validação {#fase-4}

### ✅ Checklist Completa

**OAuth:**
- [ ] Conectar Facebook via Home
- [ ] Conectar Instagram via Home
- [ ] Verificar tokens salvos no banco
- [ ] Verificar tokens criptografados

**Ad Account:**
- [ ] Listar Ad Accounts disponíveis
- [ ] Selecionar Ad Account
- [ ] Verificar Ad Account ID salvo

**Criar Campanha:**
- [ ] Criar campanha via wizard
- [ ] Verificar campanha criada no Meta Ads Manager
- [ ] Testar cada objetivo (Sales, Leads, Awareness, etc)
- [ ] Verificar campaign ID salvo

**Métricas:**
- [ ] Coletar insights de campanha
- [ ] Verificar métricas salvas no banco
- [ ] Visualizar dashboard
- [ ] Testar breakdowns (demografia, localização)

**Performance:**
- [ ] Testar com múltiplas campanhas
- [ ] Verificar rate limits
- [ ] Testar error handling

### ⏱️ Tempo Estimado: 1 hora

---

## 📊 7. CRONOGRAMA E ESFORÇO {#cronograma}

| Fase | Descrição | Esforço | Prioridade |
|------|-----------|---------|------------|
| **FASE 1** | OAuth + Ad Account | 2h | 🔴 CRÍTICA |
| **FASE 2** | Meta Ads Integration | 6h | 🔴 CRÍTICA |
| **FASE 3** | Dashboard Métricas | 4h | 🟡 ALTA |
| **FASE 4** | Testes e Validação | 1h | 🟢 MÉDIA |
| **TOTAL** | | **13 horas** | |

---

## 🚨 8. MUDANÇAS CRÍTICAS API v24.0 (2025) {#mudancas}

### ⚠️ Breaking Changes

1. **Advantage+ Migration (08/10/2025)**
   - ASC/AAC legacy APIs **não funcionam mais**
   - Usar estrutura Advantage+ nova
   - v25.0 (Q1 2026): bloqueio total

2. **Targeting Consolidations**
   - Alguns interesses foram consolidados
   - Campanhas antigas rodam até 06/01/2026

3. **Placements**
   - Facebook video feeds **descontinuado**
   - Click to Messenger Lead Gen **deprecated**

4. **Métricas**
   - Page Insights: `impressions` e `page_fans` **removidos** (15/11/2025)
   - Instagram: novo metric `views`, removidos `plays`, `clips_replays_count`
   - Reach data limitado a **13 meses** (vs 37 anteriormente)

5. **Attribution**
   - Mudanças em como ações são time-attributed (10/06/2025)
   - Impacta relatórios diários/semanais/mensais

### ✅ Best Practices 2025

**Autenticação:**
- ✅ Usar System User tokens (renovação automática)
- ✅ Tokens com escopo mínimo necessário
- ✅ Renovar a cada 60 dias (long-lived)
- ✅ MFA obrigatório para admin

**API Calls:**
- ✅ Especificar `fields` explicitamente (reduz payload 60%)
- ✅ Usar cursor pagination para grandes datasets
- ✅ Rate limiting: respeitar headers `X-Business-Use-Case-Usage`

**Segurança:**
- ✅ Tokens criptografados no banco (AES-256-GCM)
- ✅ HTTPS obrigatório
- ✅ Nunca logar tokens
- ✅ Environment variables para credenciais

---

## 📚 9. REFERÊNCIAS

- [Meta Marketing API v24.0 - Official Docs](https://developers.facebook.com/docs/marketing-api)
- [Campaign Creation Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign)
- [Ad Set Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/adsets)
- [Ad Creative Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative)
- [Insights API](https://developers.facebook.com/docs/marketing-api/insights/)
- [v24.0 Release Notes](https://developers.facebook.com/docs/marketing-api/changelog/v24-0)

---

## ✅ CONCLUSÃO

Este plano cobre **TODA a integração Meta Ads + Dashboard de Métricas** de forma completa e profissional, seguindo as melhores práticas da Meta em 2025.

**Total: 13 horas** para implementação completa.

**Próximo Passo:** Começar pela FASE 1 (OAuth + Ad Account) e seguir sequencialmente.
