/**
 * Social Media Analytics Service
 *
 * Service para calcular e agregar métricas de social media
 * Usa a tabela social_media_insights para gerar analytics
 */

import { db } from '../db/index.js';
import { sql, and, eq, gte, lte, desc } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';

interface AnalyticsFilters {
  organizationId: string;
  accountId?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
}

interface PlatformMetrics {
  platform: string;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
  postsCount: number;
  engagementRate: number;
}

interface OverallMetrics {
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
  totalPosts: number;
  avgEngagementRate: number;
}

interface AnalyticsResponse {
  overall: OverallMetrics;
  byPlatform: PlatformMetrics[];
  recentInsights: any[];
  timeRange: {
    start: string;
    end: string;
  };
}

class SocialAnalyticsService {
  /**
   * Busca analytics agregados de social media
   */
  async getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsResponse> {
    const { organizationId, accountId, platform, startDate, endDate } = filters;

    // Define período padrão: últimos 30 dias
    const end = endDate || new Date();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Monta condições do WHERE
    const conditions: any[] = [
      eq(schema.socialMediaInsights.organizationId, organizationId),
      gte(schema.socialMediaInsights.date, start),
      lte(schema.socialMediaInsights.date, end)
    ];

    if (accountId) {
      conditions.push(eq(schema.socialMediaInsights.accountId, accountId));
    }

    if (platform) {
      conditions.push(eq(schema.socialMediaInsights.platform, platform as any));
    }

    // Busca todos os insights do período
    const insights = await db
      .select()
      .from(schema.socialMediaInsights)
      .where(and(...conditions))
      .orderBy(desc(schema.socialMediaInsights.date));

    // Calcula métricas gerais
    const overall = this.calculateOverallMetrics(insights);

    // Calcula métricas por plataforma
    const byPlatform = this.calculatePlatformMetrics(insights);

    // Pega insights mais recentes (últimos 10)
    const recentInsights = insights.slice(0, 10).map(insight => ({
      id: insight.id,
      platform: insight.platform,
      date: insight.date,
      reach: insight.reach,
      impressions: insight.impressions,
      engagement: insight.engagement,
      clicks: insight.clicks,
      shares: insight.shares,
      comments: insight.comments,
      likes: insight.likes,
      engagementRate: insight.impressions > 0
        ? ((insight.engagement / insight.impressions) * 100).toFixed(2)
        : '0.00'
    }));

    return {
      overall,
      byPlatform,
      recentInsights,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
  }

  /**
   * Calcula métricas gerais (soma de todos os insights)
   */
  private calculateOverallMetrics(insights: any[]): OverallMetrics {
    const totals = insights.reduce((acc, insight) => ({
      totalReach: acc.totalReach + (insight.reach || 0),
      totalImpressions: acc.totalImpressions + (insight.impressions || 0),
      totalEngagement: acc.totalEngagement + (insight.engagement || 0),
      totalClicks: acc.totalClicks + (insight.clicks || 0),
      totalShares: acc.totalShares + (insight.shares || 0),
      totalComments: acc.totalComments + (insight.comments || 0),
      totalLikes: acc.totalLikes + (insight.likes || 0)
    }), {
      totalReach: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      totalClicks: 0,
      totalShares: 0,
      totalComments: 0,
      totalLikes: 0
    });

    const avgEngagementRate = totals.totalImpressions > 0
      ? (totals.totalEngagement / totals.totalImpressions) * 100
      : 0;

    return {
      ...totals,
      totalPosts: insights.length,
      avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2))
    };
  }

  /**
   * Calcula métricas agrupadas por plataforma
   */
  private calculatePlatformMetrics(insights: any[]): PlatformMetrics[] {
    const byPlatform = insights.reduce((acc, insight) => {
      const platform = insight.platform;

      if (!acc[platform]) {
        acc[platform] = {
          platform,
          totalReach: 0,
          totalImpressions: 0,
          totalEngagement: 0,
          totalClicks: 0,
          totalShares: 0,
          totalComments: 0,
          totalLikes: 0,
          postsCount: 0
        };
      }

      acc[platform].totalReach += insight.reach || 0;
      acc[platform].totalImpressions += insight.impressions || 0;
      acc[platform].totalEngagement += insight.engagement || 0;
      acc[platform].totalClicks += insight.clicks || 0;
      acc[platform].totalShares += insight.shares || 0;
      acc[platform].totalComments += insight.comments || 0;
      acc[platform].totalLikes += insight.likes || 0;
      acc[platform].postsCount += 1;

      return acc;
    }, {} as Record<string, PlatformMetrics>);

    // Calcula engagement rate por plataforma
    return Object.values(byPlatform).map(metrics => ({
      ...metrics,
      engagementRate: metrics.totalImpressions > 0
        ? parseFloat(((metrics.totalEngagement / metrics.totalImpressions) * 100).toFixed(2))
        : 0
    }));
  }

  /**
   * Cria ou atualiza um insight de social media
   */
  async createInsight(data: {
    organizationId: string;
    accountId: string;
    postId?: string;
    platform: string;
    date: Date;
    reach?: number;
    impressions?: number;
    engagement?: number;
    clicks?: number;
    shares?: number;
    comments?: number;
    likes?: number;
    metrics?: any;
  }) {
    const insightData = {
      ...data,
      date: data.date || new Date(),
      reach: data.reach || 0,
      impressions: data.impressions || 0,
      engagement: data.engagement || 0,
      clicks: data.clicks || 0,
      shares: data.shares || 0,
      comments: data.comments || 0,
      likes: data.likes || 0,
      metrics: data.metrics || {}
    };

    const [insight] = await db
      .insert(schema.socialMediaInsights)
      .values(insightData as any)
      .returning();

    return insight;
  }
}

export const socialAnalyticsService = new SocialAnalyticsService();
