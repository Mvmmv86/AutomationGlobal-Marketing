// server/services/campaigns-service.ts
// Service completo para gerenciamento de campanhas de marketing

import { db } from '../database/drizzle-connection.js';
import { sql } from 'drizzle-orm';

// =====================================================
// TYPES
// =====================================================

export type CampaignType = 'social_media' | 'email' | 'content' | 'ads' | 'mixed';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type PostPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';

export interface CampaignData {
  name: string;
  description?: string;
  type: CampaignType;
  status?: CampaignStatus;
  objective?: string;
  targetAudience?: string;
  budgetTotal?: number;
  budgetDaily?: number;
  startDate?: Date;
  endDate?: Date;
  facebookCampaignId?: string;
  facebookStatus?: string;
  facebookObjective?: string;
  facebookAccountId?: string;
  contentSettings?: any;
  metadata?: any;
}

export interface CampaignPostData {
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  platform: PostPlatform;
  postType?: string;
  scheduledFor?: Date;
  metadata?: any;
}

export class CampaignsService {

  // ===== CAMPAIGNS - CRUD =====

  /**
   * Listar todas as campanhas de uma organização
   */
  async listCampaigns(organizationId: string, filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = sql`
      SELECT
        c.*,
        (
          SELECT COUNT(*)
          FROM campaign_posts cp
          WHERE cp.campaign_id = c.id
        ) as posts_count
      FROM campaigns c
      WHERE c.organization_id = ${organizationId}
    `;

    if (filters?.status) {
      query = sql`${query} AND c.status = ${filters.status}`;
    }
    if (filters?.type) {
      query = sql`${query} AND c.type = ${filters.type}`;
    }
    if (filters?.search) {
      query = sql`${query} AND (
        c.name ILIKE ${`%${filters.search}%`} OR
        c.description ILIKE ${`%${filters.search}%`}
      )`;
    }

    query = sql`${query} ORDER BY c.created_at DESC`;

    if (filters?.limit) {
      query = sql`${query} LIMIT ${filters.limit}`;
    }
    if (filters?.offset) {
      query = sql`${query} OFFSET ${filters.offset}`;
    }

    const result = await db.execute(query);
    console.log('[CAMPAIGNS-SERVICE] listCampaigns result:', {
      isArray: Array.isArray(result),
      length: Array.isArray(result) ? result.length : 0
    });
    return Array.isArray(result) ? result : [];
  }

  /**
   * Obter uma campanha por ID
   */
  async getCampaign(campaignId: string, organizationId: string) {
    const result = await db.execute(sql`
      SELECT
        c.*,
        (
          SELECT json_agg(json_build_object(
            'id', cp.id,
            'content', cp.content,
            'platform', cp.platform,
            'status', cp.status,
            'scheduled_for', cp.scheduled_for,
            'published_at', cp.published_at,
            'impressions', cp.impressions,
            'likes', cp.likes,
            'comments', cp.comments,
            'shares', cp.shares
          ))
          FROM campaign_posts cp
          WHERE cp.campaign_id = c.id
        ) as posts
      FROM campaigns c
      WHERE c.id = ${campaignId}
      AND c.organization_id = ${organizationId}
    `);

    if (result.length === 0) {
      throw new Error('Campanha não encontrada');
    }

    return result[0];
  }

