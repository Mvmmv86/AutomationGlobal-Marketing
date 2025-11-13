/**
 * Facebook Graph API Service
 *
 * Funcionalidades:
 * 1. PUBLICAÇÃO: Posts com texto, foto, vídeo, múltiplas fotos
 * 2. COLETA DE DADOS: Métricas de posts, página, comentários, insights de audiência
 *
 * APIs utilizadas:
 * - Facebook Graph API v18.0
 * - POST /{page-id}/feed - Publicar post com texto
 * - POST /{page-id}/photos - Publicar post com foto
 * - POST /{page-id}/videos - Publicar post com vídeo
 * - GET /{page-id}/posts - Listar posts
 * - GET /{post-id}/insights - Métricas do post
 * - GET /{page-id}/insights - Métricas da página
 * - GET /{post-id}/comments - Comentários
 */

import axios, { AxiosInstance } from 'axios';
import { db } from '../../db';
import { socialAccounts, socialPosts, socialMetrics, socialComments, socialSyncLogs } from '../../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import crypto from 'crypto';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_API_BASE = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

interface FacebookAccount {
  id: string;
  organizationId: string;
  accountId: string; // Page ID
  accessToken: string; // Decrypted token
  metadata: any;
}

interface PublishPostParams {
  accountId: string; // socialAccountId na DB
  content?: string;
  mediaType?: 'text' | 'photo' | 'video' | 'photos';
  mediaUrls?: string[];
  scheduledTime?: Date;
}

interface FacebookPostResponse {
  id: string; // Post ID do Facebook
  post_id?: string; // Formato {page-id}_{post-id}
}

interface FacebookMetrics {
  // Métricas de Post
  post_impressions?: number;
  post_engaged_users?: number;
  post_reactions_like_total?: number;
  post_reactions_love_total?: number;
  post_reactions_wow_total?: number;
  post_reactions_haha_total?: number;
  post_reactions_sorry_total?: number;
  post_reactions_anger_total?: number;
  post_clicks?: number;
  post_comments?: number;
  post_shares?: number;

  // Métricas da Página
  page_fans?: number;
  page_fan_adds?: number;
  page_impressions?: number;
  page_engaged_users?: number;
  page_post_engagements?: number;
}

