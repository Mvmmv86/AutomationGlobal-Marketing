import { Router } from 'express';

const router = Router();

// AI Usage by Organization - Task 3.1 requirement
router.get('/usage-by-organization', async (req, res) => {
  try {
    // AI usage data per organization - Task 3.1 requirement
    const aiUsageByOrg = [
      {
        organizationId: '1',
        organizationName: 'TechCorp Solutions',
        usage: 95,
        requests: 1250,
        tokens: 875000,
        cost: 245.50,
        models: [
          { name: 'GPT-4', usage: 57, cost: 147.30 },
          { name: 'Claude-3', usage: 38, cost: 98.20 }
        ],
        period: 'today'
      },
      {
        organizationId: '2',
        organizationName: 'StartupX Innovation',
        usage: 78,
        requests: 890,
        tokens: 623000,
        cost: 156.75,
        models: [
          { name: 'GPT-4', usage: 47, cost: 94.05 },
          { name: 'Claude-3', usage: 31, cost: 62.70 }
        ],
        period: 'today'
      },
      {
        organizationId: '3',
        organizationName: 'Enterprise Co',
        usage: 88,
        requests: 1100,
        tokens: 770000,
        cost: 198.40,
        models: [
          { name: 'GPT-4', usage: 53, cost: 119.04 },
          { name: 'Claude-3', usage: 35, cost: 79.36 }
        ],
        period: 'today'
      },
      {
        organizationId: '4',
        organizationName: 'AI Solutions Ltd',
        usage: 92,
        requests: 1180,
        tokens: 826000,
        cost: 234.12,
        models: [
          { name: 'GPT-4', usage: 55, cost: 140.47 },
          { name: 'Claude-3', usage: 37, cost: 93.65 }
        ],
        period: 'today'
      },
      {
        organizationId: '5',
        organizationName: 'Innovation Lab',
        usage: 85,
        requests: 950,
        tokens: 665000,
        cost: 187.30,
        models: [
          { name: 'GPT-4', usage: 51, cost: 112.38 },
          { name: 'Claude-3', usage: 34, cost: 74.92 }
        ],
        period: 'today'
      }
    ];

    res.json({
      success: true,
      message: 'AI usage by organization retrieved successfully',
      data: aiUsageByOrg,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI usage data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Models Usage Distribution
router.get('/models-distribution', async (req, res) => {
  try {
    const modelsDistribution = [
      { 
        model: 'GPT-4', 
        usage: 65, 
        requests: 4250, 
        cost: 612.85,
        organizations: 18,
        color: '#00f5ff'
      },
      { 
        model: 'Claude-3', 
        usage: 25, 
        requests: 1650, 
        cost: 408.83,
        organizations: 12,
        color: '#8b5cf6'
      },
      { 
        model: 'GPT-3.5', 
        usage: 10, 
        requests: 850, 
        cost: 87.32,
        organizations: 8,
        color: '#10b981'
      }
    ];

    res.json({
      success: true,
      message: 'AI models distribution retrieved successfully',
      data: modelsDistribution,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI models data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;