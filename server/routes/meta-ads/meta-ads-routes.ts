/**
 * Meta Ads Routes
 *
 * Rotas para criação e gerenciamento de campanhas via Meta Marketing API v24.0
 */

import { Router } from 'express';
import { metaAdsService } from '../../services/meta-ads/meta-ads-service';
import { metaInsightsService } from '../../services/meta-ads/meta-insights-service';

const router = Router();

// ==========================================================================
// CRIAR CAMPANHA COMPLETA
// ==========================================================================

/**
 * POST /api/meta-ads/campaigns/create-full
 * Criar campanha completa (campaign + ad set + creative + ad)
 */
router.post('/campaigns/create-full', async (req, res) => {
  try {
    const {
      socialAccountId,
      campaignName,
      objective,
      adSetName,
      optimization_goal,
      daily_budget,
      targeting,
      creativeName,
      pageId,
      instagramActorId,
      message,
      link,
      callToAction,
      imageUrl,
      adName
    } = req.body;

    // Validações básicas
    if (!socialAccountId || !campaignName || !objective) {
      return res.status(400).json({
        error: 'socialAccountId, campaignName, and objective are required'
      });
    }

    const result = await metaAdsService.createFullCampaign({
      socialAccountId: parseInt(socialAccountId),
      campaignName,
      objective,
      adSetName: adSetName || `${campaignName} - Ad Set`,
      optimization_goal: optimization_goal || 'LINK_CLICKS',
      daily_budget: parseFloat(daily_budget),
      targeting: targeting || {
        geo_locations: { countries: ['BR'] },
        age_min: 18,
        age_max: 65
      },
      creativeName: creativeName || `${campaignName} - Creative`,
      pageId,
      instagramActorId,
      message,
      link,
      callToAction: callToAction || 'LEARN_MORE',
      imageUrl,
      adName: adName || `${campaignName} - Ad`
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error creating full campaign:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================================================
// CRIAR COMPONENTES INDIVIDUAIS
// ==========================================================================

/**
 * POST /api/meta-ads/campaigns/create
 * Criar apenas a campanha
 */
router.post('/campaigns/create', async (req, res) => {
  try {
    const { socialAccountId, name, objective, status, daily_budget, lifetime_budget } = req.body;

    if (!socialAccountId || !name || !objective) {
      return res.status(400).json({
        error: 'socialAccountId, name, and objective are required'
      });
    }

    const campaign = await metaAdsService.createCampaign({
      socialAccountId: parseInt(socialAccountId),
      name,
      objective,
      status,
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      lifetime_budget: lifetime_budget ? parseFloat(lifetime_budget) : undefined
    });

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/meta-ads/adsets/create
 * Criar Ad Set
 */
router.post('/adsets/create', async (req, res) => {
  try {
    const {
      socialAccountId,
      campaignId,
      name,
      optimization_goal,
      billing_event,
      daily_budget,
      targeting
    } = req.body;

    if (!socialAccountId || !campaignId || !name || !optimization_goal) {
      return res.status(400).json({
        error: 'socialAccountId, campaignId, name, and optimization_goal are required'
      });
    }

    const adSet = await metaAdsService.createAdSet({
      socialAccountId: parseInt(socialAccountId),
      campaignId,
      name,
      optimization_goal,
      billing_event: billing_event || 'IMPRESSIONS',
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      targeting: targeting || {
        geo_locations: { countries: ['BR'] },
        age_min: 18,
        age_max: 65
      }
    });

    res.json({
      success: true,
      data: adSet
    });
  } catch (error: any) {
    console.error('Error creating ad set:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/meta-ads/creatives/create
 * Criar Ad Creative
 */
router.post('/creatives/create', async (req, res) => {
  try {
    const { socialAccountId, name, object_story_spec } = req.body;

    if (!socialAccountId || !name || !object_story_spec) {
      return res.status(400).json({
        error: 'socialAccountId, name, and object_story_spec are required'
      });
    }

    const creative = await metaAdsService.createAdCreative({
      socialAccountId: parseInt(socialAccountId),
      name,
      object_story_spec
    });

    res.json({
      success: true,
      data: creative
    });
  } catch (error: any) {
    console.error('Error creating ad creative:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/meta-ads/ads/create
 * Criar Ad
 */
router.post('/ads/create', async (req, res) => {
  try {
    const { socialAccountId, adSetId, creativeId, name, status } = req.body;

    if (!socialAccountId || !adSetId || !creativeId || !name) {
      return res.status(400).json({
        error: 'socialAccountId, adSetId, creativeId, and name are required'
      });
    }

    const ad = await metaAdsService.createAd({
      socialAccountId: parseInt(socialAccountId),
      adSetId,
      creativeId,
      name,
      status
    });

    res.json({
      success: true,
      data: ad
    });
  } catch (error: any) {
    console.error('Error creating ad:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================================================
// LISTAR E BUSCAR CAMPANHAS
// ==========================================================================

/**
 * GET /api/meta-ads/campaigns
 * Listar todas as campanhas da Ad Account
 */
router.get('/campaigns', async (req, res) => {
  try {
    const { socialAccountId } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const campaigns = await metaAdsService.getCampaigns(parseInt(socialAccountId as string));

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/campaigns/:id
 * Buscar detalhes de uma campanha específica
 */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { socialAccountId } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const campaign = await metaAdsService.getCampaignById(
      parseInt(socialAccountId as string),
      id
    );

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================================================
// ATUALIZAR CAMPANHA
// ==========================================================================

/**
 * PATCH /api/meta-ads/campaigns/:id/status
 * Atualizar status de campanha (ativar/pausar)
 */
router.patch('/campaigns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { socialAccountId, status } = req.body;

    if (!socialAccountId || !status) {
      return res.status(400).json({
        error: 'socialAccountId and status are required'
      });
    }

    const validStatuses = ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await metaAdsService.updateCampaignStatus(
      parseInt(socialAccountId),
      id,
      status
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================================================
// INSIGHTS E MÉTRICAS
// ==========================================================================

/**
 * GET /api/meta-ads/insights
 * Buscar insights/métricas de campanhas
 */
router.get('/insights', async (req, res) => {
  try {
    const {
      socialAccountId,
      level,
      campaignIds,
      datePreset,
      timeRange,
      breakdowns,
      limit
    } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const insights = await metaInsightsService.getInsights({
      socialAccountId: parseInt(socialAccountId as string),
      level: level as any,
      campaignIds: campaignIds ? (campaignIds as string).split(',') : undefined,
      datePreset: datePreset as any,
      timeRange: timeRange ? JSON.parse(timeRange as string) : undefined,
      breakdowns: breakdowns ? (breakdowns as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/insights/aggregated
 * Buscar insights agregadas de todas as campanhas
 */
router.get('/insights/aggregated', async (req, res) => {
  try {
    const { socialAccountId, datePreset } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const insights = await metaInsightsService.getAggregatedInsights(
      parseInt(socialAccountId as string),
      (datePreset as string) || 'last_30d'
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error fetching aggregated insights:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/insights/campaign/:id
 * Buscar insights de uma campanha específica
 */
router.get('/insights/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { socialAccountId, datePreset } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const insights = await metaInsightsService.getCampaignInsights(
      parseInt(socialAccountId as string),
      id,
      (datePreset as string) || 'lifetime'
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error fetching campaign insights:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/insights/demographic
 * Buscar breakdown por demografia (idade, gênero)
 */
router.get('/insights/demographic', async (req, res) => {
  try {
    const { socialAccountId, campaignIds, datePreset } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const breakdown = await metaInsightsService.getDemographicBreakdown(
      parseInt(socialAccountId as string),
      campaignIds ? (campaignIds as string).split(',') : undefined,
      (datePreset as string) || 'last_30d'
    );

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error: any) {
    console.error('Error fetching demographic breakdown:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/insights/location
 * Buscar breakdown por localização (país, região)
 */
router.get('/insights/location', async (req, res) => {
  try {
    const { socialAccountId, campaignIds, datePreset } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const breakdown = await metaInsightsService.getLocationBreakdown(
      parseInt(socialAccountId as string),
      campaignIds ? (campaignIds as string).split(',') : undefined,
      (datePreset as string) || 'last_30d'
    );

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error: any) {
    console.error('Error fetching location breakdown:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/meta-ads/insights/device
 * Buscar breakdown por dispositivo
 */
router.get('/insights/device', async (req, res) => {
  try {
    const { socialAccountId, campaignIds, datePreset } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({
        error: 'socialAccountId is required'
      });
    }

    const breakdown = await metaInsightsService.getDeviceBreakdown(
      parseInt(socialAccountId as string),
      campaignIds ? (campaignIds as string).split(',') : undefined,
      (datePreset as string) || 'last_30d'
    );

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error: any) {
    console.error('Error fetching device breakdown:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
