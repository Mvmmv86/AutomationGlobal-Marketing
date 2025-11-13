// server/routes/audience.ts
// Rotas completas para gerenciamento de audiência

import { Router } from 'express';
import { audienceService } from '../services/audience-service.js';
import { requireAuth, requireOrganization } from '../middleware/auth-unified.js';
import { z } from 'zod';

const router = Router();

// Middleware: todas as rotas requerem autenticação e organização
router.use(requireAuth);
router.use(requireOrganization);

// =====================================================
// CONTACTS - CRUD
// =====================================================

// GET /api/audience/contacts - Listar contatos
router.get('/contacts', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    const filters = {
      status: req.query.status as any,
      type: req.query.type as any,
      search: req.query.search as string,
      tagId: req.query.tagId as string,
      segmentId: req.query.segmentId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const contacts = await audienceService.listContacts(organizationId, filters);

    res.json({
      success: true,
      data: { contacts },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing contacts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list contacts',
      error: error.message
    });
  }
});

// GET /api/audience/contacts/:id - Obter contato específico
router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const contact = await audienceService.getContact(id, organizationId);

    res.json({
      success: true,
      data: { contact },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting contact:', error.message);
    res.status(error.message === 'Contato não encontrado' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/audience/contacts - Criar novo contato
const createContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(['lead', 'customer', 'subscriber', 'prospect']).optional(),
  status: z.enum(['active', 'inactive', 'unsubscribed', 'bounced', 'blocked']).optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  leadSource: z.string().optional(),
  leadScore: z.number().optional(),
  lifecycleStage: z.string().optional(),
  customFields: z.any().optional(),
  preferences: z.any().optional(),
  socialProfiles: z.any().optional(),
  notes: z.string().optional()
});

router.post('/contacts', async (req, res) => {
  try {
    const data = createContactSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;
    const userId = req.user!.id;

    const contact = await audienceService.createContact(organizationId, data, userId);

    res.status(201).json({
      success: true,
      data: { contact },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating contact:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to create contact',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// PATCH /api/audience/contacts/:id - Atualizar contato
const updateContactSchema = createContactSchema.partial();

router.patch('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateContactSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const contact = await audienceService.updateContact(id, organizationId, data);

    res.json({
      success: true,
      data: { contact },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating contact:', error.message);
    res.status(error instanceof z.ZodError ? 400 : error.message === 'Contato não encontrado' ? 404 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : error.message,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// DELETE /api/audience/contacts/:id - Deletar contato
router.delete('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    await audienceService.deleteContact(id, organizationId);

    res.json({
      success: true,
      message: 'Contato deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting contact:', error.message);
    res.status(error.message === 'Contato não encontrado' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// =====================================================
// CONTACT TAGS
// =====================================================

// POST /api/audience/contacts/:id/tags - Adicionar tag ao contato
router.post('/contacts/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tagId } = req.body;

    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: 'tagId is required'
      });
    }

    const result = await audienceService.addTagToContact(id, tagId);

    res.json({
      success: true,
      data: { result },
      message: 'Tag adicionada ao contato',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error adding tag to contact:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add tag to contact',
      error: error.message
    });
  }
});

// DELETE /api/audience/contacts/:id/tags/:tagId - Remover tag do contato
router.delete('/contacts/:id/tags/:tagId', async (req, res) => {
  try {
    const { id, tagId } = req.params;

    await audienceService.removeTagFromContact(id, tagId);

    res.json({
      success: true,
      message: 'Tag removida do contato',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error removing tag from contact:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove tag from contact',
      error: error.message
    });
  }
});

// =====================================================
// TAGS - CRUD
// =====================================================

// GET /api/audience/tags - Listar tags
router.get('/tags', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    const tags = await audienceService.listTags(organizationId);

    res.json({
      success: true,
      data: { tags },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing tags:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list tags',
      error: error.message
    });
  }
});

// POST /api/audience/tags - Criar tag
const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional(),
  description: z.string().optional()
});

router.post('/tags', async (req, res) => {
  try {
    const data = createTagSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const tag = await audienceService.createTag(organizationId, data);

    res.status(201).json({
      success: true,
      data: { tag },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating tag:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to create tag',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// PATCH /api/audience/tags/:id - Atualizar tag
const updateTagSchema = createTagSchema.partial();

router.patch('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTagSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const tag = await audienceService.updateTag(id, organizationId, data);

    res.json({
      success: true,
      data: { tag },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating tag:', error.message);
    res.status(error instanceof z.ZodError ? 400 : error.message === 'Tag não encontrada' ? 404 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : error.message,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// DELETE /api/audience/tags/:id - Deletar tag
router.delete('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    await audienceService.deleteTag(id, organizationId);

    res.json({
      success: true,
      message: 'Tag deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting tag:', error.message);
    res.status(error.message === 'Tag não encontrada' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// =====================================================
// SEGMENTS - CRUD
// =====================================================

// GET /api/audience/segments - Listar segmentos
router.get('/segments', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    const segments = await audienceService.listSegments(organizationId);

    res.json({
      success: true,
      data: { segments },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing segments:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list segments',
      error: error.message
    });
  }
});

// GET /api/audience/segments/:id - Obter segmento específico
router.get('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const segment = await audienceService.getSegment(id, organizationId);

    res.json({
      success: true,
      data: { segment },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting segment:', error.message);
    res.status(error.message === 'Segmento não encontrado' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/audience/segments - Criar segmento
const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['static', 'dynamic']),
  conditions: z.any().optional()
});

router.post('/segments', async (req, res) => {
  try {
    const data = createSegmentSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;
    const userId = req.user!.id;

    const segment = await audienceService.createSegment(organizationId, data, userId);

    res.status(201).json({
      success: true,
      data: { segment },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating segment:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to create segment',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// PATCH /api/audience/segments/:id - Atualizar segmento
const updateSegmentSchema = createSegmentSchema.partial();

router.patch('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateSegmentSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const segment = await audienceService.updateSegment(id, organizationId, data);

    res.json({
      success: true,
      data: { segment },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error updating segment:', error.message);
    res.status(error instanceof z.ZodError ? 400 : error.message === 'Segmento não encontrado' ? 404 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : error.message,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// DELETE /api/audience/segments/:id - Deletar segmento
router.delete('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    await audienceService.deleteSegment(id, organizationId);

    res.json({
      success: true,
      message: 'Segmento deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error deleting segment:', error.message);
    res.status(error.message === 'Segmento não encontrado' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// =====================================================
// SEGMENT CONTACTS
// =====================================================

// GET /api/audience/segments/:id/contacts - Listar contatos do segmento
router.get('/segments/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const contacts = await audienceService.getSegmentContacts(id, organizationId, options);

    res.json({
      success: true,
      data: { contacts },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing segment contacts:', error.message);
    res.status(error.message === 'Segmento não encontrado' ? 404 : 500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

// POST /api/audience/segments/:id/contacts - Adicionar contato ao segmento
router.post('/segments/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'contactId is required'
      });
    }

    const result = await audienceService.addContactToSegment(id, contactId, false);

    res.json({
      success: true,
      data: { result },
      message: 'Contato adicionado ao segmento',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error adding contact to segment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add contact to segment',
      error: error.message
    });
  }
});

// DELETE /api/audience/segments/:id/contacts/:contactId - Remover contato do segmento
router.delete('/segments/:id/contacts/:contactId', async (req, res) => {
  try {
    const { id, contactId } = req.params;

    await audienceService.removeContactFromSegment(id, contactId);

    res.json({
      success: true,
      message: 'Contato removido do segmento',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error removing contact from segment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove contact from segment',
      error: error.message
    });
  }
});

// =====================================================
// ACTIVITIES
// =====================================================

// GET /api/audience/contacts/:id/activities - Listar atividades do contato
router.get('/contacts/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;

    const options = {
      type: req.query.type as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const activities = await audienceService.listContactActivities(id, options);

    res.json({
      success: true,
      data: { activities },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error listing activities:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list activities',
      error: error.message
    });
  }
});

// POST /api/audience/contacts/:id/activities - Criar atividade
const createActivitySchema = z.object({
  type: z.enum(['email_sent', 'email_opened', 'email_clicked', 'page_visited',
    'form_submitted', 'campaign_joined', 'purchase', 'social_interaction', 'note_added', 'custom']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  metadata: z.any().optional(),
  campaignId: z.string().optional(),
  automationId: z.string().optional(),
  occurredAt: z.string().optional()
});

router.post('/contacts/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const data = createActivitySchema.parse(req.body);
    const organizationId = req.user!.organizationId!;

    const activity = await audienceService.createActivity(id, organizationId, {
      ...data,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined
    });

    res.status(201).json({
      success: true,
      data: { activity },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating activity:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to create activity',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

// =====================================================
// DASHBOARD & STATS
// =====================================================

// GET /api/audience/dashboard - Dashboard de audiência
router.get('/dashboard', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId!;

    const dashboard = await audienceService.getAudienceDashboard(organizationId);

    res.json({
      success: true,
      data: { dashboard },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting dashboard:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard',
      error: error.message
    });
  }
});

// POST /api/audience/contacts/import - Importar contatos em lote
const bulkImportSchema = z.object({
  contacts: z.array(createContactSchema)
});

router.post('/contacts/import', async (req, res) => {
  try {
    const { contacts } = bulkImportSchema.parse(req.body);
    const organizationId = req.user!.organizationId!;
    const userId = req.user!.id;

    const result = await audienceService.bulkImportContacts(organizationId, contacts, userId);

    res.json({
      success: true,
      data: result,
      message: `Importação concluída: ${result.imported} sucesso, ${result.errors} erros`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error importing contacts:', error.message);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Validation error' : 'Failed to import contacts',
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

export default router;