  /**
   * Criar nova campanha
   */
  async createCampaign(organizationId: string, data: CampaignData, createdBy: string) {
    const result = await db.execute(sql`
      INSERT INTO campaigns (
        organization_id,
        name,
        description,
        type,
        status,
        objective,
        target_audience,
        budget_total,
        budget_daily,
        start_date,
        end_date,
        facebook_campaign_id,
        facebook_status,
        facebook_objective,
        facebook_account_id,
        content_settings,
        metadata,
        created_by
      )
      VALUES (
        ${organizationId},
        ${data.name},
        ${data.description || null},
        ${data.type},
        ${data.status || 'draft'},
        ${data.objective || null},
        ${data.targetAudience || null},
        ${data.budgetTotal || null},
        ${data.budgetDaily || null},
        ${data.startDate || null},
        ${data.endDate || null},
        ${data.facebookCampaignId || null},
        ${data.facebookStatus || null},
        ${data.facebookObjective || null},
        ${data.facebookAccountId || null},
        ${data.contentSettings ? JSON.stringify(data.contentSettings) : '{}'}::jsonb,
        ${data.metadata ? JSON.stringify(data.metadata) : '{}'}::jsonb,
        ${createdBy}
      )
      RETURNING *
    `);

    console.log('[CAMPAIGNS-SERVICE] createCampaign result:', {
      isArray: Array.isArray(result),
      length: Array.isArray(result) ? result.length : 0,
      firstItem: result[0]
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Falha ao criar campanha - nenhum dado retornado');
    }

    return result[0];
  }

  /**
   * Atualizar campanha
   */
  async updateCampaign(campaignId: string, organizationId: string, data: Partial<CampaignData>) {
    const setClauses: any[] = [];

    // Construir cláusulas SET dinamicamente usando template literals do Drizzle
    if (data.name !== undefined) {
      setClauses.push(sql`name = ${data.name}`);
    }
    if (data.description !== undefined) {
      setClauses.push(sql`description = ${data.description}`);
    }
    if (data.type !== undefined) {
      setClauses.push(sql`type = ${data.type}`);
    }
    if (data.status !== undefined) {
      setClauses.push(sql`status = ${data.status}`);
    }
    if (data.objective !== undefined) {
      setClauses.push(sql`objective = ${data.objective}`);
    }
    if (data.targetAudience !== undefined) {
      setClauses.push(sql`target_audience = ${data.targetAudience}`);
    }
    if (data.budgetTotal !== undefined) {
      setClauses.push(sql`budget_total = ${data.budgetTotal}`);
    }
    if (data.budgetDaily !== undefined) {
      setClauses.push(sql`budget_daily = ${data.budgetDaily}`);
    }
    if (data.startDate !== undefined) {
      setClauses.push(sql`start_date = ${data.startDate}`);
    }
    if (data.endDate !== undefined) {
      setClauses.push(sql`end_date = ${data.endDate}`);
    }
    if (data.facebookCampaignId !== undefined) {
      setClauses.push(sql`facebook_campaign_id = ${data.facebookCampaignId}`);
    }
    if (data.facebookStatus !== undefined) {
      setClauses.push(sql`facebook_status = ${data.facebookStatus}`);
    }
    if (data.facebookObjective !== undefined) {
      setClauses.push(sql`facebook_objective = ${data.facebookObjective}`);
    }
    if (data.facebookAccountId !== undefined) {
      setClauses.push(sql`facebook_account_id = ${data.facebookAccountId}`);
    }
    if (data.contentSettings !== undefined) {
      setClauses.push(sql`content_settings = ${JSON.stringify(data.contentSettings)}::jsonb`);
    }
    if (data.metadata !== undefined) {
      setClauses.push(sql`metadata = ${JSON.stringify(data.metadata)}::jsonb`);
    }

    // Sempre atualiza last_sync_at quando houver atualização de dados do Facebook
    if (data.facebookStatus || data.facebookCampaignId) {
      setClauses.push(sql`last_sync_at = NOW()`);
    }

    // Sempre atualiza updated_at
    setClauses.push(sql`updated_at = NOW()`);

    // Construir query usando template literals do Drizzle
    const result = await db.execute(sql`
      UPDATE campaigns
      SET ${sql.join(setClauses, sql`, `)}
      WHERE id = ${campaignId}
      AND organization_id = ${organizationId}
      RETURNING *
    `);

    if (result.length === 0) {
      throw new Error('Campanha não encontrada');
    }

    return result[0];
  }

  /**
   * Deletar campanha
   */
  async deleteCampaign(campaignId: string, organizationId: string) {
    const result = await db.execute(sql`
      DELETE FROM campaigns
      WHERE id = ${campaignId}
      AND organization_id = ${organizationId}
      RETURNING id
    `);

    if (result.length === 0) {
      throw new Error('Campanha não encontrada');
    }

    return { success: true };
  }

  /**
   * Ativar campanha
   */
  async activateCampaign(campaignId: string, organizationId: string) {
    return this.updateCampaign(campaignId, organizationId, { status: 'active' });
  }

  /**
   * Pausar campanha
   */
  async pauseCampaign(campaignId: string, organizationId: string) {
    return this.updateCampaign(campaignId, organizationId, { status: 'paused' });
  }

  // ===== CAMPAIGN POSTS - CRUD =====

  /**
   * Listar posts de uma campanha
   */
  async listCampaignPosts(campaignId: string, organizationId: string) {
    // Verificar se a campanha pertence à organização
    await this.getCampaign(campaignId, organizationId);

    const result = await db.execute(sql`
      SELECT *
      FROM campaign_posts
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
    `);

    return result || [];
  }

  /**
   * Criar post para uma campanha
   */
  async createCampaignPost(campaignId: string, organizationId: string, data: CampaignPostData, createdBy: string) {
    // Verificar se a campanha pertence à organização
    await this.getCampaign(campaignId, organizationId);

    const result = await db.execute(sql`
      INSERT INTO campaign_posts (
        campaign_id,
        content,
        media_urls,
        hashtags,
        platform,
        post_type,
        scheduled_for,
        metadata,
        created_by
      )
      VALUES (
        ${campaignId},
        ${data.content},
        ${data.mediaUrls ? JSON.stringify(data.mediaUrls) : '[]'}::jsonb,
        ${data.hashtags || null},
        ${data.platform},
        ${data.postType || 'post'},
        ${data.scheduledFor || null},
        ${data.metadata ? JSON.stringify(data.metadata) : '{}'}::jsonb,
        ${createdBy}
      )
      RETURNING *
    `);

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Falha ao criar post - nenhum dado retornado');
    }

    return result[0];
  }

