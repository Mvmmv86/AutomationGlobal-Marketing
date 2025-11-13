import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricCard from "@/components/dashboard/metric-card";
import AiModules from "@/components/dashboard/ai-modules";
import RecentAutomations from "@/components/dashboard/recent-automations";
import QuickActions from "@/components/dashboard/quick-actions";
import SystemStatus from "@/components/dashboard/system-status";
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import { organizationApi } from "@/lib/api";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pegar organizationId do localStorage
  const organizationId = localStorage.getItem('organizationId') || '550e8400-e29b-41d4-a716-446655440001';

  // Buscar dados do dashboard via API
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', organizationId],
    queryFn: () => organizationApi.getDashboard(organizationId),
    // Fallback para mock data se API falhar
    placeholderData: {
    stats: {
      totalUsers: 5,
      totalAutomations: 187,
      totalAiRequests: 24800,
      totalCost: 12450,
      activeModules: 3
    },
    aiUsage: {
      totalRequests: 24800,
      totalTokens: 450000,
      totalCost: 127.50
    },
    quotas: {
      users: { current: 5, limit: 10, withinLimit: true },
      aiRequests: { current: 24800, limit: 100000, withinLimit: true },
      modules: { current: 3, limit: -1, withinLimit: true }
    },
    modules: {
      marketing: {
        status: 'active',
        efficiency: 87,
        metrics: {
          adCopyGenerated: 2847,
          ctrImprovement: 34,
          costPerLead: -22
        }
      },
      support: {
        status: 'active', 
        efficiency: 92,
        metrics: {
          ticketsResolved: 1234,
          avgResponseTime: 2.3,
          customerSatisfaction: 4.8
        }
      },
      trading: {
        status: 'active',
        efficiency: 78,
        metrics: {
          signalsGenerated: 156,
          winRate: 78,
          portfolioGrowth: 15.7
        }
      }
    },
    recentAutomations: [
      {
        id: '1',
        name: 'Lead Scoring Automation',
        module: 'Marketing AI',
        status: 'running',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        processed: 234
      },
      {
        id: '2', 
        name: 'Support Ticket Auto-Reply',
        module: 'Support AI',
        status: 'completed',
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        processed: 89
      },
      {
        id: '3',
        name: 'Trading Signal Analysis', 
        module: 'Trading AI',
        status: 'running',
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        processed: 12
      }
    ],
    systemStatus: {
      api: { status: 'healthy', uptime: 99.9 },
      database: { status: 'healthy' },
      ai: { status: 'active' },
      queue: { status: 'processing' }
    }
  }
  });

  // Usar dados da API ou fallback para placeholder
  const stats = dashboardData?.stats || {};
  const modules = dashboardData?.modules || {};
  const recentAutomations = dashboardData?.recentAutomations || [];
  const systemStatus = dashboardData?.systemStatus || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          organizationName="Acme Corp"
          userName="John Smith"
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="AI Requests"
              value={stats.totalAiRequests?.toLocaleString() || '0'}
              change="+12%"
              icon="robot"
              color="accent"
              subtitle="Total requests made"
              data-testid="metric-ai-requests"
            />
            <MetricCard
              title="Automations"
              value={stats.totalAutomations?.toString() || '0'}
              change="Active"
              icon="cogs"
              color="blue"
              subtitle={`${stats.activeModules || 0} modules active`}
              data-testid="metric-automations"
            />
            <MetricCard
              title="Total Cost"
              value={`$${(stats.totalCost || 0).toLocaleString()}`}
              change="Saved"
              icon="dollar-sign"
              color="emerald"
              subtitle="Monthly spend"
              data-testid="metric-savings"
            />
            <MetricCard
              title="Total Users"
              value={stats.totalUsers?.toString() || '0'}
              change="Active"
              icon="chart-line"
              color="purple"
              subtitle="Organization users"
              data-testid="metric-success-rate"
            />
          </div>

          {/* AI Modules Performance */}
          <AiModules modules={modules} />

          {/* Recent Automations & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAutomations automations={recentAutomations} />
            <QuickActions 
              aiCredits={{ current: 2847, limit: 5000 }}
              automations={{ current: 187, limit: 500 }}
            />
          </div>

          {/* System Status */}
          <SystemStatus status={systemStatus} />
        </main>
      </div>
    </div>
  );
}
