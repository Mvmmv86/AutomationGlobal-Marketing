// server/routes/admin/ai-management.ts
// Rotas completas para gerenciamento de IA (apenas admin)

import { Router } from 'express';
import { aiManagementService } from '../../services/ai-management-service.js';
import { requireAuth } from '../../middleware/auth-unified.js';
import { z } from 'zod';

const router = Router();

// Middleware: todas as rotas requerem autenticação de admin
router.use(requireAuth);

// Middleware: verificar se é admin
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Verificar se tem role de admin
  const adminRoles = ['super_admin', 'org_owner'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  next();
});

// =====================================================
// PROVIDERS
// =====================================================

// GET /api/admin/ai/providers - Listar todos os provedores
router.get('/providers', async (req, res) => {
  try {
    const providers = await aiManagementService.listProviders();

    res.json({
      success: true,
      data: { providers },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing providers:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list providers',
      error: error.message
    });
  }
});

// GET /api/admin/ai/providers/:id - Obter provider específico
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await aiManagementService.getProvider(req.params.id);

    res.json({
      success: true,
      data: { provider },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting provider:', error.message);
    res.status(404).json({
      success: false,
      message: 'Provider not found',
      error: error.message
    });
  }
});

// POST /api/admin/ai/providers - Criar novo provider
const createProviderSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['openai', 'anthropic', 'custom']),
  apiKey: z.string().min(10),
  rateLimitRequestsPerMinute: z.number().optional(),
  rateLimitTokensPerMinute: z.number().optional(),
  rateLimitDailyLimit: z.number().optional(),
  costInputPer1kTokens: z.number().optional(),
  costOutputPer1kTokens: z.number().optional(),
  costPerRequest: z.number().optional(),
  config: z.any().optional(),
  weight: z.number().min(0).max(1000).optional(),
  priority: z.number().optional(),
});

router.post('/providers', async (req, res) => {
  try {
    const data = createProviderSchema.parse(req.body);

    const provider = await aiManagementService.createProvider(data, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Provider created successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating provider:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create provider',
      error: error.message
    });
  }
});

// PUT /api/admin/ai/providers/:id - Atualizar provider
const updateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
  apiKey: z.string().min(10).optional(),
  rateLimitRequestsPerMinute: z.number().optional(),
  rateLimitTokensPerMinute: z.number().optional(),
  rateLimitDailyLimit: z.number().optional(),
  costInputPer1kTokens: z.number().optional(),
  costOutputPer1kTokens: z.number().optional(),
  costPerRequest: z.number().optional(),
  config: z.any().optional(),
});

router.put('/providers/:id', async (req, res) => {
  try {
    const data = updateProviderSchema.parse(req.body);

    const provider = await aiManagementService.updateProvider(req.params.id, data);

    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating provider:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: error.message
    });
  }
});

// DELETE /api/admin/ai/providers/:id - Deletar provider
router.delete('/providers/:id', async (req, res) => {
  try {
    await aiManagementService.deleteProvider(req.params.id);

    res.json({
      success: true,
      message: 'Provider deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting provider:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete provider',
      error: error.message
    });
  }
});

// POST /api/admin/ai/providers/:id/ping - Ping provider (health check)
router.post('/providers/:id/ping', async (req, res) => {
  try {
    const result = await aiManagementService.pingProvider(req.params.id);

    res.json({
      success: true,
      message: 'Provider pinged successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error pinging provider:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to ping provider',
      error: error.message
    });
  }
});

// =====================================================
// MODELS
// =====================================================

// GET /api/admin/ai/models - Listar todos os modelos
router.get('/models', async (req, res) => {
  try {
    const { providerId } = req.query;

    const models = await aiManagementService.listModels(providerId as string);

    res.json({
      success: true,
      data: { models },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing models:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list models',
      error: error.message
    });
  }
});

// POST /api/admin/ai/models - Criar novo modelo
const createModelSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().min(1),
  identifier: z.string().min(1),
  type: z.enum(['text', 'chat', 'image', 'audio', 'embedding']),
  maxTokens: z.number().optional(),
  supportsStreaming: z.boolean().optional(),
  supportsFunctions: z.boolean().optional(),
  costPer1kTokens: z.number().optional(),
  costInputPer1kTokens: z.number().optional(),
  costOutputPer1kTokens: z.number().optional(),
});

router.post('/models', async (req, res) => {
  try {
    const data = createModelSchema.parse(req.body);

    const model = await aiManagementService.createModel(data);

    res.status(201).json({
      success: true,
      message: 'Model created successfully',
      data: { model },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating model:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create model',
      error: error.message
    });
  }
});

// PUT /api/admin/ai/models/:id - Atualizar modelo
const updateModelSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  maxTokens: z.number().optional(),
  costPer1kTokens: z.number().optional(),
  costInputPer1kTokens: z.number().optional(),
  costOutputPer1kTokens: z.number().optional(),
});

router.put('/models/:id', async (req, res) => {
  try {
    const data = updateModelSchema.parse(req.body);

    const model = await aiManagementService.updateModel(req.params.id, data);

    res.json({
      success: true,
      message: 'Model updated successfully',
      data: { model },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating model:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update model',
      error: error.message
    });
  }
});