  /**
   * Deletar post de campanha
   */
  async deleteCampaignPost(postId: string, campaignId: string, organizationId: string) {
    // Verificar se a campanha pertence à organização
    await this.getCampaign(campaignId, organizationId);

    const result = await db.execute(sql`
      DELETE FROM campaign_posts
      WHERE id = ${postId}
      AND campaign_id = ${campaignId}
      RETURNING id
    `);

    if (result.length === 0) {
      throw new Error('Post não encontrado');
    }

    return { success: true };
  }

  // ===== STATS & DASHBOARD =====

  /**
   * Obter estatísticas de campanhas da organização
   */
  async getCampaignStats(organizationId: string) {
    const result = await db.execute(sql`
      SELECT
        COUNT(*)::int as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_campaigns,
        COUNT(CASE WHEN status = 'paused' THEN 1 END)::int as paused_campaigns,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_campaigns,
        COUNT(CASE WHEN facebook_campaign_id IS NOT NULL THEN 1 END)::int as facebook_connected,
        SUM(impressions)::int as total_impressions,
        SUM(clicks)::int as total_clicks,
        SUM(conversions)::int as total_conversions,
        SUM(spend)::decimal as total_spend,
        (
          SELECT COUNT(*)::int
          FROM campaign_posts cp
          INNER JOIN campaigns c ON cp.campaign_id = c.id
          WHERE c.organization_id = ${organizationId}
        ) as total_posts
      FROM campaigns
      WHERE organization_id = ${organizationId}
    `);

    if (!result || result.length === 0) {
      return {
        total_campaigns: 0,
        active_campaigns: 0,
        paused_campaigns: 0,
        completed_campaigns: 0,
        facebook_connected: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_spend: 0,
        total_posts: 0
      };
    }

    return result[0];
  }

  /**
   * Atualizar métricas de uma campanha
   */
  async updateCampaignMetrics(campaignId: string, organizationId: string, metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
  }) {
    const setClauses: any[] = [];

    if (metrics.impressions !== undefined) {
      setClauses.push(sql`impressions = ${metrics.impressions}`);
    }
    if (metrics.clicks !== undefined) {
      setClauses.push(sql`clicks = ${metrics.clicks}`);
    }
    if (metrics.conversions !== undefined) {
      setClauses.push(sql`conversions = ${metrics.conversions}`);
    }
    if (metrics.spend !== undefined) {
      setClauses.push(sql`spend = ${metrics.spend}`);
    }

    setClauses.push(sql`last_sync_at = NOW()`);
    setClauses.push(sql`updated_at = NOW()`);

    const result = await db.execute(sql`
      UPDATE campaigns
      SET ${sql.join(setClauses, sql`, `)}
      WHERE id = ${campaignId}
      AND organization_id = ${organizationId}
      RETURNING *
    `);

    if (result.length === 0) {
      throw new Error('Campanha não encontrada');
    }

    return result[0];
  }
}

// Exportar instância singleton
export const campaignsService = new CampaignsService();
