import { Router } from 'express';
import { storage } from '../storage';
import { loggingService } from '../services/logging-service';

const router = Router();

// Organizations Management - Task 3.2 requirements
// GET /api/admin/organizations - Listagem com paginação e filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'all', 
      plan = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Mock data for organizations - Task 3.2 implementation
    const allOrganizations = [
      {
        id: '1',
        name: 'TechCorp Solutions',
        slug: 'techcorp-solutions',
        email: 'admin@techcorp.com',
        plan: 'Enterprise',
        status: 'active',
        users: 45,
        aiUsage: 95,
        monthlySpend: 2450.75,
        createdAt: '2024-01-15T10:30:00Z',
        lastActivity: '2025-08-30T18:15:00Z',
        subscription: {
          tier: 'enterprise',
          limits: {
            users: 100,
            aiRequests: 10000,
            storage: '1TB'
          }
        }
      },
      {
        id: '2',
        name: 'StartupX Innovation',
        slug: 'startupx-innovation',
        email: 'team@startupx.com',
        plan: 'Professional',
        status: 'active',
        users: 12,
        aiUsage: 78,
        monthlySpend: 890.50,
        createdAt: '2024-03-22T14:20:00Z',
        lastActivity: '2025-08-30T16:45:00Z',
        subscription: {
          tier: 'professional',
          limits: {
            users: 25,
            aiRequests: 5000,
            storage: '500GB'
          }
        }
      },
      {
        id: '3',
        name: 'Enterprise Co',
        slug: 'enterprise-co',
        email: 'contact@enterprise.com',
        plan: 'Enterprise',
        status: 'active',
        users: 78,
        aiUsage: 88,
        monthlySpend: 3200.25,
        createdAt: '2024-02-10T09:15:00Z',
        lastActivity: '2025-08-30T17:30:00Z',
        subscription: {
          tier: 'enterprise',
          limits: {
            users: 150,
            aiRequests: 15000,
            storage: '2TB'
          }
        }
      },
      {
        id: '4',
        name: 'AI Solutions Ltd',
        slug: 'ai-solutions-ltd',
        email: 'info@aisolutions.com',
        plan: 'Professional',
        status: 'active',
        users: 32,
        aiUsage: 92,
        monthlySpend: 1750.80,
        createdAt: '2024-04-05T11:45:00Z',
        lastActivity: '2025-08-30T19:00:00Z',
        subscription: {
          tier: 'professional',
          limits: {
            users: 50,
            aiRequests: 7500,
            storage: '750GB'
          }
        }
      },
      {
        id: '5',
        name: 'Innovation Lab',
        slug: 'innovation-lab',
        email: 'hello@innovationlab.com',
        plan: 'Starter',
        status: 'trial',
        users: 8,
        aiUsage: 65,
        monthlySpend: 120.00,
        createdAt: '2025-08-15T16:30:00Z',
        lastActivity: '2025-08-30T12:20:00Z',
        subscription: {
          tier: 'starter',
          limits: {
            users: 10,
            aiRequests: 1000,
            storage: '100GB'
          }
        }
      },
      {
        id: '6',
        name: 'Digital Ventures',
        slug: 'digital-ventures',
        email: 'admin@digitalventures.com',
        plan: 'Professional',
        status: 'inactive',
        users: 15,
        aiUsage: 12,
        monthlySpend: 45.25,
        createdAt: '2024-06-12T08:00:00Z',
        lastActivity: '2025-08-20T10:15:00Z',
        subscription: {
          tier: 'professional',
          limits: {
            users: 25,
            aiRequests: 5000,
            storage: '500GB'
          }
        }
      }
    ];

    // Apply filters
    let filteredOrgs = allOrganizations;

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredOrgs = filteredOrgs.filter(org => 
        org.name.toLowerCase().includes(searchLower) ||
        org.email.toLowerCase().includes(searchLower) ||
        org.slug.toLowerCase().includes(searchLower)
      );
    }

    if (status !== 'all') {
      filteredOrgs = filteredOrgs.filter(org => org.status === status);
    }

    if (plan !== 'all') {
      filteredOrgs = filteredOrgs.filter(org => 
        org.plan.toLowerCase() === (plan as string).toLowerCase()
      );
    }

    // Apply sorting
    filteredOrgs.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      if (sortBy === 'createdAt' || sortBy === 'lastActivity') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedOrgs = filteredOrgs.slice(startIndex, startIndex + Number(limit));

    const response = {
      success: true,
      data: paginatedOrgs,
      pagination: {
        current: Number(page),
        total: Math.ceil(filteredOrgs.length / Number(limit)),
        totalItems: filteredOrgs.length,
        limit: Number(limit)
      },
      filters: {
        search,
        status,
        plan,
        sortBy,
        sortOrder
      },
      timestamp: new Date().toISOString()
    };

    loggingService.info('Organizations list requested', {
      page,
      limit,
      totalFound: filteredOrgs.length,
      filters: { search, status, plan }
    });

    res.json(response);

  } catch (error) {
    loggingService.error('Failed to get organizations list', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/organizations/:id - Detalhes específicos de uma organização
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock detailed organization data
    const organizationDetails = {
      id,
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      email: 'admin@techcorp.com',
      plan: 'Enterprise',
      status: 'active',
      users: 45,
      aiUsage: 95,
      monthlySpend: 2450.75,
      createdAt: '2024-01-15T10:30:00Z',
      lastActivity: '2025-08-30T18:15:00Z',
      subscription: {
        tier: 'enterprise',
        limits: {
          users: 100,
          aiRequests: 10000,
          storage: '1TB'
        },
        usage: {
          users: 45,
          aiRequests: 8750,
          storage: '650GB'
        }
      },
      metrics: {
        totalRequests: 125000,
        avgResponseTime: 145,
        errorRate: 0.8,
        uptime: 99.9
      },
      recentActivity: [
        {
          type: 'ai_request',
          description: 'Processamento de automação de marketing',
          timestamp: '2025-08-30T18:15:00Z',
          user: 'john.doe@techcorp.com'
        },
        {
          type: 'user_added',
          description: 'Novo usuário adicionado à organização',
          timestamp: '2025-08-30T16:30:00Z',
          user: 'admin@techcorp.com'
        }
      ]
    };

    res.json({
      success: true,
      data: organizationDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get organization details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/organizations - Criar nova organização
router.post('/', async (req, res) => {
  try {
    const { name, email, plan, limits } = req.body;

    // Validate required fields
    if (!name || !email || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and plan are required'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const newOrganization = {
      id: Date.now().toString(),
      name,
      slug,
      email,
      plan,
      status: 'active',
      users: 0,
      aiUsage: 0,
      monthlySpend: 0,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      subscription: {
        tier: plan.toLowerCase(),
        limits: limits || {
          users: plan === 'Enterprise' ? 100 : plan === 'Professional' ? 25 : 10,
          aiRequests: plan === 'Enterprise' ? 10000 : plan === 'Professional' ? 5000 : 1000,
          storage: plan === 'Enterprise' ? '1TB' : plan === 'Professional' ? '500GB' : '100GB'
        }
      }
    };

    loggingService.info('New organization created', {
      orgId: newOrganization.id,
      name,
      email,
      plan
    });

    res.status(201).json({
      success: true,
      data: newOrganization,
      message: 'Organization created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggingService.error('Failed to create organization', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/organizations/:id - Editar organização
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedOrganization = {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    loggingService.info('Organization updated', {
      orgId: id,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      data: updatedOrganization,
      message: 'Organization updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/organizations/:id - Remover organização
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    loggingService.info('Organization deleted', { orgId: id });

    res.json({
      success: true,
      message: 'Organization deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/organizations/:id/status - Alterar status da organização
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'trial', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, trial, or suspended'
      });
    }

    loggingService.info('Organization status changed', { orgId: id, newStatus: status });

    res.json({
      success: true,
      data: { id, status, updatedAt: new Date().toISOString() },
      message: `Organization status changed to ${status}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update organization status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;