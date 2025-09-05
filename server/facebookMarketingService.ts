import { Request, Response } from "express";
import { db } from "./storage";
import { socialMediaCampaigns, socialMediaAccounts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Facebook Marketing API Service
 * Integração completa com Facebook Ads Manager para criar campanhas reais
 */

interface FacebookCampaignData {
  name: string;
  objective: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  campaign_type?: string;
  start_time?: string;
  end_time?: string;
}

interface FacebookAdAccount {
  id: string;
  name: string;
  account_status: string;
  currency: string;
  timezone_name: string;
}

export class FacebookMarketingService {
  
  /**
   * Cria uma campanha REAL no Facebook Ads Manager
   */
  async createFacebookCampaign(req: Request, res: Response) {
    try {
      const { 
        name, 
        description, 
        type, 
        dailyBudget, 
        totalBudget,
        adAccountId 
      } = req.body;
      
      const organizationId = req.headers['x-organization-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      console.log('🎯 Criando campanha REAL no Facebook Ads:', { name, type, dailyBudget });

      // 1. Buscar conta Facebook conectada da organização
      const [facebookAccount] = await db
        .select()
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.organizationId, organizationId),
          eq(socialMediaAccounts.platform, 'facebook'),
          eq(socialMediaAccounts.isActive, true)
        ));

      if (!facebookAccount || !facebookAccount.accessToken) {
        // Se não tem Facebook conectado, criar campanha local apenas
        console.log('⚠️ Facebook não conectado - criando campanha local');
        
        const [campaign] = await db.insert(socialMediaCampaigns).values({
          organizationId,
          name,
          description: description || '',
          type,
          status: 'active',
          isConnectedToFacebook: false,
          createdBy: userId || '550e8400-e29b-41d4-a716-446655440002',
          // Garantir que todos os campos obrigatórios tenham valores válidos
          facebookCampaignId: null,
          facebookAdAccountId: null,
          facebookStatus: null,
          facebookObjective: null,
          dailyBudget: null,
          totalBudget: null,
          lastSyncAt: null,
          facebookMetadata: null,
        }).returning();

        return res.json({
          success: true,
          data: campaign,
          facebook: {
            connected: false,
            message: "Campanha criada localmente. Conecte sua conta Facebook para sincronizar com o Ads Manager."
          }
        });
      }

      // 2. Obter token de acesso descriptografado
      const accessToken = this.decryptToken(facebookAccount.accessToken);
      
      // 3. Mapear tipo da plataforma para objetivo Facebook
      const facebookObjective = this.mapTypeToFacebookObjective(type);
      
      // 4. Preparar dados da campanha para Facebook API
      const campaignData: FacebookCampaignData = {
        name: name,
        objective: facebookObjective,
        status: 'PAUSED', // Criar pausada para configuração manual
        ...(dailyBudget && { daily_budget: Math.round(parseFloat(dailyBudget) * 100) }), // Converter para centavos
        ...(totalBudget && { lifetime_budget: Math.round(parseFloat(totalBudget) * 100) })
      };

      // 5. Criar campanha no Facebook via API
      const facebookResponse = await this.createCampaignInFacebook(
        adAccountId || facebookAccount.accountData?.ad_accounts?.[0]?.id,
        campaignData,
        accessToken
      );

      // 6. Salvar campanha na plataforma com ID do Facebook
      const [campaign] = await db.insert(socialMediaCampaigns).values({
        organizationId,
        name,
        description: description || '',
        type,
        status: 'active',
        facebookCampaignId: facebookResponse.id,
        facebookAdAccountId: adAccountId || facebookAccount.accountData?.ad_accounts?.[0]?.id,
        facebookStatus: facebookResponse.status,
        facebookObjective: facebookObjective,
        dailyBudget: dailyBudget?.toString() || null,
        totalBudget: totalBudget?.toString() || null,
        isConnectedToFacebook: true,
        lastSyncAt: new Date(),
        facebookMetadata: facebookResponse,
        createdBy: userId || '550e8400-e29b-41d4-a716-446655440002',
      }).returning();

      console.log('✅ Campanha criada no Facebook:', facebookResponse.id);

      res.json({
        success: true,
        data: campaign,
        facebook: {
          campaignId: facebookResponse.id,
          status: facebookResponse.status,
          objective: facebookObjective,
          message: "Campanha criada com sucesso no Facebook Ads Manager!"
        }
      });

    } catch (error) {
      console.error('❌ Erro ao criar campanha no Facebook:', error);
      res.status(500).json({
        error: error.message || "Falha ao criar campanha no Facebook",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Sincroniza campanhas existentes do Facebook para a plataforma
   */
  async syncFacebookCampaigns(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      // Buscar conta Facebook
      const [facebookAccount] = await db
        .select()
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.organizationId, organizationId),
          eq(socialMediaAccounts.platform, 'facebook'),
          eq(socialMediaAccounts.isActive, true)
        ));

      if (!facebookAccount) {
        return res.status(400).json({
          error: "Conta Facebook não encontrada"
        });
      }

      const accessToken = this.decryptToken(facebookAccount.accessToken);
      
      // Buscar campanhas no Facebook
      const facebookCampaigns = await this.getFacebookCampaigns(
        facebookAccount.accountData?.ad_accounts?.[0]?.id,
        accessToken
      );

      const syncedCampaigns = [];

      // Importar campanhas que não existem na plataforma
      for (const fbCampaign of facebookCampaigns.data || []) {
        const [existingCampaign] = await db
          .select()
          .from(socialMediaCampaigns)
          .where(eq(socialMediaCampaigns.facebookCampaignId, fbCampaign.id));

        if (!existingCampaign) {
          const [imported] = await db.insert(socialMediaCampaigns).values({
            organizationId,
            name: fbCampaign.name,
            description: `Importada do Facebook: ${fbCampaign.objective}`,
            type: this.mapFacebookObjectiveToType(fbCampaign.objective),
            status: 'active',
            facebookCampaignId: fbCampaign.id,
            facebookAdAccountId: facebookAccount.accountData?.ad_accounts?.[0]?.id,
            facebookStatus: fbCampaign.status,
            facebookObjective: fbCampaign.objective,
            isConnectedToFacebook: true,
            lastSyncAt: new Date(),
            facebookMetadata: fbCampaign,
            createdBy: facebookAccount.createdBy,
          }).returning();
          
          syncedCampaigns.push(imported);
        }
      }

      res.json({
        success: true,
        imported: syncedCampaigns.length,
        campaigns: syncedCampaigns,
        message: `${syncedCampaigns.length} campanhas importadas do Facebook`
      });

    } catch (error) {
      console.error('❌ Erro ao sincronizar campanhas Facebook:', error);
      res.status(500).json({
        error: "Falha ao sincronizar campanhas",
        details: error.message
      });
    }
  }

  /**
   * Obter contas de anúncios do Facebook
   */
  async getFacebookAdAccounts(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      const [facebookAccount] = await db
        .select()
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.organizationId, organizationId),
          eq(socialMediaAccounts.platform, 'facebook'),
          eq(socialMediaAccounts.isActive, true)
        ));

      if (!facebookAccount) {
        return res.status(400).json({
          error: "Conta Facebook não conectada"
        });
      }

      const accessToken = this.decryptToken(facebookAccount.accessToken);
      const adAccounts = await this.fetchFacebookAdAccounts(accessToken);

      res.json({
        success: true,
        adAccounts: adAccounts.data || [],
        message: "Contas de anúncios carregadas"
      });

    } catch (error) {
      console.error('❌ Erro ao buscar contas Facebook:', error);
      res.status(500).json({
        error: "Falha ao carregar contas de anúncios",
        details: error.message
      });
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private decryptToken(encryptedToken: string): string {
    // Implementar descriptografia (mesmo método do socialMediaService)
    try {
      // Por agora, assumindo que o token não está criptografado para desenvolvimento
      return encryptedToken;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return '';
    }
  }

  /**
   * Mapear tipos da plataforma para objetivos Facebook
   */
  private mapTypeToFacebookObjective(type: string): string {
    const mapping: Record<string, string> = {
      'awareness': 'BRAND_AWARENESS',
      'traffic': 'LINK_CLICKS',
      'engagement': 'POST_ENGAGEMENT',
      'leads': 'LEAD_GENERATION',
      'app_promotion': 'APP_INSTALLS',
      'sales': 'CONVERSIONS',
      'reach': 'REACH',
      'brand_awareness': 'BRAND_AWARENESS',
      'video_views': 'VIDEO_VIEWS',
      'messages': 'MESSAGES',
      'conversion': 'CONVERSIONS',
      'store_visits': 'STORE_VISITS'
    };

    return mapping[type] || 'BRAND_AWARENESS';
  }

  /**
   * Mapear objetivos Facebook para tipos da plataforma
   */
  private mapFacebookObjectiveToType(objective: string): string {
    const mapping: Record<string, string> = {
      'BRAND_AWARENESS': 'brand_awareness',
      'LINK_CLICKS': 'traffic',
      'POST_ENGAGEMENT': 'engagement',
      'LEAD_GENERATION': 'leads',
      'APP_INSTALLS': 'app_promotion',
      'CONVERSIONS': 'conversion',
      'REACH': 'reach',
      'VIDEO_VIEWS': 'video_views',
      'MESSAGES': 'messages',
      'STORE_VISITS': 'store_visits'
    };

    return mapping[objective] || 'awareness';
  }

  /**
   * Criar campanha via Facebook Marketing API
   */
  private async createCampaignInFacebook(
    adAccountId: string, 
    campaignData: FacebookCampaignData, 
    accessToken: string
  ): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`;
    
    const params = new URLSearchParams({
      access_token: accessToken,
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status,
      ...(campaignData.daily_budget && { daily_budget: campaignData.daily_budget.toString() }),
      ...(campaignData.lifetime_budget && { lifetime_budget: campaignData.lifetime_budget.toString() })
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook API Error: ${data.error.message} (Code: ${data.error.code})`);
    }

    return data;
  }

  /**
   * Buscar campanhas do Facebook
   */
  private async getFacebookCampaigns(adAccountId: string, accessToken: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=id,name,objective,status,created_time,updated_time&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Buscar contas de anúncios do Facebook
   */
  private async fetchFacebookAdAccounts(accessToken: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Publicar post diretamente no Facebook/Instagram
   */
  async publishPostToFacebook(req: Request, res: Response) {
    try {
      const {
        content,
        mediaUrls = [],
        platforms = ['facebook'], // facebook, instagram
        campaignId
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      console.log('📝 Publicando post no Facebook/Instagram:', { content: content.substring(0, 50), platforms });

      // Buscar conta Facebook
      const [facebookAccount] = await db
        .select()
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.organizationId, organizationId),
          eq(socialMediaAccounts.platform, 'facebook'),
          eq(socialMediaAccounts.isActive, true)
        ));

      if (!facebookAccount) {
        return res.status(400).json({
          error: "Conta Facebook não conectada",
          message: "Conecte uma conta Facebook para publicar posts"
        });
      }

      const accessToken = this.decryptToken(facebookAccount.accessToken);
      
      // Publicar no Facebook
      let facebookPostId = null;
      if (platforms.includes('facebook')) {
        facebookPostId = await this.createFacebookPost(
          facebookAccount.accountId,
          content,
          mediaUrls,
          accessToken
        );
      }

      // Publicar no Instagram (se conectado)
      let instagramPostId = null;
      if (platforms.includes('instagram')) {
        instagramPostId = await this.createInstagramPost(
          facebookAccount.accountData?.instagram_business_account?.id,
          content,
          mediaUrls,
          accessToken
        );
      }

      // Salvar post na plataforma
      const [post] = await db.insert(socialMediaPosts).values({
        organizationId,
        campaignId: campaignId || null,
        content,
        mediaUrls,
        platforms,
        status: 'published',
        publishedAt: new Date(),
        postData: {
          facebook: facebookPostId ? { postId: facebookPostId } : null,
          instagram: instagramPostId ? { postId: instagramPostId } : null
        },
        createdBy: facebookAccount.createdBy,
      }).returning();

      res.json({
        success: true,
        data: post,
        published: {
          facebook: !!facebookPostId,
          instagram: !!instagramPostId,
          facebookPostId,
          instagramPostId
        },
        message: "Post publicado com sucesso no Facebook/Instagram!"
      });

    } catch (error) {
      console.error('❌ Erro ao publicar post no Facebook:', error);
      res.status(500).json({
        error: error.message || "Falha ao publicar post",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Criar post no Facebook via API
   */
  private async createFacebookPost(
    pageId: string,
    message: string,
    mediaUrls: string[],
    accessToken: string
  ): Promise<string> {
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const params = new URLSearchParams({
      access_token: accessToken,
      message: message,
      ...(mediaUrls.length > 0 && { link: mediaUrls[0] }) // Primeira URL como link
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Facebook Post Error: ${data.error.message}`);
    }

    return data.id;
  }

  /**
   * Criar post no Instagram via API
   */
  private async createInstagramPost(
    instagramAccountId: string,
    caption: string,
    mediaUrls: string[],
    accessToken: string
  ): Promise<string> {
    if (!instagramAccountId) {
      throw new Error('Instagram Business Account não conectado');
    }

    // Para Instagram, precisamos primeiro criar um container de mídia
    const containerUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`;
    
    const containerParams = new URLSearchParams({
      access_token: accessToken,
      caption: caption,
      ...(mediaUrls.length > 0 && { image_url: mediaUrls[0] }) // Primeira imagem
    });

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: containerParams
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(`Instagram Container Error: ${containerData.error.message}`);
    }

    // Agora publicar o container
    const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`;
    
    const publishParams = new URLSearchParams({
      access_token: accessToken,
      creation_id: containerData.id
    });

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: publishParams
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
    }

    return publishData.id;
  }
}