/**
 * OAuth Service
 *
 * Gerencia OAuth flow para conectar contas do Facebook, Instagram e YouTube
 *
 * Fluxos suportados:
 * 1. Facebook/Instagram: OAuth 2.0 via Facebook Login
 * 2. YouTube: OAuth 2.0 via Google
 */

import axios from 'axios';
import { db } from '../../db';
import { socialAccounts } from '../../../shared/schema';
import { tokenEncryption } from './token-encryption';

const FACEBOOK_OAUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

interface OAuthConfig {
  facebook: {
    appId: string;
    appSecret: string;
    redirectUri: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export class OAuthService {
  private config: OAuthConfig;

  constructor() {
    this.config = {
      facebook: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/social/facebook/callback',
      },
      youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || '',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/api/social/youtube/callback',
      },
    };
  }

  // ==========================================================================
  // FACEBOOK / INSTAGRAM OAUTH
  // ==========================================================================

  /**
   * Gerar URL de autorização do Facebook
   */
  getFacebookAuthUrl(state: string): string {
    const scopes = [
      'pages_manage_posts',        // Publicar posts em páginas
      'pages_read_engagement',     // Ler engajamento de páginas
      'pages_show_list',           // Listar páginas
      'instagram_basic',           // Acesso básico Instagram
      'instagram_content_publish', // Publicar no Instagram
      'business_management',       // Gerenciar negócios
      'pages_manage_metadata',     // Gerenciar metadata de páginas
    ];

    const params = new URLSearchParams({
      client_id: this.config.facebook.appId,
      redirect_uri: this.config.facebook.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state,
    });

    return `${FACEBOOK_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Trocar code por access token (Facebook)
   */
  async exchangeFacebookCode(code: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.get(FACEBOOK_TOKEN_URL, {
        params: {
          client_id: this.config.facebook.appId,
          client_secret: this.config.facebook.appSecret,
          redirect_uri: this.config.facebook.redirectUri,
          code,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // 60 dias
      };
    } catch (error: any) {
      throw new Error(`Facebook OAuth error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Obter long-lived token (Facebook)
   * Short-lived tokens expiram em 1h, long-lived em 60 dias
   */
  async getLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.get(FACEBOOK_GRAPH_URL + '/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.facebook.appId,
          client_secret: this.config.facebook.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000,
      };
    } catch (error: any) {
      throw new Error(`Failed to get long-lived token: ${error.message}`);
    }
  }

  /**
   * Listar páginas do Facebook que o usuário gerencia
   */
  async getFacebookPages(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,category,picture',
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Failed to get Facebook pages: ${error.message}`);
    }
  }

  /**
   * Obter Instagram Business Account conectada a uma página
   */
  async getInstagramAccount(pageId: string, pageAccessToken: string): Promise<any | null> {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_URL}/${pageId}`, {
        params: {
          fields: 'instagram_business_account{id,username,profile_picture_url}',
          access_token: pageAccessToken,
        },
      });

      return response.data.instagram_business_account || null;
    } catch (error: any) {
      console.warn('Instagram account not found for page:', pageId);
      return null;
    }
  }

  /**
   * Conectar conta do Facebook (salvar no banco)
   */
  async connectFacebookAccount(
    organizationId: string,
    pageId: string,
    pageName: string,
    pageAccessToken: string
  ): Promise<string> {
    try {
      // Criptografar token
      const encryptedToken = tokenEncryption.encrypt(pageAccessToken);

      // Calcular expiração (60 dias)
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      // Salvar no banco
      const [account] = await db
        .insert(socialAccounts)
        .values({
          organizationId,
          platform: 'facebook',
          accountId: pageId,
          accountName: pageName,
          accessToken: encryptedToken,
          tokenExpiresAt: expiresAt,
          isActive: true,
          metadata: { page_id: pageId },
        })
        .returning();

      return account.id;
    } catch (error: any) {
      throw new Error(`Failed to connect Facebook account: ${error.message}`);
    }
  }

  /**
   * Conectar conta do Instagram (salvar no banco)
   */
  async connectInstagramAccount(
    organizationId: string,
    igUserId: string,
    igUsername: string,
    pageAccessToken: string,
    pageId: string
  ): Promise<string> {
    try {
      // Criptografar token
      const encryptedToken = tokenEncryption.encrypt(pageAccessToken);

      // Calcular expiração (60 dias)
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      // Salvar no banco
      const [account] = await db
        .insert(socialAccounts)
        .values({
          organizationId,
          platform: 'instagram',
          accountId: igUserId,
          accountName: igUsername,
          accountUsername: igUsername,
          accessToken: encryptedToken,
          tokenExpiresAt: expiresAt,
          isActive: true,
          metadata: {
            business_account_id: igUserId,
            page_id: pageId,
          },
        })
        .returning();

      return account.id;
    } catch (error: any) {
      throw new Error(`Failed to connect Instagram account: ${error.message}`);
    }
  }

  // ==========================================================================
  // YOUTUBE (GOOGLE) OAUTH
  // ==========================================================================

  /**
   * Gerar URL de autorização do Google/YouTube
   */
  getYouTubeAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',          // Upload de vídeos
      'https://www.googleapis.com/auth/youtube',                 // Gerenciar canal
      'https://www.googleapis.com/auth/youtube.readonly',        // Ler dados
      'https://www.googleapis.com/auth/yt-analytics.readonly',   // Analytics
    ];

    const params = new URLSearchParams({
      client_id: this.config.youtube.clientId,
      redirect_uri: this.config.youtube.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Para obter refresh token
      prompt: 'consent',      // Forçar consent para garantir refresh token
      state,
    });

    return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Trocar code por access token (YouTube/Google)
   */
  async exchangeYouTubeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(
        GOOGLE_TOKEN_URL,
        {
          client_id: this.config.youtube.clientId,
          client_secret: this.config.youtube.clientSecret,
          code,
          redirect_uri: this.config.youtube.redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 3600,
      };
    } catch (error: any) {
      throw new Error(`YouTube OAuth error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh token do YouTube
   */
  async refreshYouTubeToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(
        GOOGLE_TOKEN_URL,
        {
          client_id: this.config.youtube.clientId,
          client_secret: this.config.youtube.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 3600,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh YouTube token: ${error.message}`);
    }
  }

  /**
   * Obter dados do canal do YouTube
   */
  async getYouTubeChannel(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
        params: {
          part: 'snippet,statistics',
          mine: true,
          access_token: accessToken,
        },
      });

      const channel = response.data.items?.[0];
      if (!channel) {
        throw new Error('No YouTube channel found');
      }

      return channel;
    } catch (error: any) {
      throw new Error(`Failed to get YouTube channel: ${error.message}`);
    }
  }

  /**
   * Conectar conta do YouTube (salvar no banco)
   */
  async connectYouTubeAccount(
    organizationId: string,
    channelId: string,
    channelTitle: string,
    accessToken: string,
    refreshToken: string
  ): Promise<string> {
    try {
      // Criptografar tokens
      const encryptedAccessToken = tokenEncryption.encrypt(accessToken);
      const encryptedRefreshToken = tokenEncryption.encrypt(refreshToken);

      // Calcular expiração (1 hora para access token)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Salvar no banco
      const [account] = await db
        .insert(socialAccounts)
        .values({
          organizationId,
          platform: 'youtube',
          accountId: channelId,
          accountName: channelTitle,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: expiresAt,
          isActive: true,
          metadata: { channel_id: channelId },
        })
        .returning();

      return account.id;
    } catch (error: any) {
      throw new Error(`Failed to connect YouTube account: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Verificar se as credenciais estão configuradas
   */
  isConfigured(platform: 'facebook' | 'youtube'): boolean {
    if (platform === 'facebook') {
      return !!(this.config.facebook.appId && this.config.facebook.appSecret);
    }

    if (platform === 'youtube') {
      return !!(this.config.youtube.clientId && this.config.youtube.clientSecret);
    }

    return false;
  }
}

// Exportar instância singleton
export const oauthService = new OAuthService();
