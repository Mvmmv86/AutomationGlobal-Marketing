/**
 * Instagram Graph API Service
 *
 * Funcionalidades:
 * 1. PUBLICAÇÃO: Posts (2 steps), Stories, Reels, Carousels
 * 2. COLETA DE DADOS: Métricas de posts, stories, conta, insights de audiência
 *
 * APIs utilizadas:
 * - Instagram Graph API (via Facebook Graph API v18.0)
 * - POST /{ig-user-id}/media - Criar container de mídia
 * - POST /{ig-user-id}/media_publish - Publicar container
 * - POST /{ig-user-id}/media (media_type=STORIES) - Publicar story
 * - GET /{ig-user-id}/media - Listar posts
 * - GET /{ig-media-id}/insights - Métricas do post
 * - GET /{ig-user-id}/insights - Métricas da conta
 * - GET /{ig-media-id}/comments - Comentários
 *
 * IMPORTANTE: Instagram requer que a conta seja um Business Account ou Creator Account
 * conectado a uma Facebook Page.
 */

import axios, { AxiosInstance } from 'axios';
import { db } from '../../db';
import { socialAccounts, socialPosts, socialMetrics, socialComments, socialSyncLogs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_API_BASE = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

interface InstagramAccount {
  id: string;
  organizationId: string;
  accountId: string; // Instagram Business Account ID
  accessToken: string;
  metadata: any;
}

interface PublishPostParams {
  accountId: string; // socialAccountId na DB
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'STORIES';
  mediaUrls: string[];
  locationId?: string; // ID de localização do Instagram
  userTags?: Array<{ username: string; x: number; y: number }>;
}

interface InstagramMediaContainer {
  id: string; // Container ID
}

interface InstagramMetrics {
  // Métricas de Posts
  impressions?: number;
  reach?: number;
  engagement?: number;
  saved?: number;
  video_views?: number;
  likes?: number;
  comments?: number;

  // Métricas de Stories
  exits?: number;
  replies?: number;
  taps_forward?: number;
  taps_back?: number;

  // Métricas da Conta
  follower_count?: number;
  media_count?: number;
  profile_views?: number;
}

export class InstagramService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: FACEBOOK_API_BASE,
      timeout: 60000, // 60s timeout (vídeos podem demorar)
    });
  }

  // ==========================================================================
  // PUBLICAÇÃO - PROCESSO DE 2 ETAPAS
  // ==========================================================================

  /**
   * Passo 1: Criar container de mídia (não publica ainda)
   */
  private async createMediaContainer(
    igUserId: string,
    accessToken: string,
    params: {
      mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
      mediaUrl: string;
      caption?: string;
      locationId?: string;
      userTags?: Array<{ username: string; x: number; y: number }>;
      isCarouselItem?: boolean;
    }
  ): Promise<string> {
    try {
      const response = await this.client.post<InstagramMediaContainer>(
        `/${igUserId}/media`,
        {
          image_url: params.mediaType === 'IMAGE' ? params.mediaUrl : undefined,
          video_url: params.mediaType === 'VIDEO' ? params.mediaUrl : undefined,
          media_type: params.mediaType,
          caption: params.caption,
          location_id: params.locationId,
          user_tags: params.userTags,
          is_carousel_item: params.isCarouselItem,
          access_token: accessToken,
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Passo 2: Publicar container de mídia
   */
  private async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    creationId: string
  ): Promise<string> {
    try {
      const response = await this.client.post(
        `/${igUserId}/media_publish`,
        {
          creation_id: creationId,
          access_token: accessToken,
        }
      );

      return response.data.id; // Media ID publicado
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publicar post com foto única
   */
  async publishPhotoPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URL is required');
    }

    try {
      // Passo 1: Criar container
      const containerId = await this.createMediaContainer(
        account.accountId,
        account.accessToken,
        {
          mediaType: 'IMAGE',
          mediaUrl: params.mediaUrls[0],
          caption: params.caption,
          locationId: params.locationId,
          userTags: params.userTags,
        }
      );

      // Passo 2: Publicar
      const mediaId = await this.publishMediaContainer(
        account.accountId,
        account.accessToken,
        containerId
      );

      return mediaId;
    } catch (error: any) {
      throw new Error(`Failed to publish photo: ${error.message}`);
    }
  }

  /**
   * Publicar vídeo (Reel ou Post)
   */
  async publishVideoPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URL is required');
    }

    try {
      // Passo 1: Criar container de vídeo
      const containerId = await this.createMediaContainer(
        account.accountId,
        account.accessToken,
        {
          mediaType: 'VIDEO',
          mediaUrl: params.mediaUrls[0],
          caption: params.caption,
          locationId: params.locationId,
        }
      );

      // Aguardar processamento do vídeo (polling)
      await this.waitForVideoProcessing(containerId, account.accessToken);

      // Passo 2: Publicar
      const mediaId = await this.publishMediaContainer(
        account.accountId,
        account.accessToken,
        containerId
      );

      return mediaId;
    } catch (error: any) {
      throw new Error(`Failed to publish video: ${error.message}`);
    }
  }

  /**
   * Publicar carousel (múltiplas fotos/vídeos)
   */
  async publishCarouselPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length < 2) {
      throw new Error('At least 2 media URLs are required for carousel');
    }

    try {
      // Passo 1: Criar containers para cada item do carousel
      const itemIds: string[] = [];

      for (const url of params.mediaUrls) {
        const isVideo = url.includes('.mp4') || url.includes('.mov');
        const containerId = await this.createMediaContainer(
          account.accountId,
          account.accessToken,
          {
            mediaType: isVideo ? 'VIDEO' : 'IMAGE',
            mediaUrl: url,
            isCarouselItem: true,
          }
        );

        itemIds.push(containerId);
      }

      // Passo 2: Criar container do carousel
      const carouselContainer = await this.client.post<InstagramMediaContainer>(
        `/${account.accountId}/media`,
        {
          media_type: 'CAROUSEL_ALBUM',
          children: itemIds,
          caption: params.caption,
          location_id: params.locationId,
          access_token: account.accessToken,
        }
      );

      // Passo 3: Publicar carousel
      const mediaId = await this.publishMediaContainer(
        account.accountId,
        account.accessToken,
        carouselContainer.data.id
      );

      return mediaId;
    } catch (error: any) {
      throw new Error(`Failed to publish carousel: ${error.message}`);
    }
  }

  /**
   * Publicar Story
   */
  async publishStory(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URL is required for story');
    }

    try {
      const isVideo = params.mediaUrls[0].includes('.mp4') || params.mediaUrls[0].includes('.mov');

      const response = await this.client.post(
        `/${account.accountId}/media`,
        {
          image_url: !isVideo ? params.mediaUrls[0] : undefined,
          video_url: isVideo ? params.mediaUrls[0] : undefined,
          media_type: 'STORIES',
          access_token: account.accessToken,
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Failed to publish story: ${error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - POSTS
  // ==========================================================================

  /**
   * Coletar métricas de um post específico
   */
  async collectPostMetrics(accountId: string, igMediaId: string): Promise<InstagramMetrics> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${igMediaId}/insights`,
        {
          params: {
            metric: 'impressions,reach,engagement,saved,video_views',
            access_token: account.accessToken,
          },
        }
      );

      // Coletar também likes e comentários
      const mediaData = await this.client.get(
        `/${igMediaId}`,
        {
          params: {
            fields: 'like_count,comments_count',
            access_token: account.accessToken,
          },
        }
      );

      const metrics: InstagramMetrics = {};

      response.data.data.forEach((metric: any) => {
        metrics[metric.name as keyof InstagramMetrics] = metric.values[0]?.value || 0;
      });

      metrics.likes = mediaData.data.like_count || 0;
      metrics.comments = mediaData.data.comments_count || 0;

      return metrics;
    } catch (error: any) {
      // Alguns posts podem não ter insights disponíveis ainda
      console.warn(`Could not collect metrics for ${igMediaId}:`, error.message);
      return {};
    }
  }

  /**
   * Coletar métricas de uma story
   */
  async collectStoryMetrics(accountId: string, igMediaId: string): Promise<InstagramMetrics> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${igMediaId}/insights`,
        {
          params: {
            metric: 'impressions,reach,exits,replies,taps_forward,taps_back',
            access_token: account.accessToken,
          },
        }
      );

      const metrics: InstagramMetrics = {};

      response.data.data.forEach((metric: any) => {
        metrics[metric.name as keyof InstagramMetrics] = metric.values[0]?.value || 0;
      });

      return metrics;
    } catch (error: any) {
      console.warn(`Could not collect story metrics for ${igMediaId}:`, error.message);
      return {};
    }
  }

  /**
   * Coletar todos os posts recentes
   */
  async collectRecentPosts(accountId: string, limit: number = 100): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${account.accountId}/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url',
            access_token: account.accessToken,
            limit,
          },
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - CONTA
  // ==========================================================================

  /**
   * Coletar métricas da conta
   */
  async collectAccountMetrics(accountId: string): Promise<InstagramMetrics> {
    const account = await this.getAccount(accountId);

    try {
      // Métricas gerais da conta
      const response = await this.client.get(
        `/${account.accountId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period: 'day',
            access_token: account.accessToken,
          },
        }
      );

      // Dados da conta (followers, media count)
      const accountData = await this.client.get(
        `/${account.accountId}`,
        {
          params: {
            fields: 'followers_count,media_count,follows_count',
            access_token: account.accessToken,
          },
        }
      );

      const metrics: InstagramMetrics = {};

      response.data.data.forEach((metric: any) => {
        const value = metric.values[metric.values.length - 1]?.value || 0;
        metrics[metric.name as keyof InstagramMetrics] = value;
      });

      metrics.follower_count = accountData.data.followers_count || 0;
      metrics.media_count = accountData.data.media_count || 0;

      return metrics;
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar insights de audiência
   */
  async collectAudienceInsights(accountId: string): Promise<any> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${account.accountId}/insights`,
        {
          params: {
            metric: 'audience_city,audience_country,audience_gender_age',
            period: 'lifetime',
            access_token: account.accessToken,
          },
        }
      );

      const insights: any = {};

      response.data.data.forEach((metric: any) => {
        insights[metric.name] = metric.values[0]?.value || {};
      });

      return insights;
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE COMENTÁRIOS
  // ==========================================================================

  /**
   * Coletar comentários de um post
   */
  async collectComments(accountId: string, igMediaId: string): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${igMediaId}/comments`,
        {
          params: {
            fields: 'id,text,username,timestamp,like_count',
            access_token: account.accessToken,
          },
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Responder a um comentário
   */
  async replyToComment(accountId: string, commentId: string, message: string): Promise<string> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.post(
        `/${commentId}/replies`,
        {
          message,
          access_token: account.accessToken,
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Instagram API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO COMPLETA
  // ==========================================================================

  /**
   * Sincronizar todos os dados de uma conta
   */
  async syncAccount(accountId: string): Promise<{ success: boolean; itemsProcessed: number; errors: any[] }> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    const errors: any[] = [];

    try {
      const account = await this.getAccount(accountId);

      // 1. Coletar posts recentes
      const posts = await this.collectRecentPosts(accountId, 50);
      itemsProcessed += posts.length;

      // 2. Para cada post, coletar métricas e comentários
      for (const post of posts) {
        try {
          const isStory = post.media_type === 'STORIES';
          const metrics = isStory
            ? await this.collectStoryMetrics(accountId, post.id)
            : await this.collectPostMetrics(accountId, post.id);

          await this.saveMetrics(account.organizationId, accountId, post.id, metrics);

          // Coletar comentários (stories não têm comentários diretos)
          if (!isStory) {
            const comments = await this.collectComments(accountId, post.id);
            await this.saveComments(account.organizationId, accountId, post.id, comments);
            itemsProcessed += comments.length;
          }
        } catch (error: any) {
          errors.push({ postId: post.id, error: error.message });
        }
      }

      // 3. Coletar métricas da conta
      const accountMetrics = await this.collectAccountMetrics(accountId);
      await this.saveMetrics(account.organizationId, accountId, null, accountMetrics);

      // 4. Coletar insights de audiência
      const audienceInsights = await this.collectAudienceInsights(accountId);
      await db.insert(socialMetrics).values({
        organizationId: account.organizationId,
        socialAccountId: accountId,
        socialPostId: null,
        platform: 'instagram',
        metricType: 'audience_demographics',
        value: '0',
        metadata: audienceInsights,
      });

      // 5. Criar log de sincronização
      const durationMs = Date.now() - startTime;
      await db.insert(socialSyncLogs).values({
        organizationId: account.organizationId,
        socialAccountId: accountId,
        syncType: 'metrics',
        status: errors.length === 0 ? 'success' : 'partial',
        itemsProcessed,
        errors,
        completedAt: new Date(),
        durationMs,
      });

      return {
        success: errors.length === 0,
        itemsProcessed,
        errors,
      };
    } catch (error: any) {
      await db.insert(socialSyncLogs).values({
        organizationId: (await this.getAccount(accountId)).organizationId,
        socialAccountId: accountId,
        syncType: 'metrics',
        status: 'failed',
        itemsProcessed,
        errors: [{ error: error.message }],
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Aguardar processamento de vídeo (polling)
   */
  private async waitForVideoProcessing(containerId: string, accessToken: string, maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.client.get(
        `/${containerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: accessToken,
          },
        }
      );

      const status = response.data.status_code;

      if (status === 'FINISHED') {
        return;
      }

      if (status === 'ERROR') {
        throw new Error('Video processing failed');
      }

      // Aguardar 2 segundos antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Video processing timeout');
  }

  private async getAccount(accountId: string): Promise<InstagramAccount> {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.isActive) {
      throw new Error('Account is not active');
    }

    return {
      id: account.id,
      organizationId: account.organizationId,
      accountId: account.accountId, // Instagram Business Account ID
      accessToken: this.decryptToken(account.accessToken),
      metadata: account.metadata as any,
    };
  }

  private async saveMetrics(
    organizationId: string,
    accountId: string,
    postId: string | null,
    metrics: InstagramMetrics
  ): Promise<void> {
    const entries = Object.entries(metrics);

    for (const [metricType, value] of entries) {
      if (value !== undefined) {
        await db.insert(socialMetrics).values({
          organizationId,
          socialAccountId: accountId,
          socialPostId: postId,
          platform: 'instagram',
          metricType,
          value: String(value),
        });
      }
    }
  }

  private async saveComments(
    organizationId: string,
    accountId: string,
    postId: string,
    comments: any[]
  ): Promise<void> {
    for (const comment of comments) {
      await db.insert(socialComments).values({
        organizationId,
        socialPostId: postId,
        platform: 'instagram',
        platformCommentId: comment.id,
        authorUsername: comment.username,
        content: comment.text,
        likesCount: comment.like_count || 0,
        publishedAt: new Date(comment.timestamp),
      });
    }
  }

  private decryptToken(encryptedToken: string): string {
    // TODO: Implementar criptografia real
    return encryptedToken;
  }
}

export const instagramService = new InstagramService();
