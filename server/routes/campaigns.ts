// server/routes/campaigns.ts
// Rotas completas para gerenciamento de campanhas

import { Router, Request, Response } from 'express';
import { campaignsService } from '../services/campaigns-service.js';
import { requireAuth, requireOrganization } from '../middleware/auth-unified.js';

const router = Router();

// Middleware: todas as rotas exigem autenticação
router.use(requireAuth);
router.use(requireOrganization);

// =====================================================
// CAMPAIGNS - CRUD
// =====================================================

/**
 * GET /api/campaigns/stats
 * Obter estatísticas de campanhas
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const stats = await campaignsService.getCampaignStats(organizationId);

    return res.json({
      success: true,
      data: { stats }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error getting stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * GET /api/campaigns
 * Listar todas as campanhas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { status, type, search, limit, offset } = req.query;

    const campaigns = await campaignsService.listCampaigns(organizationId, {
      status: status as any,
      type: type as any,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    return res.json({
      success: true,
      data: { campaigns }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error listing campaigns:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar campanhas'
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Obter uma campanha por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const campaign = await campaignsService.getCampaign(id, organizationId);

    return res.json({
      success: true,
      data: { campaign }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error getting campaign:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao buscar campanha'
    });
  }
});

/**
 * POST /api/campaigns
 * Criar nova campanha
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const campaign = await campaignsService.createCampaign(organizationId, req.body, userId);

    return res.status(201).json({
      success: true,
      data: { campaign }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error creating campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar campanha'
    });
  }
});

/**
 * PATCH /api/campaigns/:id
 * Atualizar campanha
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const campaign = await campaignsService.updateCampaign(id, organizationId, req.body);

    return res.json({
      success: true,
      data: { campaign }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error updating campaign:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao atualizar campanha'
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Deletar campanha
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    await campaignsService.deleteCampaign(id, organizationId);

    return res.json({
      success: true,
      message: 'Campanha deletada com sucesso'
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error deleting campaign:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao deletar campanha'
    });
  }
});

/**
 * POST /api/campaigns/:id/activate
 * Ativar campanha
 */
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const campaign = await campaignsService.activateCampaign(id, organizationId);

    return res.json({
      success: true,
      data: { campaign },
      message: 'Campanha ativada com sucesso'
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error activating campaign:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao ativar campanha'
    });
  }
});

/**
 * POST /api/campaigns/:id/pause
 * Pausar campanha
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const campaign = await campaignsService.pauseCampaign(id, organizationId);

    return res.json({
      success: true,
      data: { campaign },
      message: 'Campanha pausada com sucesso'
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error pausing campaign:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao pausar campanha'
    });
  }
});

// =====================================================
// CAMPAIGN POSTS
// =====================================================

/**
 * GET /api/campaigns/:id/posts
 * Listar posts de uma campanha
 */
router.get('/:id/posts', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const posts = await campaignsService.listCampaignPosts(id, organizationId);

    return res.json({
      success: true,
      data: { posts }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error listing posts:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao listar posts'
    });
  }
});

/**
 * POST /api/campaigns/:id/posts
 * Criar post para uma campanha
 */
router.post('/:id/posts', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const post = await campaignsService.createCampaignPost(id, organizationId, req.body, userId);

    return res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error creating post:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao criar post'
    });
  }
});

/**
 * DELETE /api/campaigns/:id/posts/:postId
 * Deletar post de uma campanha
 */
router.delete('/:id/posts/:postId', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id, postId } = req.params;
    await campaignsService.deleteCampaignPost(postId, id, organizationId);

    return res.json({
      success: true,
      message: 'Post deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error deleting post:', error);
    const status = error.message === 'Post não encontrado' || error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao deletar post'
    });
  }
});

/**
 * PATCH /api/campaigns/:id/metrics
 * Atualizar métricas de uma campanha
 */
router.patch('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Organização não encontrada' });
    }

    const { id } = req.params;
    const campaign = await campaignsService.updateCampaignMetrics(id, organizationId, req.body);

    return res.json({
      success: true,
      data: { campaign }
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error updating metrics:', error);
    const status = error.message === 'Campanha não encontrada' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Erro ao atualizar métricas'
    });
  }
});

export default router;
