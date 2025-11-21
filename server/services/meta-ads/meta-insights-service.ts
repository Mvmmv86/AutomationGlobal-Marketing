import { db } from '../../db';
import { socialAccounts } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { tokenEncryption } from '../social/token-encryption';
import { adAccountService } from '../social/ad-account-service';

/**
 * Meta Insights Service
 *
 * Serviço para coletar métricas de campanhas via Meta Insights API
 * Documentação: https://developers.facebook.com/docs/marketing-api/insights/
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InsightsMetrics {
  // Métricas de Performance
  impressions: number;
  reach: number;
  frequency: number;

  // Métricas de Engajamento
  clicks: number;
  ctr: number; // Click-through rate
  link_clicks?: number;
  post_reactions?: number;
  post_comments?: number;
  post_shares?: number;
  post_saves?: number;

  // Métricas de Custo
  spend: number;
  cpc: number; // Cost per click
  cpm: number; // Cost per mille (1000 impressions)
  cpp: number; // Cost per post engagement

  // Métricas de Conversão
  conversions?: number;
  conversion_values?: number;
  cost_per_conversion?: number;
  roas?: number; // Return on ad spend

  // Métricas de Vídeo (se aplicável)
  video_views?: number;
  video_avg_time_watched_seconds?: number;
  video_p25_watched?: number; // 25% completado
  video_p50_watched?: number; // 50% completado
  video_p75_watched?: number; // 75% completado
  video_p100_watched?: number; // 100% completado

  // Metadados
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
}

export interface InsightsBreakdown {
  age?: string;
  gender?: string;
  country?: string;
  region?: string;
  dma?: string; // Designated Market Area
  device_platform?: string;
  publisher_platform?: string;
  platform_position?: string;
  impression_device?: string;
}

export interface InsightsParams {
  socialAccountId: number;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  campaignIds?: string[];
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month';
  timeRange?: {
    since: string; // YYYY-MM-DD
    until: string; // YYYY-MM-DD
  };
  breakdowns?: string[];
  limit?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MetaInsightsService {
  private baseUrl = 'https://graph.facebook.com/v24.0';

  /**
   * Obter credenciais (access token + ad account id)
   */
  private async getCredentials(socialAccountId: number) {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, socialAccountId));

    if (!account) {
      throw new Error('Social account not found');
    }

    const accessToken = tokenEncryption.decrypt(account.accessToken);
    const adAccountMetadata = await adAccountService.getAdAccountId(socialAccountId);

    if (!adAccountMetadata) {
      throw new Error('Ad Account not configured');
    }

    return {
      accessToken,
      adAccountId: adAccountMetadata.adAccountId
    };
  }

  /**
   * Buscar insights de campanhas
   * Endpoint: GET /{ad-account-id}/insights
   */
  async getInsights(params: InsightsParams): Promise<InsightsMetrics[]> {
    const { accessToken, adAccountId } = await this.getCredentials(params.socialAccountId);

    // Campos que queremos buscar (principais métricas do Meta)
    const fields = [
      // Performance
      'impressions',
      'reach',
      'frequency',

      // Engagement
      'clicks',
      'ctr',
      'inline_link_clicks',
      'actions', // Contém reactions, comments, shares, saves

      // Custos
      'spend',
      'cpc',
      'cpm',
      'cpp',

      // Conversões (se configuradas)
      'conversions',
      'conversion_values',
      'cost_per_conversion',
      'purchase_roas', // Return on ad spend

      // Vídeo (se houver)
      'video_30_sec_watched_actions',
      'video_avg_time_watched_actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p100_watched_actions',

      // Metadados
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'date_start',
      'date_stop'
    ].join(',');

    // Construir URL
    let url = `${this.baseUrl}/${adAccountId}/insights?fields=${fields}&access_token=${accessToken}`;

    // Adicionar level (account, campaign, adset, ad)
    if (params.level) {
      url += `&level=${params.level}`;
    }

    // Adicionar filtro de campanhas específicas
    if (params.campaignIds && params.campaignIds.length > 0) {
      const filterValue = JSON.stringify([
        {
          field: 'campaign.id',
          operator: 'IN',
          value: params.campaignIds
        }
      ]);
      url += `&filtering=${encodeURIComponent(filterValue)}`;
    }

    // Adicionar período (date_preset OU time_range)
    if (params.datePreset) {
      url += `&date_preset=${params.datePreset}`;
    } else if (params.timeRange) {
      url += `&time_range=${encodeURIComponent(JSON.stringify(params.timeRange))}`;
    }

    // Adicionar breakdowns (age, gender, country, etc.)
    if (params.breakdowns && params.breakdowns.length > 0) {
      url += `&breakdowns=${params.breakdowns.join(',')}`;
    }

    // Limit
    if (params.limit) {
      url += `&limit=${params.limit}`;
    }

    console.log('📊 Fetching insights from Meta API:', url.replace(accessToken, '***'));

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to fetch insights'}`);
    }

    const result = await response.json();
    const rawData = result.data || [];

    // Processar e normalizar dados
    return rawData.map((item: any) => this.normalizeInsights(item));
  }

  /**
   * Normalizar dados brutos do Meta para o formato esperado
   */
  private normalizeInsights(raw: any): InsightsMetrics {
    // Extrair actions (reactions, comments, shares, etc.)
    const actions = raw.actions || [];
    const postReactions = this.findActionValue(actions, 'post_reaction');
    const postComments = this.findActionValue(actions, 'comment');
    const postShares = this.findActionValue(actions, 'post');
    const postSaves = this.findActionValue(actions, 'onsite_conversion.post_save');
    const linkClicks = this.findActionValue(actions, 'link_click');

    // Extrair vídeo metrics
    const videoActions = raw.video_30_sec_watched_actions || [];
    const videoViews = videoActions[0]?.value || 0;

    // Conversões
    const conversions = this.findActionValue(actions, 'offsite_conversion') ||
                       this.findActionValue(actions, 'onsite_conversion');

    const conversionValues = raw.conversion_values || 0;
    const costPerConversion = raw.cost_per_conversion ? parseFloat(raw.cost_per_conversion) : 0;
    const roas = raw.purchase_roas ? parseFloat(raw.purchase_roas[0]?.value || 0) : 0;

    return {
      // Performance
      impressions: parseInt(raw.impressions || 0),
      reach: parseInt(raw.reach || 0),
      frequency: parseFloat(raw.frequency || 0),

      // Engagement
      clicks: parseInt(raw.clicks || 0),
      ctr: parseFloat(raw.ctr || 0),
      link_clicks: linkClicks,
      post_reactions: postReactions,
      post_comments: postComments,
      post_shares: postShares,
      post_saves: postSaves,

      // Custos
      spend: parseFloat(raw.spend || 0),
      cpc: parseFloat(raw.cpc || 0),
      cpm: parseFloat(raw.cpm || 0),
      cpp: parseFloat(raw.cpp || 0),

      // Conversões
      conversions,
      conversion_values: conversionValues,
      cost_per_conversion: costPerConversion,
      roas,

      // Vídeo
      video_views: videoViews,
      video_avg_time_watched_seconds: raw.video_avg_time_watched_actions?.[0]?.value,
      video_p25_watched: raw.video_p25_watched_actions?.[0]?.value,
      video_p50_watched: raw.video_p50_watched_actions?.[0]?.value,
      video_p75_watched: raw.video_p75_watched_actions?.[0]?.value,
      video_p100_watched: raw.video_p100_watched_actions?.[0]?.value,

      // Metadados
      date_start: raw.date_start,
      date_stop: raw.date_stop,
      campaign_id: raw.campaign_id,
      campaign_name: raw.campaign_name,
      adset_id: raw.adset_id,
      adset_name: raw.adset_name,
      ad_id: raw.ad_id,
      ad_name: raw.ad_name
    };
  }

  /**
   * Helper para encontrar valor de uma action específica
   */
  private findActionValue(actions: any[], actionType: string): number | undefined {
    const action = actions.find((a: any) => a.action_type === actionType);
    return action ? parseInt(action.value) : undefined;
  }

  /**
   * Buscar insights agregadas de todas as campanhas
   */
  async getAggregatedInsights(
    socialAccountId: number,
    datePreset: string = 'last_30d'
  ): Promise<InsightsMetrics> {
    const insights = await this.getInsights({
      socialAccountId,
      level: 'account',
      datePreset: datePreset as any
    });

    // Se não houver dados, retornar zeros
    if (insights.length === 0) {
      return {
        impressions: 0,
        reach: 0,
        frequency: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
        cpc: 0,
        cpm: 0,
        cpp: 0
      };
    }

    // Retornar primeiro resultado (account level já é agregado)
    return insights[0];
  }

  /**
   * Buscar insights de uma campanha específica
   */
  async getCampaignInsights(
    socialAccountId: number,
    campaignId: string,
    datePreset: string = 'lifetime'
  ): Promise<InsightsMetrics> {
    const { accessToken } = await this.getCredentials(socialAccountId);

    const fields = [
      'impressions',
      'reach',
      'frequency',
      'clicks',
      'ctr',
      'inline_link_clicks',
      'actions',
      'spend',
      'cpc',
      'cpm',
      'cpp',
      'conversions',
      'conversion_values',
      'cost_per_conversion',
      'purchase_roas',
      'date_start',
      'date_stop'
    ].join(',');

    const url = `${this.baseUrl}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Failed to fetch campaign insights'}`);
    }

    const result = await response.json();
    const rawData = result.data?.[0];

    if (!rawData) {
      // Retornar zeros se não houver dados
      return {
        impressions: 0,
        reach: 0,
        frequency: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
        cpc: 0,
        cpm: 0,
        cpp: 0,
        campaign_id: campaignId
      };
    }

    return this.normalizeInsights(rawData);
  }

  /**
   * Buscar breakdown por demografia (idade, gênero)
   */
  async getDemographicBreakdown(
    socialAccountId: number,
    campaignIds?: string[],
    datePreset: string = 'last_30d'
  ): Promise<any[]> {
    return await this.getInsights({
      socialAccountId,
      level: 'campaign',
      campaignIds,
      datePreset: datePreset as any,
      breakdowns: ['age', 'gender']
    });
  }

  /**
   * Buscar breakdown por localização (país, região)
   */
  async getLocationBreakdown(
    socialAccountId: number,
    campaignIds?: string[],
    datePreset: string = 'last_30d'
  ): Promise<any[]> {
    return await this.getInsights({
      socialAccountId,
      level: 'campaign',
      campaignIds,
      datePreset: datePreset as any,
      breakdowns: ['country', 'region']
    });
  }

  /**
   * Buscar breakdown por dispositivo
   */
  async getDeviceBreakdown(
    socialAccountId: number,
    campaignIds?: string[],
    datePreset: string = 'last_30d'
  ): Promise<any[]> {
    return await this.getInsights({
      socialAccountId,
      level: 'campaign',
      campaignIds,
      datePreset: datePreset as any,
      breakdowns: ['device_platform', 'publisher_platform']
    });
  }
}

export const metaInsightsService = new MetaInsightsService();