export class FacebookService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: FACEBOOK_API_BASE,
      timeout: 30000,
    });
  }

  // ==========================================================================
  // PUBLICAÇÃO DE POSTS
  // ==========================================================================

  /**
   * Publicar post com texto simples
   */
  async publishTextPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    try {
      const response = await this.client.post<FacebookPostResponse>(
        `/${account.accountId}/feed`,
        {
          message: params.content,
          access_token: account.accessToken,
          ...(params.scheduledTime && {
            scheduled_publish_time: Math.floor(params.scheduledTime.getTime() / 1000),
            published: false,
          }),
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publicar post com foto
   */
  async publishPhotoPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URL is required for photo posts');
    }

    try {
      const response = await this.client.post<FacebookPostResponse>(
        `/${account.accountId}/photos`,
        {
          url: params.mediaUrls[0], // URL da imagem hospedada
          caption: params.content || '',
          access_token: account.accessToken,
          ...(params.scheduledTime && {
            scheduled_publish_time: Math.floor(params.scheduledTime.getTime() / 1000),
            published: false,
          }),
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publicar post com múltiplas fotos (carousel)
   */
  async publishMultiplePhotosPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URLs are required');
    }

    try {
      // Passo 1: Upload de cada foto e obter IDs
      const photoIds: string[] = [];

      for (const url of params.mediaUrls) {
        const photoResponse = await this.client.post<{ id: string }>(
          `/${account.accountId}/photos`,
          {
            url,
            published: false, // Não publicar ainda
            access_token: account.accessToken,
          }
        );
        photoIds.push(photoResponse.data.id);
      }

      // Passo 2: Criar post com as fotos
      const response = await this.client.post<FacebookPostResponse>(
        `/${account.accountId}/feed`,
        {
          message: params.content || '',
          attached_media: photoIds.map(id => ({ media_fbid: id })),
          access_token: account.accessToken,
          ...(params.scheduledTime && {
            scheduled_publish_time: Math.floor(params.scheduledTime.getTime() / 1000),
            published: false,
          }),
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publicar vídeo
   */
  async publishVideoPost(params: PublishPostParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    if (!params.mediaUrls || params.mediaUrls.length === 0) {
      throw new Error('Media URL is required for video posts');
    }

    try {
      const response = await this.client.post<FacebookPostResponse>(
        `/${account.accountId}/videos`,
        {
          file_url: params.mediaUrls[0], // URL do vídeo hospedado
          description: params.content || '',
          access_token: account.accessToken,
          ...(params.scheduledTime && {
            scheduled_publish_time: Math.floor(params.scheduledTime.getTime() / 1000),
            published: false,
          }),
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - POSTS
  // ==========================================================================

  /**
   * Coletar métricas de um post específico
   */
  async collectPostMetrics(accountId: string, platformPostId: string): Promise<FacebookMetrics> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${platformPostId}/insights`,
        {
          params: {
            metric: [
              'post_impressions',
              'post_engaged_users',
              'post_reactions_like_total',
              'post_reactions_love_total',
              'post_reactions_wow_total',
              'post_reactions_haha_total',
              'post_reactions_sorry_total',
              'post_reactions_anger_total',
              'post_clicks',
            ].join(','),
            access_token: account.accessToken,
          },
        }
      );

      // Coletar também comentários e compartilhamentos do post
      const postData = await this.client.get(
        `/${platformPostId}`,
        {
          params: {
            fields: 'shares,comments.summary(true)',
            access_token: account.accessToken,
          },
        }
      );

      // Transformar dados da API em formato simples
      const metrics: FacebookMetrics = {};

      response.data.data.forEach((metric: any) => {
        const value = metric.values[0]?.value || 0;
        metrics[metric.name as keyof FacebookMetrics] = value;
      });

      metrics.post_comments = postData.data.comments?.summary?.total_count || 0;
      metrics.post_shares = postData.data.shares?.count || 0;

      return metrics;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar todos os posts recentes de uma página
   */
  async collectRecentPosts(accountId: string, since?: Date): Promise<any[]> {
    const account = await this.getAccount(accountId);
    const sinceTimestamp = since ? Math.floor(since.getTime() / 1000) : undefined;

    try {
      const response = await this.client.get(
        `/${account.accountId}/posts`,
        {
          params: {
            fields: 'id,message,created_time,full_picture,permalink_url,shares,comments.summary(true),reactions.summary(true)',
            access_token: account.accessToken,
            ...(sinceTimestamp && { since: sinceTimestamp }),
            limit: 100, // Máximo por request
          },
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - PÁGINA
  // ==========================================================================

  /**
   * Coletar métricas da página
   */
  async collectPageMetrics(accountId: string): Promise<FacebookMetrics> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${account.accountId}/insights`,
        {
          params: {
            metric: [
              'page_fans',
              'page_fan_adds',
              'page_impressions',
              'page_engaged_users',
              'page_post_engagements',
            ].join(','),
            period: 'day',
            access_token: account.accessToken,
          },
        }
      );

      const metrics: FacebookMetrics = {};

      response.data.data.forEach((metric: any) => {
        const value = metric.values[metric.values.length - 1]?.value || 0;
        metrics[metric.name as keyof FacebookMetrics] = value;
      });

      return metrics;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar insights de audiência (demografia)
   */
  async collectAudienceInsights(accountId: string): Promise<any> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${account.accountId}/insights`,
        {
          params: {
            metric: [
              'page_fans_country',
              'page_fans_city',
              'page_fans_gender_age',
            ].join(','),
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
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE COMENTÁRIOS
  // ==========================================================================

  /**
   * Coletar comentários de um post
   */
  async collectComments(accountId: string, platformPostId: string): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get(
        `/${platformPostId}/comments`,
        {
          params: {
            fields: 'id,from,message,created_time,like_count,parent',
            access_token: account.accessToken,
            limit: 100,
          },
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Responder a um comentário
   */
  async replyToComment(accountId: string, commentId: string, message: string): Promise<string> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.post(
        `/${commentId}/comments`,
        {
          message,
          access_token: account.accessToken,
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO COMPLETA
  // ==========================================================================

  /**
   * Sincronizar todos os dados de uma conta
   * - Posts recentes
   * - Métricas dos posts
   * - Métricas da página
   * - Comentários
   */
  async syncAccount(accountId: string): Promise<{ success: boolean; itemsProcessed: number; errors: any[] }> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    const errors: any[] = [];

    try {
      const account = await this.getAccount(accountId);

      // 1. Coletar posts dos últimos 7 dias
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const posts = await this.collectRecentPosts(accountId, since);
      itemsProcessed += posts.length;

      // 2. Para cada post, coletar métricas e salvar no banco
      for (const post of posts) {
        try {
          const metrics = await this.collectPostMetrics(accountId, post.id);

          // Salvar métricas no banco
          await this.saveMetrics(account.organizationId, accountId, post.id, metrics);

          // Coletar comentários
          const comments = await this.collectComments(accountId, post.id);
          await this.saveComments(account.organizationId, accountId, post.id, comments);

          itemsProcessed += comments.length;
        } catch (error: any) {
          errors.push({ postId: post.id, error: error.message });
        }
      }

      // 3. Coletar métricas da página
      const pageMetrics = await this.collectPageMetrics(accountId);
      await this.saveMetrics(account.organizationId, accountId, null, pageMetrics);

      // 4. Coletar insights de audiência
      const audienceInsights = await this.collectAudienceInsights(accountId);
      // Salvar como metadata em uma métrica especial
      await db.insert(socialMetrics).values({
        organizationId: account.organizationId,
        socialAccountId: accountId,
        socialPostId: null,
        platform: 'facebook',
        metricType: 'audience_demographics',
        value: '0', // Valor simbólico
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
      // Log de erro
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

  private async getAccount(accountId: string): Promise<FacebookAccount> {
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

    // Descriptografar token (implementar depois)
    const decryptedToken = this.decryptToken(account.accessToken);

    return {
      id: account.id,
      organizationId: account.organizationId,
      accountId: account.accountId, // Page ID
      accessToken: decryptedToken,
      metadata: account.metadata as any,
    };
  }

  private async saveMetrics(
    organizationId: string,
    accountId: string,
    postId: string | null,
    metrics: FacebookMetrics
  ): Promise<void> {
    const entries = Object.entries(metrics);

    for (const [metricType, value] of entries) {
      if (value !== undefined) {
        await db.insert(socialMetrics).values({
          organizationId,
          socialAccountId: accountId,
          socialPostId: postId,
          platform: 'facebook',
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
        socialPostId: postId, // TODO: Mapear platformPostId para UUID
        platform: 'facebook',
        platformCommentId: comment.id,
        authorId: comment.from?.id,
        authorName: comment.from?.name,
        content: comment.message,
        likesCount: comment.like_count || 0,
        publishedAt: new Date(comment.created_time),
      });
    }
  }

  private decryptToken(encryptedToken: string): string {
    // TODO: Implementar criptografia real
    // Por enquanto, retorna o token como está
    return encryptedToken;
  }

  private encryptToken(token: string): string {
    // TODO: Implementar criptografia real
    return token;
  }
}

export const facebookService = new FacebookService();
