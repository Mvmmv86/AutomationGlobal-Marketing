// server/routes/automations.ts
// Rotas completas para gerenciamento de automações

import { Router } from 'express';
import { automationService } from '../services/automation-service.js';
import { requireAuth, requireOrganization } from '../middleware/auth-unified.js';
import { z } from 'zod';

const router = Router();

// Middleware: todas as rotas requerem autenticação e organização
router.use(requireAuth);
router.use(requireOrganization);

// =====================================================
// AUTOMATIONS - CRUD
// =====================================================

// GET /api/automations - Listar automações
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    // Query params opcionais
    const filters = {
      status: req.query.status as any,
      type: req.query.type as any,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };

    const automations = await automationService.listAutomations(organizationId, filters);

    res.json({
      success: true,
      data: { automations },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing automations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list automations',
      error: error.message
    });
  }
});

// GET /api/automations/:id - Obter automação específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const automation = await automationService.getAutomation(id, organizationId);

    res.json({
      success: true,
      data: { automation },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting automation:', error.message);
    res.status(error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/automations - Criar nova automação
const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['content', 'email', 'social', 'leads', 'support', 'sales']),
  config: z.object({}).passthrough(), // Aceita qualquer objeto
  scheduleEnabled: z.boolean().optional(),
  scheduleConfig: z.object({
    type: z.enum(['cron', 'interval']),
    value: z.string(),
    timezone: z.string().optional()
  }).optional()
});

router.post('/', async (req, res) => {
  try {
    const data = createAutomationSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;
    const userId = req.user!.id;

    const automation = await automationService.createAutomation({
      ...data,
      organizationId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: { automation },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating automation:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to create automation',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// PATCH /api/automations/:id - Atualizar automação
const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'configuring', 'active', 'inactive', 'paused']).optional(),
  config: z.object({}).passthrough().optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleConfig: z.object({
    type: z.enum(['cron', 'interval']),
    value: z.string(),
    timezone: z.string().optional()
  }).optional(),
  isActive: z.boolean().optional()
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateAutomationSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const automation = await automationService.updateAutomation(id, organizationId, data);

    res.json({
      success: true,
      data: { automation },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating automation:', error.message);
    res.status(error instanceof z.ZodError ? 400 : error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : error.message,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// DELETE /api/automations/:id - Deletar automação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    await automationService.deleteAutomation(id, organizationId);

    res.json({
      success: true,
      message: 'Automação deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting automation:', error.message);
    res.status(error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// =====================================================
// AUTOMATION CONTROL
// =====================================================

// POST /api/automations/:id/activate - Ativar automação
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const automation = await automationService.activateAutomation(id, organizationId);

    res.json({
      success: true,
      data: { automation },
      message: 'Automação ativada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error activating automation:', error.message);
    res.status(error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/automations/:id/pause - Pausar automação
router.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const automation = await automationService.pauseAutomation(id, organizationId);

    res.json({
      success: true,
      data: { automation },
      message: 'Automação pausada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error pausing automation:', error.message);
    res.status(error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/automations/:id/execute - Executar automação manualmente
const executeAutomationSchema = z.object({
  inputData: z.any().optional()
});

router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { inputData } = executeAutomationSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;
    const userId = req.user!.id;

    const result = await automationService.executeAutomation(id, organizationId, userId, inputData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error executing automation:', error.message);
    res.status(error instanceof z.ZodError ? 400 : error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : error.message,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// =====================================================
// EXECUTIONS
// =====================================================

// GET /api/automations/:id/executions - Listar execuções
router.get('/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      status: req.query.status as any
    };

    const executions = await automationService.listExecutions(id, organizationId, options);

    res.json({
      success: true,
      data: { executions },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing executions:', error.message);
    res.status(error.message === 'Automação não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// GET /api/automations/:id/executions/:executionId - Obter execução específica
router.get('/:id/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await automationService.getExecution(executionId);

    res.json({
      success: true,
      data: { execution },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting execution:', error.message);
    res.status(error.message === 'Execução não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// GET /api/automations/:id/logs - Listar logs de execução
router.get('/:id/executions/:executionId/logs', async (req, res) => {
  try {
    const { executionId } = req.params;

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      level: req.query.level as any
    };

    const logs = await automationService.listExecutionLogs(executionId, options);

    res.json({
      success: true,
      data: { logs },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing logs:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list logs',
      error: error.message
    });
  }
});

// =====================================================
// MÉTRICAS
// =====================================================

// GET /api/automations/:id/metrics - Obter métricas de uma automação
router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const metrics = await automationService.getAutomationMetrics(id, days);

    res.json({
      success: true,
      data: { metrics },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting metrics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

// GET /api/automations/stats - Estatísticas gerais da organização
router.get('/stats/organization', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    const stats = await automationService.getOrganizationStats(organizationId);

    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting organization stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization stats',
      error: error.message
    });
  }
});

export default router;
