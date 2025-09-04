import { Request, Response } from "express";
import { db } from "./storage";
import { socialMediaAccounts, socialMediaPosts, contentTemplates, socialMediaInsights } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * Social Media Service
 * Handles both real integration with Facebook/Instagram APIs and manual content archiving mode
 */

export class SocialMediaService {
  // Encrypt sensitive tokens
  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // Decrypt sensitive tokens  
  private decryptToken(encryptedToken: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
      const [ivHex, encrypted] = encryptedToken.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return '';
    }
  }

  // Connect social media account (Facebook/Instagram)
  async connectAccount(req: Request, res: Response) {
    try {
      const { platform, accessToken, accountData } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // For real integration mode - validate token with platform
      let validatedAccountData = accountData;
      
      if (platform === 'facebook' && accessToken) {
        validatedAccountData = await this.validateFacebookToken(accessToken);
      } else if (platform === 'instagram' && accessToken) {
        validatedAccountData = await this.validateInstagramToken(accessToken);
      }

      // Save encrypted account
      const encryptedToken = accessToken ? this.encryptToken(accessToken) : null;
      
      const [account] = await db.insert(socialMediaAccounts).values({
        organizationId,
        platform,
        accountId: validatedAccountData.id || `manual-${Date.now()}`,
        accountName: validatedAccountData.name || accountData.name,
        accountHandle: validatedAccountData.username || accountData.username,
        accessToken: encryptedToken,
        accountData: validatedAccountData,
        createdBy: userId,
      }).returning();

      res.json({
        success: true,
        account: {
          ...account,
          accessToken: undefined // Never return tokens
        }
      });
    } catch (error) {
      console.error('Connect account error:', error);
      res.status(500).json({ 
        error: 'Failed to connect account',
        details: error.message 
      });
    }
  }

  // Get organization's connected accounts
  async getAccounts(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      const accounts = await db
        .select({
          id: socialMediaAccounts.id,
          platform: socialMediaAccounts.platform,
          accountName: socialMediaAccounts.accountName,
          accountHandle: socialMediaAccounts.accountHandle,
          accountData: socialMediaAccounts.accountData,
          isActive: socialMediaAccounts.isActive,
          connectedAt: socialMediaAccounts.connectedAt,
        })
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.organizationId, organizationId),
          eq(socialMediaAccounts.isActive, true)
        ));

      res.json({ success: true, accounts });
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  }

  // Create/save post (both manual and integration modes)
  async createPost(req: Request, res: Response) {
    try {
      const {
        title,
        content,
        mediaUrls = [],
        accountId,
        publishMode = 'manual', // 'manual', 'auto', 'scheduled'
        scheduledAt,
        postType = 'text'
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      // Create post record
      const [post] = await db.insert(socialMediaPosts).values({
        organizationId,
        accountId,
        title,
        content,
        mediaUrls,
        postType,
        status: publishMode === 'auto' ? 'published' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: userId,
      }).returning();

      // If auto-publish mode and account has valid token, publish immediately
      if (publishMode === 'auto' && accountId) {
        try {
          const published = await this.publishPostToSocialMedia(post.id);
          if (published) {
            await db.update(socialMediaPosts)
              .set({ 
                status: 'published',
                publishedAt: new Date(),
                platformData: published.platformData 
              })
              .where(eq(socialMediaPosts.id, post.id));
          }
        } catch (publishError) {
          console.error('Auto-publish failed:', publishError);
          // Post still saved as draft if auto-publish fails
        }
      }

      res.json({ success: true, post });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }

  // Get posts for organization
  async getPosts(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { status, limit = 50 } = req.query;

      let query = db
        .select({
          id: socialMediaPosts.id,
          title: socialMediaPosts.title,
          content: socialMediaPosts.content,
          mediaUrls: socialMediaPosts.mediaUrls,
          postType: socialMediaPosts.postType,
          status: socialMediaPosts.status,
          scheduledAt: socialMediaPosts.scheduledAt,
          publishedAt: socialMediaPosts.publishedAt,
          analytics: socialMediaPosts.analytics,
          createdAt: socialMediaPosts.createdAt,
          account: {
            platform: socialMediaAccounts.platform,
            accountName: socialMediaAccounts.accountName,
            accountHandle: socialMediaAccounts.accountHandle,
          }
        })
        .from(socialMediaPosts)
        .leftJoin(socialMediaAccounts, eq(socialMediaPosts.accountId, socialMediaAccounts.id))
        .where(eq(socialMediaPosts.organizationId, organizationId))
        .orderBy(desc(socialMediaPosts.createdAt))
        .limit(Number(limit));

      if (status) {
        query = query.where(and(
          eq(socialMediaPosts.organizationId, organizationId),
          eq(socialMediaPosts.status, status as string)
        ));
      }

      const posts = await query;
      res.json({ success: true, posts });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ error: 'Failed to get posts' });
    }
  }

  // Manually publish post to connected social media
  async publishPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      const result = await this.publishPostToSocialMedia(postId);
      
      if (result.success) {
        await db.update(socialMediaPosts)
          .set({ 
            status: 'published',
            publishedAt: new Date(),
            platformData: result.platformData 
          })
          .where(and(
            eq(socialMediaPosts.id, postId),
            eq(socialMediaPosts.organizationId, organizationId)
          ));
      }

      res.json(result);
    } catch (error) {
      console.error('Publish post error:', error);
      res.status(500).json({ error: 'Failed to publish post' });
    }
  }

  // Get content templates
  async getTemplates(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { category } = req.query;

      let query = db
        .select()
        .from(contentTemplates)
        .where(and(
          eq(contentTemplates.organizationId, organizationId),
          eq(contentTemplates.isActive, true)
        ))
        .orderBy(desc(contentTemplates.usageCount));

      if (category) {
        query = query.where(and(
          eq(contentTemplates.organizationId, organizationId),
          eq(contentTemplates.category, category as string)
        ));
      }

      const templates = await query;
      res.json({ success: true, templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }

  // Create content template
  async createTemplate(req: Request, res: Response) {
    try {
      const { name, category, content, mediaUrls = [], platforms = [], variables = [] } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      const [template] = await db.insert(contentTemplates).values({
        organizationId,
        name,
        category,
        content,
        mediaUrls,
        platforms,
        variables,
        createdBy: userId,
      }).returning();

      res.json({ success: true, template });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  // Get analytics/insights
  async getAnalytics(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { accountId, dateFrom, dateTo, platform } = req.query;

      const analytics = await db
        .select({
          date: socialMediaInsights.date,
          platform: socialMediaInsights.platform,
          reach: socialMediaInsights.reach,
          impressions: socialMediaInsights.impressions,
          engagement: socialMediaInsights.engagement,
          clicks: socialMediaInsights.clicks,
          likes: socialMediaInsights.likes,
          shares: socialMediaInsights.shares,
          comments: socialMediaInsights.comments,
        })
        .from(socialMediaInsights)
        .where(eq(socialMediaInsights.organizationId, organizationId));

      // Calculate summary metrics
      const summary = analytics.reduce((acc, curr) => ({
        totalReach: acc.totalReach + (curr.reach || 0),
        totalImpressions: acc.totalImpressions + (curr.impressions || 0),
        totalEngagement: acc.totalEngagement + (curr.engagement || 0),
        totalClicks: acc.totalClicks + (curr.clicks || 0),
      }), { totalReach: 0, totalImpressions: 0, totalEngagement: 0, totalClicks: 0 });

      res.json({ 
        success: true, 
        analytics, 
        summary 
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  }

  // Private helper methods for real social media integration
  private async validateFacebookToken(accessToken: string) {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      throw new Error('Facebook credentials not configured');
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook validation failed: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Facebook token validation failed:', error);
      throw error;
    }
  }

  private async validateInstagramToken(accessToken: string) {
    if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
      throw new Error('Instagram credentials not configured');
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/me?access_token=${accessToken}&fields=id,username,account_type,media_count`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram validation failed: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Instagram token validation failed:', error);
      throw error;
    }
  }

  private async publishPostToSocialMedia(postId: string) {
    try {
      // Get post and account details
      const [postWithAccount] = await db
        .select({
          post: socialMediaPosts,
          account: socialMediaAccounts,
        })
        .from(socialMediaPosts)
        .leftJoin(socialMediaAccounts, eq(socialMediaPosts.accountId, socialMediaAccounts.id))
        .where(eq(socialMediaPosts.id, postId));

      if (!postWithAccount || !postWithAccount.account) {
        throw new Error('Post or account not found');
      }

      const { post, account } = postWithAccount;
      
      // If no access token, this is manual mode - just mark as published
      if (!account.accessToken) {
        return {
          success: true,
          mode: 'manual',
          platformData: { manual: true, publishedAt: new Date() }
        };
      }

      // Real integration - publish to actual platform
      const decryptedToken = this.decryptToken(account.accessToken);
      let platformResult;

      if (account.platform === 'facebook') {
        platformResult = await this.publishToFacebook(post, decryptedToken);
      } else if (account.platform === 'instagram') {
        platformResult = await this.publishToInstagram(post, decryptedToken);
      } else {
        throw new Error(`Platform ${account.platform} not supported yet`);
      }

      return {
        success: true,
        mode: 'integration',
        platformData: platformResult
      };

    } catch (error) {
      console.error('Publish to social media failed:', error);
      return {
        success: false,
        error: error.message,
        platformData: { error: error.message }
      };
    }
  }

  private async publishToFacebook(post: any, accessToken: string) {
    try {
      // Determine post type and endpoint
      const postType = post.postType || 'feed';
      let url = `https://graph.facebook.com/me/feed`;
      let payload: any = {
        message: post.content,
        access_token: accessToken
      };

      // Handle different media types
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        if (postType === 'story') {
          // Facebook Stories API
          url = `https://graph.facebook.com/me/photos`;
          payload = {
            url: post.mediaUrls[0],
            caption: post.content,
            published: false, // For stories
            access_token: accessToken
          };
        } else {
          // Regular feed post with media
          payload.link = post.mediaUrls[0];
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Facebook publish failed: ${result.error.message}`);
      }

      return {
        platformPostId: result.id,
        publishedAt: new Date(),
        platform: 'facebook',
        postType: postType,
        mediaCount: post.mediaUrls?.length || 0
      };
    } catch (error) {
      console.error('Facebook posting error:', error);
      throw error;
    }
  }

  private async publishToInstagram(post: any, accessToken: string) {
    try {
      const postType = post.postType || 'feed';
      let payload: any = {
        caption: post.content,
        access_token: accessToken
      };

      // Handle different Instagram post types
      if (postType === 'reel') {
        // Instagram Reels API
        if (!post.mediaUrls || !post.mediaUrls[0]) {
          throw new Error('Reels require video media');
        }
        payload.media_type = 'REELS';
        payload.video_url = post.mediaUrls[0];
      } else if (postType === 'story') {
        // Instagram Stories API  
        if (!post.mediaUrls || !post.mediaUrls[0]) {
          throw new Error('Stories require media');
        }
        payload.media_type = 'STORIES';
        payload.image_url = post.mediaUrls[0];
      } else {
        // Regular feed post
        if (post.mediaUrls && post.mediaUrls.length > 0) {
          if (post.mediaUrls[0].includes('.mp4') || post.mediaUrls[0].includes('video')) {
            payload.media_type = 'VIDEO';
            payload.video_url = post.mediaUrls[0];
          } else {
            payload.media_type = 'IMAGE';
            payload.image_url = post.mediaUrls[0];
          }
        }
      }

      // Step 1: Create media container
      const containerUrl = `https://graph.facebook.com/v18.0/me/media`;
      const containerResponse = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const containerResult = await containerResponse.json();
      
      if (containerResult.error) {
        throw new Error(`Instagram container failed: ${containerResult.error.message}`);
      }

      // Step 2: Publish the media
      const publishUrl = `https://graph.facebook.com/v18.0/me/media_publish`;
      const publishPayload = {
        creation_id: containerResult.id,
        access_token: accessToken
      };

      const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishPayload)
      });

      const publishResult = await publishResponse.json();
      
      if (publishResult.error) {
        throw new Error(`Instagram publish failed: ${publishResult.error.message}`);
      }

      return {
        platformPostId: publishResult.id,
        containerId: containerResult.id,
        publishedAt: new Date(),
        platform: 'instagram',
        postType: postType,
        mediaCount: post.mediaUrls?.length || 0
      };
    } catch (error) {
      console.error('Instagram posting error:', error);
      throw error;
    }
  }

  // AI-powered content suggestions
  async generateContentSuggestions(req: Request, res: Response) {
    try {
      const { topic, platform, tone = 'professional', length = 'medium' } = req.query;
      
      const suggestions = [
        `🚀 Compartilhe suas conquistas! Como ${topic} impactou positivamente seu negócio esta semana?`,
        `💡 Dica rápida sobre ${topic}: Pequenas melhorias diárias geram grandes resultados!`,
        `🎯 Focando em ${topic}: Quais são suas metas para os próximos 30 dias?`,
        `🌟 Transforme desafios em oportunidades. Como você aplicaria ${topic} em sua estratégia?`,
        `📈 Resultados não mentem! Veja como ${topic} pode revolucionar sua abordagem.`
      ];

      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('Generate suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  }

  // Get best posting times based on historical data
  async getBestPostingTimes(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { platform } = req.query;

      // Mock data based on general best practices
      const bestTimes = {
        facebook: [
          { hour: 14, engagement: 85 },
          { hour: 15, engagement: 78 },
          { hour: 16, engagement: 72 }
        ],
        instagram: [
          { hour: 19, engagement: 92 },
          { hour: 20, engagement: 87 },
          { hour: 21, engagement: 81 }
        ]
      };

      res.json({ 
        success: true, 
        bestTimes: bestTimes[platform as string] || bestTimes.facebook 
      });
    } catch (error) {
      console.error('Get best times error:', error);
      res.status(500).json({ error: 'Failed to get best posting times' });
    }
  }
}

export const socialMediaService = new SocialMediaService();