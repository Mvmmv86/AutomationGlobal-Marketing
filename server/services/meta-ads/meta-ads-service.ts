import { db } from '../../db';
import { socialAccounts } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { tokenEncryption } from '../social/token-encryption';
import { adAccountService } from '../social/ad-account-service';

/**
 * Meta Ads Service
 *
 * Serviço para criação e gerenciamento de campanhas via Meta Marketing API v24.0
 * Documentação: https://developers.facebook.com/docs/marketing-api/reference/v24.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
}

// Objetivos de campanha (v24.0 - OUTCOME_* substituiu objetivos antigos)
export type CampaignObjective =
  | 'OUTCOME_SALES'           // Vendas (ex: e-commerce)
  | 'OUTCOME_LEADS'           // Captura de leads
  | 'OUTCOME_AWARENESS'       // Awareness (conhecimento de marca)
  | 'OUTCOME_ENGAGEMENT'      // Engajamento
  | 'OUTCOME_TRAFFIC'         // Tráfego
  | 'OUTCOME_APP_PROMOTION';  // Promoção de app

// Opções de otimização do Ad Set
export type OptimizationGoal =
  | 'OFFSITE_CONVERSIONS'     // Conversões fora do site
  | 'LINK_CLICKS'             // Cliques no link
  | 'IMPRESSIONS'             // Impressões
  | 'REACH'                   // Alcance
  | 'LANDING_PAGE_VIEWS'      // Visualizações da página
  | 'THRUPLAY'                // Vídeo assistido (>15s ou completo)
  | 'VALUE';                  // Valor (ROAS)

// Status da campanha/ad set/ad
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

// Estratégia de lance
export type BidStrategy =
  | 'LOWEST_COST_WITHOUT_CAP'  // Custo mais baixo (recomendado)
  | 'LOWEST_COST_WITH_BID_CAP' // Custo mais baixo com limite
  | 'COST_CAP';                // Limite de custo por resultado

// Parâmetros para criar campanha
export interface CreateCampaignParams {
  socialAccountId: number;
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  special_ad_categories?: string[]; // Ex: ['CREDIT', 'EMPLOYMENT', 'HOUSING']
  daily_budget?: number;
  lifetime_budget?: number;
}

// Parâmetros para criar Ad Set
export interface CreateAdSetParams {
  socialAccountId: number;
  campaignId: string;
  name: string;
  optimization_goal: OptimizationGoal;
  billing_event: 'IMPRESSIONS' | 'LINK_CLICKS';
  bid_strategy?: BidStrategy;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string; // ISO 8601
  end_time?: string;   // ISO 8601
  targeting: AdTargeting;
  status?: CampaignStatus;
}

// Targeting do público
export interface AdTargeting {
  geo_locations?: {
    countries?: string[];      // Ex: ['BR', 'US']
    regions?: { key: string }[];
    cities?: { key: string }[];
  };
  age_min?: number;             // Mínimo: 13
  age_max?: number;             // Máximo: 65+
  genders?: (1 | 2)[];          // 1 = Masculino, 2 = Feminino
  locales?: string[];           // Ex: ['pt_BR', 'en_US']
  interests?: { id: string; name: string }[];
  behaviors?: { id: string; name: string }[];
  custom_audiences?: string[];  // IDs de públicos personalizados
  excluded_custom_audiences?: string[];
  flexible_spec?: any[];        // Targeting flexível avançado
}

// Parâmetros para criar criativo
export interface CreateAdCreativeParams {
  socialAccountId: number;
  name: string;
  object_story_spec?: {
    page_id: string;
    instagram_actor_id?: string;
    link_data?: {
      link: string;
      message: string;
      name?: string;
      description?: string;
      call_to_action?: {
        type: string; // Ex: 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'
        value?: {
          link?: string;
        };
      };
      image_hash?: string;
      picture?: string;
    };
    video_data?: {
      video_id: string;
      message: string;
      call_to_action?: {
        type: string;
        value?: {
          link?: string;
        };
      };
    };
  };
}

// Parâmetros para criar anúncio
export interface CreateAdParams {
  socialAccountId: number;
  adSetId: string;
  creativeId: string;
  name: string;
  status?: CampaignStatus;
}

// Resposta completa da criação de campanha
export interface FullCampaignResponse {
  campaign: {
    id: string;
    name: string;
  };
  adSet: {
    id: string;
    name: string;
  };
  creative: {
    id: string;
    name: string;
  };
  ad: {
    id: string;
    name: string;
  };
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MetaAdsService {
  private baseUrl = 'https://graph.facebook.com/v24.0';

  /**
   * Obter credenciais (access token + ad account id) da social account
   */
  private async getCredentials(socialAccountId: number): Promise<MetaCredentials> {
    // Buscar social account
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, socialAccountId));

    if (!account) {
      throw new Error('Social account not found');
    }

    // Descriptografar token
    const accessToken = tokenEncryption.decrypt(account.accessToken);

    // Buscar Ad Account ID do metadata
    const adAccountMetadata = await adAccountService.getAdAccountId(socialAccountId);

    if (!adAccountMetadata) {
      throw new Error('Ad Account not configured. Please select an Ad Account first.');
    }

    return {
      accessToken,
      adAccountId: adAccountMetadata.adAccountId
    };
  }

  /**
   * 1. Criar Campaign
   * Endpoint: POST /{ad-account-id}/campaigns
   */
  async createCampaign(params: CreateCampaignParams): Promise<{ id: string; name: string }> {
    const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

    // Validar objetivo (v24.0 usa OUTCOME_*)
    const validObjectives: CampaignObjective[] = [
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

    const body: any = {
      name: params.name,
      objective: params.objective,
      status: params.status || 'PAUSED',
      special_ad_categories: params.special_ad_categories || [],
      access_token: accessToken
    };

    // Budget (diário OU lifetime, não ambos)
    if (params.daily_budget) {
      body.daily_budget = Math.round(params.daily_budget * 100); // Converter para centavos
    } else if (params.lifetime_budget) {
      body.lifetime_budget = Math.round(params.lifetime_budget * 100);
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
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to create campaign'}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      name: params.name
    };
  }

  /**
   * 2. Criar Ad Set
   * Endpoint: POST /{ad-account-id}/adsets
   */
  async createAdSet(params: CreateAdSetParams): Promise<{ id: string; name: string }> {
    const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

    const body: any = {
      name: params.name,
      campaign_id: params.campaignId,
      optimization_goal: params.optimization_goal,
      billing_event: params.billing_event,
      bid_strategy: params.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
      targeting: params.targeting,
      status: params.status || 'PAUSED',
      access_token: accessToken
    };

    // Budget (diário OU lifetime)
    if (params.daily_budget) {
      body.daily_budget = Math.round(params.daily_budget * 100);
    } else if (params.lifetime_budget) {
      body.lifetime_budget = Math.round(params.lifetime_budget * 100);

      // Lifetime budget requer start_time e end_time
      if (!params.start_time || !params.end_time) {
        throw new Error('lifetime_budget requires start_time and end_time');
      }
      body.start_time = params.start_time;
      body.end_time = params.end_time;
    }

    const response = await fetch(`${this.baseUrl}/${adAccountId}/adsets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to create ad set'}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      name: params.name
    };
  }

  /**
   * 3. Criar Ad Creative
   * Endpoint: POST /{ad-account-id}/adcreatives
   */
  async createAdCreative(params: CreateAdCreativeParams): Promise<{ id: string; name: string }> {
    const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

    const body: any = {
      name: params.name,
      object_story_spec: params.object_story_spec,
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
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to create ad creative'}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      name: params.name
    };
  }

  /**
   * 4. Criar Ad (anúncio final)
   * Endpoint: POST /{ad-account-id}/ads
   */
  async createAd(params: CreateAdParams): Promise<{ id: string; name: string }> {
    const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

    const body: any = {
      name: params.name,
      adset_id: params.adSetId,
      creative: {
        creative_id: params.creativeId
      },
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
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to create ad'}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      name: params.name
    };
  }

  /**
   * 5. Fluxo completo: Criar campanha + ad set + creative + ad
   */
  async createFullCampaign(params: {
    socialAccountId: number;
    campaignName: string;
    objective: CampaignObjective;
    adSetName: string;
    optimization_goal: OptimizationGoal;
    daily_budget: number;
    targeting: AdTargeting;
    creativeName: string;
    pageId: string;
    instagramActorId?: string;
    message: string;
    link: string;
    callToAction: string;
    imageUrl?: string;
    adName: string;
  }): Promise<FullCampaignResponse> {
    try {
      // 1. Criar Campaign
      console.log('Creating campaign...');
      const campaign = await this.createCampaign({
        socialAccountId: params.socialAccountId,
        name: params.campaignName,
        objective: params.objective,
        status: 'PAUSED' // Criar pausada por segurança
      });

      // 2. Criar Ad Set
      console.log('Creating ad set...');
      const adSet = await this.createAdSet({
        socialAccountId: params.socialAccountId,
        campaignId: campaign.id,
        name: params.adSetName,
        optimization_goal: params.optimization_goal,
        billing_event: 'IMPRESSIONS',
        daily_budget: params.daily_budget,
        targeting: params.targeting,
        status: 'PAUSED'
      });

      // 3. Criar Creative
      console.log('Creating ad creative...');
      const creative = await this.createAdCreative({
        socialAccountId: params.socialAccountId,
        name: params.creativeName,
        object_story_spec: {
          page_id: params.pageId,
          instagram_actor_id: params.instagramActorId,
          link_data: {
            link: params.link,
            message: params.message,
            call_to_action: {
              type: params.callToAction
            },
            picture: params.imageUrl
          }
        }
      });

      // 4. Criar Ad
      console.log('Creating ad...');
      const ad = await this.createAd({
        socialAccountId: params.socialAccountId,
        adSetId: adSet.id,
        creativeId: creative.id,
        name: params.adName,
        status: 'PAUSED'
      });

      console.log('✅ Full campaign created successfully!');

      return {
        campaign,
        adSet,
        creative,
        ad
      };
    } catch (error) {
      console.error('Error creating full campaign:', error);
      throw error;
    }
  }

  /**
   * Listar campanhas da Ad Account
   */
  async getCampaigns(socialAccountId: number): Promise<any[]> {
    const { accessToken, adAccountId } = await this.getCredentials(socialAccountId);

    const response = await fetch(
      `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to fetch campaigns'}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Buscar detalhes de uma campanha específica
   */
  async getCampaignById(socialAccountId: number, campaignId: string): Promise<any> {
    const { accessToken } = await this.getCredentials(socialAccountId);

    const response = await fetch(
      `${this.baseUrl}/${campaignId}?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,adsets{id,name,status,optimization_goal,daily_budget},ads{id,name,status,creative{id,name}}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to fetch campaign'}`);
    }

    return await response.json();
  }

  /**
   * Atualizar status de campanha (ativar/pausar)
   */
  async updateCampaignStatus(
    socialAccountId: number,
    campaignId: string,
    status: CampaignStatus
  ): Promise<{ success: boolean }> {
    const { accessToken } = await this.getCredentials(socialAccountId);

    const response = await fetch(`${this.baseUrl}/${campaignId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        access_token: accessToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to update campaign'}`);
    }

    return { success: true };
  }
}

export const metaAdsService = new MetaAdsService();
