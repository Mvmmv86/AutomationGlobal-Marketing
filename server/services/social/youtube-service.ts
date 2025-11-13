/**
 * YouTube Data API Service
 *
 * Funcionalidades:
 * 1. PUBLICAÇÃO: Upload de vídeos, definir metadata, thumbnail, privacidade
 * 2. COLETA DE DADOS: Métricas de vídeos, canal, analytics, comentários
 *
 * APIs utilizadas:
 * - YouTube Data API v3
 * - YouTube Analytics API v2
 * - POST /youtube/v3/videos - Upload de vídeo
 * - POST /youtube/v3/thumbnails/set - Definir thumbnail
 * - GET /youtube/v3/videos - Dados do vídeo
 * - GET /youtube/v3/channels - Dados do canal
 * - GET /youtubeAnalytics/v2/reports - Analytics avançado
 * - GET /youtube/v3/commentThreads - Comentários
 *
 * IMPORTANTE: Requer OAuth 2.0 com scopes apropriados
 */

import axios, { AxiosInstance } from 'axios';
import { db } from '../../db';
import { socialAccounts, socialPosts, socialMetrics, socialComments, socialSyncLogs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import FormData from 'form-data';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';
const YOUTUBE_UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3';

interface YouTubeAccount {
  id: string;
  organizationId: string;
  accountId: string; // Channel ID
  accessToken: string;
  metadata: any;
}

interface UploadVideoParams {
  accountId: string; // socialAccountId na DB
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string; // 22 = People & Blogs, 24 = Entertainment, 28 = Science & Technology
  privacyStatus: 'public' | 'private' | 'unlisted';
  videoUrl: string; // URL do vídeo hospedado (ou buffer para upload direto)
  thumbnailUrl?: string;
  scheduledPublishAt?: Date;
}

interface YouTubeMetrics {
  // Métricas de Vídeo
  views?: number;
  likes?: number;
  dislikes?: number;
  comments?: number;
  shares?: number;
  averageViewDuration?: number; // segundos
  averageViewPercentage?: number; // 0-100
  subscribersGained?: number;
  subscribersLost?: number;

  // Métricas do Canal
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  estimatedMinutesWatched?: number;
}

export class YouTubeService {
  private client: AxiosInstance;
  private analyticsClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: YOUTUBE_API_BASE,
      timeout: 120000, // 2 minutos (uploads podem demorar)
    });

    this.analyticsClient = axios.create({
      baseURL: YOUTUBE_ANALYTICS_BASE,
      timeout: 30000,
    });
  }

  // ==========================================================================
  // UPLOAD DE VÍDEOS
  // ==========================================================================

  /**
   * Upload de vídeo para o YouTube
   *
   * Processo:
   * 1. Upload do vídeo (multipart)
   * 2. Definir thumbnail (opcional)
   * 3. Retornar video ID
   */
  async uploadVideo(params: UploadVideoParams): Promise<string> {
    const account = await this.getAccount(params.accountId);

    try {
      // Passo 1: Upload do vídeo
      const videoMetadata = {
        snippet: {
          title: params.title,
          description: params.description || '',
          tags: params.tags || [],
          categoryId: params.categoryId || '22', // Default: People & Blogs
        },
        status: {
          privacyStatus: params.privacyStatus,
          ...(params.scheduledPublishAt && {
            publishAt: params.scheduledPublishAt.toISOString(),
            privacyStatus: 'private', // Vídeos agendados são private até a hora de publicar
          }),
        },
      };

      // Fazer upload via resumable upload (para vídeos grandes)
      const videoId = await this.uploadVideoResumable(
        account.accessToken,
        params.videoUrl,
        videoMetadata
      );

      // Passo 2: Definir thumbnail (se fornecido)
      if (params.thumbnailUrl) {
        await this.setThumbnail(account.accessToken, videoId, params.thumbnailUrl);
      }

      return videoId;
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Upload resumable (para vídeos grandes)
   */
  private async uploadVideoResumable(
    accessToken: string,
    videoUrl: string,
    metadata: any
  ): Promise<string> {
    try {
      // Passo 1: Iniciar sessão de upload resumable
      const initResponse = await axios.post(
        `${YOUTUBE_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
        metadata,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*',
          },
        }
      );

      const uploadUrl = initResponse.headers['location'];

      // Passo 2: Baixar vídeo do URL (ou usar buffer diretamente)
      const videoBuffer = await this.downloadVideo(videoUrl);

      // Passo 3: Upload do vídeo
      const uploadResponse = await axios.put(uploadUrl, videoBuffer, {
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': videoBuffer.length,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return uploadResponse.data.id;
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Definir thumbnail do vídeo
   */
  private async setThumbnail(accessToken: string, videoId: string, thumbnailUrl: string): Promise<void> {
    try {
      const thumbnailBuffer = await this.downloadVideo(thumbnailUrl);

      await axios.post(
        `${YOUTUBE_API_BASE}/thumbnails/set`,
        thumbnailBuffer,
        {
          params: {
            videoId,
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'image/jpeg',
          },
        }
      );
    } catch (error: any) {
      console.warn(`Failed to set thumbnail: ${error.message}`);
    }
  }

  /**
   * Atualizar vídeo (editar metadata)
   */
  async updateVideo(
    accountId: string,
    videoId: string,
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      privacyStatus?: 'public' | 'private' | 'unlisted';
    }
  ): Promise<void> {
    const account = await this.getAccount(accountId);

    try {
      await this.client.put(
        '/videos',
        {
          id: videoId,
          snippet: {
            title: updates.title,
            description: updates.description,
            tags: updates.tags,
          },
          status: {
            privacyStatus: updates.privacyStatus,
          },
        },
        {
          params: {
            part: 'snippet,status',
            access_token: account.accessToken,
          },
        }
      );
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - VÍDEOS
  // ==========================================================================

  /**
   * Coletar métricas de um vídeo específico
   */
  async collectVideoMetrics(accountId: string, videoId: string): Promise<YouTubeMetrics> {
    const account = await this.getAccount(accountId);

    try {
      // Dados básicos do vídeo (views, likes, comments)
      const videoResponse = await this.client.get('/videos', {
        params: {
          part: 'statistics',
          id: videoId,
          access_token: account.accessToken,
        },
      });

      const stats = videoResponse.data.items[0]?.statistics;

      const metrics: YouTubeMetrics = {
        views: parseInt(stats?.viewCount || '0'),
        likes: parseInt(stats?.likeCount || '0'),
        dislikes: parseInt(stats?.dislikeCount || '0'),
        comments: parseInt(stats?.commentCount || '0'),
      };

      // Analytics avançado (retention, average view duration, etc.)
      try {
        const analytics = await this.collectVideoAnalytics(account.accessToken, videoId);
        Object.assign(metrics, analytics);
      } catch (error) {
        // Analytics pode não estar disponível para vídeos muito novos
        console.warn('Analytics not available for video:', videoId);
      }

      return metrics;
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar analytics avançado de um vídeo
   */
  private async collectVideoAnalytics(accessToken: string, videoId: string): Promise<Partial<YouTubeMetrics>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000); // Últimos 28 dias

      const response = await this.analyticsClient.get('/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          metrics: 'averageViewDuration,averageViewPercentage,shares,subscribersGained,subscribersLost',
          dimensions: 'video',
          filters: `video==${videoId}`,
          access_token: accessToken,
        },
      });

      const row = response.data.rows?.[0];
      if (!row) return {};

      return {
        averageViewDuration: row[1],
        averageViewPercentage: row[2],
        shares: row[3],
        subscribersGained: row[4],
        subscribersLost: row[5],
      };
    } catch (error: any) {
      console.warn('Could not fetch analytics:', error.message);
      return {};
    }
  }

  /**
   * Coletar todos os vídeos recentes
   */
  async collectRecentVideos(accountId: string, maxResults: number = 50): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get('/search', {
        params: {
          part: 'snippet',
          channelId: account.accountId,
          type: 'video',
          order: 'date',
          maxResults,
          access_token: account.accessToken,
        },
      });

      return response.data.items || [];
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==========================================================================
  // COLETA DE DADOS - CANAL
  // ==========================================================================

  /**
   * Coletar métricas do canal
   */
  async collectChannelMetrics(accountId: string): Promise<YouTubeMetrics> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get('/channels', {
        params: {
          part: 'statistics',
          id: account.accountId,
          access_token: account.accessToken,
        },
      });

      const stats = response.data.items[0]?.statistics;

      return {
        subscriberCount: parseInt(stats?.subscriberCount || '0'),
        videoCount: parseInt(stats?.videoCount || '0'),
        viewCount: parseInt(stats?.viewCount || '0'),
      };
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar analytics do canal (últimos 28 dias)
   */
  async collectChannelAnalytics(accountId: string): Promise<any> {
    const account = await this.getAccount(accountId);

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);

      const response = await this.analyticsClient.get('/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          metrics: 'views,estimatedMinutesWatched,subscribersGained,subscribersLost',
          dimensions: 'day',
          access_token: account.accessToken,
        },
      });

      return response.data.rows || [];
    } catch (error: any) {
      throw new Error(`YouTube Analytics Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Coletar traffic sources (de onde vem as views)
   */
  async collectTrafficSources(accountId: string): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);

      const response = await this.analyticsClient.get('/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          metrics: 'views',
          dimensions: 'insightTrafficSourceType',
          sort: '-views',
          access_token: account.accessToken,
        },
      });

      return response.data.rows || [];
    } catch (error: any) {
      console.warn('Could not fetch traffic sources:', error.message);
      return [];
    }
  }

  /**
   * Coletar demografia da audiência
   */
  async collectAudienceDemographics(accountId: string): Promise<any> {
    const account = await this.getAccount(accountId);

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);

      // Idade e gênero
      const demographicsResponse = await this.analyticsClient.get('/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          metrics: 'viewerPercentage',
          dimensions: 'ageGroup,gender',
          access_token: account.accessToken,
        },
      });

      // Geografia
      const geographyResponse = await this.analyticsClient.get('/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          metrics: 'views',
          dimensions: 'country',
          sort: '-views',
          maxResults: 25,
          access_token: account.accessToken,
        },
      });

      return {
        demographics: demographicsResponse.data.rows || [],
        geography: geographyResponse.data.rows || [],
      };
    } catch (error: any) {
      console.warn('Could not fetch demographics:', error.message);
      return { demographics: [], geography: [] };
    }
  }

  // ==========================================================================
  // COLETA DE COMENTÁRIOS
  // ==========================================================================

  /**
   * Coletar comentários de um vídeo
   */
  async collectComments(accountId: string, videoId: string): Promise<any[]> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.get('/commentThreads', {
        params: {
          part: 'snippet',
          videoId,
          maxResults: 100,
          order: 'time',
          access_token: account.accessToken,
        },
      });

      return response.data.items || [];
    } catch (error: any) {
      // Comentários podem estar desabilitados
      console.warn(`Could not fetch comments for ${videoId}:`, error.message);
      return [];
    }
  }

  /**
   * Responder a um comentário
   */
  async replyToComment(accountId: string, commentId: string, text: string): Promise<string> {
    const account = await this.getAccount(accountId);

    try {
      const response = await this.client.post(
        '/comments',
        {
          snippet: {
            parentId: commentId,
            textOriginal: text,
          },
        },
        {
          params: {
            part: 'snippet',
            access_token: account.accessToken,
          },
        }
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`);
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

      // 1. Coletar vídeos recentes
      const videos = await this.collectRecentVideos(accountId, 50);
      itemsProcessed += videos.length;

      // 2. Para cada vídeo, coletar métricas e comentários
      for (const video of videos) {
        try {
          const videoId = video.id.videoId;
          const metrics = await this.collectVideoMetrics(accountId, videoId);

          await this.saveMetrics(account.organizationId, accountId, videoId, metrics);

          // Coletar comentários
          const comments = await this.collectComments(accountId, videoId);
          await this.saveComments(account.organizationId, accountId, videoId, comments);
          itemsProcessed += comments.length;
        } catch (error: any) {
          errors.push({ videoId: video.id.videoId, error: error.message });
        }
      }

      // 3. Coletar métricas do canal
      const channelMetrics = await this.collectChannelMetrics(accountId);
      await this.saveMetrics(account.organizationId, accountId, null, channelMetrics);

      // 4. Coletar analytics do canal
      const channelAnalytics = await this.collectChannelAnalytics(accountId);
      const trafficSources = await this.collectTrafficSources(accountId);
      const demographics = await this.collectAudienceDemographics(accountId);

      // Salvar como metadata
      await db.insert(socialMetrics).values({
        organizationId: account.organizationId,
        socialAccountId: accountId,
        socialPostId: null,
        platform: 'youtube',
        metricType: 'channel_analytics',
        value: '0',
        metadata: {
          analytics: channelAnalytics,
          trafficSources,
          demographics,
        },
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

  private async getAccount(accountId: string): Promise<YouTubeAccount> {
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
      accountId: account.accountId, // Channel ID
      accessToken: this.decryptToken(account.accessToken),
      metadata: account.metadata as any,
    };
  }

  private async downloadVideo(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  private async saveMetrics(
    organizationId: string,
    accountId: string,
    videoId: string | null,
    metrics: YouTubeMetrics
  ): Promise<void> {
    const entries = Object.entries(metrics);

    for (const [metricType, value] of entries) {
      if (value !== undefined) {
        await db.insert(socialMetrics).values({
          organizationId,
          socialAccountId: accountId,
          socialPostId: videoId,
          platform: 'youtube',
          metricType,
          value: String(value),
        });
      }
    }
  }

  private async saveComments(
    organizationId: string,
    accountId: string,
    videoId: string,
    comments: any[]
  ): Promise<void> {
    for (const commentThread of comments) {
      const comment = commentThread.snippet.topLevelComment.snippet;

      await db.insert(socialComments).values({
        organizationId,
        socialPostId: videoId,
        platform: 'youtube',
        platformCommentId: commentThread.snippet.topLevelComment.id,
        authorName: comment.authorDisplayName,
        authorAvatarUrl: comment.authorProfileImageUrl,
        content: comment.textOriginal,
        likesCount: comment.likeCount || 0,
        publishedAt: new Date(comment.publishedAt),
      });
    }
  }

  private decryptToken(encryptedToken: string): string {
    // TODO: Implementar criptografia real
    return encryptedToken;
  }
}

export const youtubeService = new YouTubeService();