// DELETE /api/admin/ai/models/:id - Deletar modelo
router.delete('/models/:id', async (req, res) => {
  try {
    await aiManagementService.deleteModel(req.params.id);

    res.json({
      success: true,
      message: 'Model deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting model:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete model',
      error: error.message
    });
  }
});

// =====================================================
// QUOTAS
// =====================================================

// GET /api/admin/ai/quotas - Listar todas as quotas
router.get('/quotas', async (req, res) => {
  try {
    const quotas = await aiManagementService.listAllQuotas();

    res.json({
      success: true,
      data: { quotas },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing quotas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list quotas',
      error: error.message
    });
  }
});

// GET /api/admin/ai/quotas/:organizationId - Obter quota de uma organização
router.get('/quotas/:organizationId', async (req, res) => {
  try {
    const quota = await aiManagementService.getOrganizationQuota(req.params.organizationId);

    res.json({
      success: true,
      data: { quota },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting quota:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get quota',
      error: error.message
    });
  }
});

// PUT /api/admin/ai/quotas/:organizationId - Atualizar quota
const updateQuotaSchema = z.object({
  monthlyLimitRequests: z.number().optional(),
  monthlyLimitTokens: z.number().optional(),
  monthlyLimitCost: z.number().optional(),
  dailyLimitRequests: z.number().optional(),
  dailyLimitTokens: z.number().optional(),
  dailyLimitCost: z.number().optional(),
  overageAllowed: z.boolean().optional(),
  alertAtPercentage: z.number().min(0).max(100).optional(),
});

router.put('/quotas/:organizationId', async (req, res) => {
  try {
    const data = updateQuotaSchema.parse(req.body);

    const quota = await aiManagementService.updateOrganizationQuota(req.params.organizationId, data);

    res.json({
      success: true,
      message: 'Quota updated successfully',
      data: { quota },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating quota:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update quota',
      error: error.message
    });
  }
});

// =====================================================
// USAGE STATS
// =====================================================

// GET /api/admin/ai/usage-stats - Estatísticas globais de uso
router.get('/usage-stats', async (req, res) => {
  try {
    const { organizationId, providerId, modelId, startDate, endDate } = req.query;

    const stats = await aiManagementService.getUsageStats({
      organizationId: organizationId as string,
      providerId: providerId as string,
      modelId: modelId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting usage stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage stats',
      error: error.message
    });
  }
});

// GET /api/admin/ai/usage-stats/by-provider - Uso por provider
router.get('/usage-stats/by-provider', async (req, res) => {
  try {
    const { organizationId, days } = req.query;

    const stats = await aiManagementService.getUsageByProvider(
      organizationId as string,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting usage by provider:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage by provider',
      error: error.message
    });
  }
});

// GET /api/admin/ai/usage-stats/by-organization - Uso por organização
router.get('/usage-stats/by-organization', async (req, res) => {
  try {
    const { days } = req.query;

    const stats = await aiManagementService.getUsageByOrganization(
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting usage by organization:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage by organization',
      error: error.message
    });
  }
});

// =====================================================
// LOAD BALANCING
// =====================================================

// GET /api/admin/ai/load-balancing - Obter configuração
router.get('/load-balancing', async (req, res) => {
  try {
    const config = await aiManagementService.getLoadBalancingConfig();

    res.json({
      success: true,
      data: { config },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting load balancing config:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get load balancing config',
      error: error.message
    });
  }
});

// PUT /api/admin/ai/load-balancing - Atualizar configuração
const updateLoadBalancingSchema = z.object({
  strategy: z.enum(['round-robin', 'weighted', 'cost-optimized', 'performance-based', 'least-connections']).optional(),
  healthCheckIntervalSeconds: z.number().optional(),
  failoverThreshold: z.number().optional(),
  autoScalingEnabled: z.boolean().optional(),
  config: z.any().optional(),
});

router.put('/load-balancing', async (req, res) => {
  try {
    const data = updateLoadBalancingSchema.parse(req.body);

    const config = await aiManagementService.updateLoadBalancingConfig(data, req.user!.id);

    res.json({
      success: true,
      message: 'Load balancing config updated successfully',
      data: { config },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating load balancing config:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update load balancing config',
      error: error.message
    });
  }
});

// GET /api/admin/ai/provider-weights - Listar pesos dos providers
router.get('/provider-weights', async (req, res) => {
  try {
    const weights = await aiManagementService.getProviderWeights();

    res.json({
      success: true,
      data: { weights },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting provider weights:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider weights',
      error: error.message
    });
  }
});

// PUT /api/admin/ai/provider-weights/:providerId - Atualizar peso
const updateWeightSchema = z.object({
  weight: z.number().min(0).max(1000).optional(),
  priority: z.number().optional(),
  isActive: z.boolean().optional(),
  fallbackOrder: z.number().optional(),
});

router.put('/provider-weights/:providerId', async (req, res) => {
  try {
    const data = updateWeightSchema.parse(req.body);

    const weight = await aiManagementService.updateProviderWeight(req.params.providerId, data);

    res.json({
      success: true,
      message: 'Provider weight updated successfully',
      data: { weight },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating provider weight:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update provider weight',
      error: error.message
    });
  }
});

console.log('✅ AI Management routes initialized at /api/admin/ai');

export default router;
