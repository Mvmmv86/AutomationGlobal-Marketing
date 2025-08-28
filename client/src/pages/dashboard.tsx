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
import { Menu } from "lucide-react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data for development - in real app this would come from API
  const mockDashboardData = {
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
  };

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
              title="AI Requests Today"
              value="24.8K"
              change="+12%"
              icon="robot"
              color="accent"
              subtitle="2.3K more than yesterday"
              data-testid="metric-ai-requests"
            />
            <MetricCard
              title="Running Automations"
              value="187"
              change="Active"
              icon="cogs"
              color="blue"
              subtitle="23 started this week"
              data-testid="metric-automations"
            />
            <MetricCard
              title="Monthly Savings"
              value="$12,450"
              change="Saved"
              icon="dollar-sign"
              color="emerald"
              subtitle="18% vs last month"
              data-testid="metric-savings"
            />
            <MetricCard
              title="Success Rate"
              value="98.7%"
              change="Excellent"
              icon="chart-line"
              color="purple"
              subtitle="Above industry average"
              data-testid="metric-success-rate"
            />
          </div>

          {/* AI Modules Performance */}
          <AiModules modules={mockDashboardData.modules} />

          {/* Recent Automations & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAutomations automations={mockDashboardData.recentAutomations} />
            <QuickActions 
              aiCredits={{ current: 2847, limit: 5000 }}
              automations={{ current: 187, limit: 500 }}
            />
          </div>

          {/* System Status */}
          <SystemStatus status={mockDashboardData.systemStatus} />
        </main>
      </div>
    </div>
  );
}
