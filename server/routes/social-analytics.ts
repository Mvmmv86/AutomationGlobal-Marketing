/**
 * Social Media Analytics Routes
 *
 * Endpoints para analytics de redes sociais
 */

import { Router, Request, Response } from 'express';
import { socialAnalyticsService } from '../services/social-analytics-service.js';
import { aiContentService } from '../services/ai-content-service.js';
import { requireAuth, requireOrganization } from '../middleware/auth-unified.js';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(requireAuth);
router.use(requireOrganization);

/**
 * GET /api/social-media/analytics
 *
 * Retorna métricas agregadas de social media
 *
 * Query params:
 * - accountId: UUID (opcional) - Filtrar por conta específica
 * - platform: string (opcional) - Filtrar por plataforma (facebook, instagram, etc)
 * - startDate: ISO date (opcional) - Data inicial (default: 30 dias atrás)
 * - endDate: ISO date (opcional) - Data final (default: hoje)
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const { accountId, platform, startDate, endDate } = req.query;

    console.log('📊 Buscando analytics para organização:', organizationId);

    // Prepara filtros
    const filters: any = {
      organizationId
    };

    if (accountId && typeof accountId === 'string') {
      filters.accountId = accountId;
    }

    if (platform && typeof platform === 'string') {
      filters.platform = platform;
    }

    if (startDate && typeof startDate === 'string') {
      filters.startDate = new Date(startDate);
    }

    if (endDate && typeof endDate === 'string') {
      filters.endDate = new Date(endDate);
    }

    // Busca analytics
    const analytics = await socialAnalyticsService.getAnalytics(filters);

    console.log('✅ Analytics calculados:', {
      overall: analytics.overall,
      platformsCount: analytics.byPlatform.length,
      recentInsightsCount: analytics.recentInsights.length
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar analytics'
    });
  }
});

/**
 * POST /api/social-media/analytics/insight
 *
 * Cria um novo insight de social media
 *
 * Body:
 * - accountId: UUID (obrigatório)
 * - postId: UUID (opcional)
 * - platform: string (obrigatório)
 * - date: ISO date (opcional, default: agora)
 * - reach: number (opcional)
 * - impressions: number (opcional)
 * - engagement: number (opcional)
 * - clicks: number (opcional)
 * - shares: number (opcional)
 * - comments: number (opcional)
 * - likes: number (opcional)
 * - metrics: object (opcional) - Métricas específicas da plataforma
 */
router.post('/analytics/insight', async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const {
      accountId,
      postId,
      platform,
      date,
      reach,
      impressions,
      engagement,
      clicks,
      shares,
      comments,
      likes,
      metrics
    } = req.body;

    // Validações
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId é obrigatório'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'platform é obrigatório'
      });
    }

    console.log('📝 Criando insight para conta:', accountId);

    // Cria insight
    const insight = await socialAnalyticsService.createInsight({
      organizationId,
      accountId,
      postId,
      platform,
      date: date ? new Date(date) : new Date(),
      reach,
      impressions,
      engagement,
      clicks,
      shares,
      comments,
      likes,
      metrics
    });

    console.log('✅ Insight criado:', insight.id);

    res.status(201).json({
      success: true,
      data: {
        insight
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar insight:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar insight'
    });
  }
});

/**
 * POST /api/social-media/generate-suggestions
 *
 * Gera sugestões de conteúdo usando IA
 *
 * Body:
 * - content: string (opcional) - Tema ou ideia base
 * - platform: string (obrigatório) - Plataforma (facebook, instagram, etc)
 * - tone: string (opcional) - Tom do conteúdo (profissional, casual, etc)
 * - niche: string (opcional) - Nicho ou área de atuação
 * - language: string (opcional, default: português)
 */
router.post('/generate-suggestions', async (req: Request, res: Response) => {
  try {
    const { content, platform, tone, niche, language } = req.body;

    // Validação
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'platform é obrigatório'
      });
    }

    console.log('🤖 Gerando sugestões com IA para:', platform);

    // Gera sugestões
    const result = await aiContentService.generateSuggestions({
      content,
      platform,
      tone,
      niche,
      language
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Erro ao gerar sugestões',
        suggestions: result.suggestions // Fallback suggestions
      });
    }

    console.log('✅ Sugestões geradas com sucesso');

    res.json({
      success: true,
      suggestions: result.suggestions
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar sugestões:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar sugestões'
    });
  }
});

/**
 * POST /api/social-media/optimize-content
 *
 * Otimiza conteúdo existente usando IA
 *
 * Body:
 * - content: string (obrigatório) - Conteúdo a ser otimizado
 * - platform: string (obrigatório) - Plataforma (facebook, instagram, etc)
 * - goal: string (opcional) - Objetivo (engajamento, alcance, conversão)
 * - targetAudience: string (opcional) - Público-alvo
 * - language: string (opcional, default: português)
 */
router.post('/optimize-content', async (req: Request, res: Response) => {
  try {
    const { content, platform, goal, targetAudience, language } = req.body;

    // Validações
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content é obrigatório'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'platform é obrigatório'
      });
    }

    console.log('🤖 Otimizando conteúdo com IA para:', platform);

    // Otimiza conteúdo
    const result = await aiContentService.optimizeContent({
      content,
      platform,
      goal,
      targetAudience,
      language
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Erro ao otimizar conteúdo',
        optimizedContent: result.optimizedContent,
        improvements: result.improvements
      });
    }

    console.log('✅ Conteúdo otimizado com sucesso');

    res.json({
      success: true,
      optimizedContent: result.optimizedContent,
      improvements: result.improvements
    });

  } catch (error: any) {
    console.error('❌ Erro ao otimizar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao otimizar conteúdo'
    });
  }
});

export default router;
