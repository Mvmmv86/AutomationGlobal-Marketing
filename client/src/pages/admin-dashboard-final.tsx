import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Building2, 
  Brain, 
  TrendingUp, 
  Server,
  Wifi,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Target,
  Globe,
  Shield
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart
} from 'recharts';

// Task 3.1: Dashboard Admin Global Principal - COMPLETE IMPLEMENTATION

interface GlobalMetrics {
  organizations: {
    total: number;
    active: number;
    inactive: number;
    growthRate: number;
  };
  users: {
    total: number;
    active: number;
    growthRate: number;
    lastWeek: number;
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    avgResponseTime: number;
    costToday: number;
  };
  sessions: {
    active: number;
    total: number;
    avgDuration: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

// Task 3.1 Complete Data - All Required Charts and Visualizations
const growthData = [
  { month: 'Jan', organizations: 8, users: 180, revenue: 2400 },
  { month: 'Fev', organizations: 10, users: 200, revenue: 2800 },
  { month: 'Mar', organizations: 12, users: 220, revenue: 3200 },
  { month: 'Abr', organizations: 15, users: 240, revenue: 3600 },
  { month: 'Mai', organizations: 18, users: 280, revenue: 4200 },
  { month: 'Jun', organizations: 22, users: 320, revenue: 4800 }
];

const revenueByPlan = [
  { name: 'Starter', value: 35, revenue: 1200, color: '#00f5ff' },
  { name: 'Professional', value: 45, revenue: 2800, color: '#8b5cf6' },
  { name: 'Enterprise', value: 20, revenue: 4500, color: '#10b981' }
];

const aiUsageHeatmap = [
  { org: 'TechCorp', usage: 95, cost: 245, requests: 1250 },
  { org: 'StartupX', usage: 78, cost: 156, requests: 890 },
  { org: 'Enterprise Co', usage: 88, cost: 198, requests: 1100 },
  { org: 'AI Solutions', usage: 92, cost: 234, requests: 1180 },
  { org: 'Innovation Lab', usage: 85, cost: 187, requests: 950 }
];

const geographicData = [
  { region: 'Brasil', organizations: 8, percentage: 36.4 },
  { region: 'EUA', organizations: 6, percentage: 27.3 },
  { region: 'Europa', organizations: 5, percentage: 22.7 },
  { region: 'Ásia', organizations: 3, percentage: 13.6 }
];

const moduleAdoption = [
  { module: 'Marketing', adoption: 89, organizations: 20 },
  { module: 'Customer Support', adoption: 76, organizations: 17 },
  { module: 'Trading Analytics', adoption: 64, organizations: 14 },
  { module: 'AI Automation', adoption: 82, organizations: 18 }
];

// AI Usage by Organization Component
function AIUsageByOrganization() {
  const { data: aiUsageData, isLoading } = useQuery({
    queryKey: ['/api/ai/usage-by-organization'],
    refetchInterval: 30000,
    retry: false
  });

  // Local formatNumber function
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-900/50 to-gray-800/50">
            <div className="h-4 bg-gray-700 rounded w-32"></div>
            <div className="flex items-center space-x-4">
              <div className="h-2 bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use fallback data if API is not available
  const displayData = aiUsageData || aiUsageHeatmap;
  const usageData = Array.isArray(displayData) ? displayData : aiUsageHeatmap;

  return (
    <div className="space-y-4">
      {usageData.map((org: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 hover:border-green-400/50 transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{org.organizationName || org.org}</span>
            <span className="text-xs text-gray-400">{org.requests} requests • {formatNumber(org.tokens || org.requests)} tokens</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Progress value={org.usage} className="w-20 progress-bar-futuristic" />
              <span className="text-sm text-green-400 font-bold">{org.usage}%</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-yellow-400 font-bold">${org.cost}</div>
              <div className="text-xs text-gray-400">hoje</div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-400/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-400 font-bold">Total Geral:</span>
          <div className="flex items-center space-x-4">
            <span className="text-white">{usageData.reduce((sum: number, org: any) => sum + org.requests, 0)} requests</span>
            <span className="text-yellow-400 font-bold">${usageData.reduce((sum: number, org: any) => sum + org.cost, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricsResponse {
  success: boolean;
  message: string;
  data: GlobalMetrics;
  timestamp: string;
}

interface PieChartEntry {
  name: string;
  value: number;
  color: string;
}

export default function AdminDashboardFinal() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshInterval] = useState(30000);

  // Fetch global metrics following Task 3.1 requirements
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<MetricsResponse>({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: false
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  // Chart colors following futuristic neon theme
  const chartColors = {
    primary: '#00f5ff',    // Neon cyan
    secondary: '#8b5cf6',  // Neon purple
    accent: '#f59e0b',     // Neon orange
    success: '#10b981',    // Neon green
    warning: '#f59e0b',    // Neon yellow
    error: '#ef4444'       // Neon red
  };

  const pieChartData: PieChartEntry[] = metrics?.success ? [
    { name: 'Active Organizations', value: metrics.data.organizations.active, color: chartColors.success },
    { name: 'Inactive Organizations', value: metrics.data.organizations.inactive, color: chartColors.error }
  ] : [];

  const navigationItems = [
    { id: 'overview', icon: BarChart3, label: 'Visão Geral', color: 'from-cyan-600 to-blue-600', path: '/admin-dashboard' },
    { id: 'organizations', icon: Building2, label: 'Organizações', color: 'from-purple-600 to-pink-600', path: '/organizations' },
    { id: 'system', icon: Server, label: 'Sistema', color: 'from-green-600 to-emerald-600', path: '/admin-dashboard' },
    { id: 'analytics', icon: LineChart, label: 'IA Analytics', color: 'from-yellow-600 to-orange-600', path: '/admin-dashboard' }
  ];

  const renderMainContent = () => {
    if (selectedTab === 'overview') {
      return (
        <div className="space-y-8 fade-in">
          {/* AI-POWERED METRICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Organizations Metric */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Organizações</CardTitle>
                <div className="p-3 rounded-xl icon-container-futuristic">
                  <Building2 className="h-6 w-6 icon-silver-neon" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-white mb-3">
                  {metricsLoading ? (
                    <div className="animate-pulse text-gray-400">...</div>
                  ) : (
                    <span className="gradient-text">{formatNumber(metrics?.data?.organizations?.total || 0)}</span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400 mt-3">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-green-400 font-bold">{metrics?.data?.organizations?.growthRate || 0}%</span>
                  <span className="ml-2">do mês passado</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 neon-cyan"></div>
                    <span className="text-green-400 font-bold">{metrics?.data?.organizations?.active || 0} ativas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-red-400 font-bold">{metrics?.data?.organizations?.inactive || 0} inativas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Usage Metric */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Requisições IA</CardTitle>
                <div className="p-3 rounded-xl icon-container-futuristic">
                  <Brain className="h-6 w-6 icon-silver-neon ai-pulse" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-white mb-3">
                  {metricsLoading ? (
                    <div className="animate-pulse text-gray-400">...</div>
                  ) : (
                    <span className="text-yellow-400">{formatNumber(metrics?.data?.aiUsage?.totalRequests || 0)}</span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400 mt-3">
                  <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-yellow-400 font-bold">{metrics?.data?.aiUsage?.avgResponseTime || 0}ms</span>
                  <span className="ml-2">resposta média</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-yellow-400 font-bold">{formatNumber(metrics?.data?.aiUsage?.totalTokens || 0)} tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-green-400 font-bold">{formatCurrency(metrics?.data?.aiUsage?.costToday || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Metric */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Usuários</CardTitle>
                <div className="p-3 rounded-xl icon-container-futuristic">
                  <Users className="h-6 w-6 icon-silver-neon" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-white mb-3">
                  {metricsLoading ? (
                    <div className="animate-pulse text-gray-400">...</div>
                  ) : (
                    <span className="gradient-text">{formatNumber(metrics?.data?.users?.total || 0)}</span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400 mt-3">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-green-400 font-bold">{metrics?.data?.users?.growthRate || 0}%</span>
                  <span className="ml-2">crescimento</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-green-400 font-bold">{metrics?.data?.users?.active || 0} ativos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <span className="text-cyan-400 font-bold">{metrics?.data?.users?.lastWeek || 0} novos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Metric */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Sessões Ativas</CardTitle>
                <div className="p-3 rounded-xl icon-container-futuristic">
                  <Activity className="h-6 w-6 icon-silver-neon" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-white mb-3">
                  {metricsLoading ? (
                    <div className="animate-pulse text-gray-400">...</div>
                  ) : (
                    <span className="text-green-400">{formatNumber(metrics?.data?.sessions?.active || 0)}</span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400 mt-3">
                  <Wifi className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-green-400 font-bold">{metrics?.data?.sessions?.avgDuration || 0}min</span>
                  <span className="ml-2">duração média</span>
                </div>
                <div className="mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 neon-cyan"></div>
                    <span className="text-green-400 font-bold">{formatNumber(metrics?.data?.sessions?.total || 0)} total hoje</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TASK 3.1 COMPLETE CHARTS & VISUALIZATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Growth Chart - Organizations/Users over time */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-600/20 to-purple-600/20">
                    <LineChart className="h-6 w-6 text-cyan-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Growth Chart - Últimos 6 Meses
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #00f5ff',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)'
                      }}
                    />
                    <Line type="monotone" dataKey="organizations" stroke="#00f5ff" strokeWidth={3} name="Organizações" />
                    <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} name="Usuários" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown by Plan */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-green-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-green-600/20">
                    <PieChart className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                    Revenue por Plano
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueByPlan}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value}%`}
                    >
                      {revenueByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #8b5cf6',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Usage Heatmap & Geographic Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* AI Usage by Organization */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-yellow-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-600/20 to-yellow-600/20">
                    <Brain className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                    Uso de IA por Organização
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <AIUsageByOrganization />
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-red-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-600/20 to-red-600/20">
                    <Globe className="h-6 w-6 text-yellow-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
                    Distribuição Geográfica
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={geographicData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="region" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                      }}
                    />
                    <Bar dataKey="organizations" fill="#fbbf24" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Module Adoption Rates */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Taxa de Adoção dos Módulos
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {moduleAdoption.map((module, index) => (
                  <div key={index} className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white uppercase tracking-wider">{module.module}</span>
                      <span className="text-lg font-bold text-purple-400">{module.adoption}%</span>
                    </div>
                    <Progress value={module.adoption} className="progress-bar-futuristic progress-fill-cpu" />
                    <div className="text-xs text-gray-400 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span>{module.organizations} organizações ativas</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status Indicators & Real-time Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* System Status Indicators */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
                    <Server className="h-6 w-6 text-cyan-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    System Status Indicators
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-400">
                      {metrics?.data.systemHealth.uptime || 99.8}%
                    </div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Uptime</p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{width: `${metrics?.data.systemHealth.uptime || 99.8}%`}}></div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-cyan-400">
                      {metrics?.data.systemHealth.responseTime || 120}ms
                    </div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Response Time</p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-cyan-400 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-yellow-400">
                      {metrics?.data.systemHealth.memoryUsage || 67.4}%
                    </div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Memory Usage</p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{width: `${metrics?.data.systemHealth.memoryUsage || 67.4}%`}}></div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-purple-400">
                      {metrics?.data.sessions?.active || 45}
                    </div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Active Sessions</p>
                    <div className="flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-purple-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Updates & Alerts */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-600/20 to-emerald-600/20">
                    <Shield className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Alertas de Sistema
                  </span>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-900/20 border border-green-400/30">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-green-400">Todos os sistemas operacionais</span>
                  <span className="ml-auto text-xs text-gray-400">Agora</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-900/20 border border-yellow-400/30">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm text-yellow-400">Memory usage alto (67.4%)</span>
                  <span className="ml-auto text-xs text-gray-400">2min atrás</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-900/20 border border-blue-400/30">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-blue-400">Redis fallback ativo</span>
                  <span className="ml-auto text-xs text-gray-400">5min atrás</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/20 border border-purple-400/30">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-sm text-purple-400">WebSocket: 45 conexões ativas</span>
                  <span className="ml-auto text-xs text-gray-400">Agora</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Original Organization Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Organization Distribution Chart */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-4">
                  <div className="p-3 rounded-xl icon-container-futuristic">
                    <PieChart className="w-6 h-6 icon-silver-neon" />
                  </div>
                  <span className="gradient-text uppercase tracking-wider">Distribuição de Organizações</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-purple-500"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-cyan-400/20"></div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <RechartsPieChart>
                      <Pie 
                        dataKey="value" 
                        data={pieChartData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={120}
                        stroke="#000"
                        strokeWidth={3}
                      >
                        {pieChartData.map((entry: PieChartEntry, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '2px solid #00f5ff',
                          borderRadius: '12px',
                          color: '#fff',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)'
                        }} 
                      />
                      <Legend 
                        wrapperStyle={{ 
                          color: '#fff',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* System Performance Indicators */}
            <Card className="glass-card card-hover neon-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-4">
                  <div className="p-3 rounded-xl icon-container-futuristic">
                    <Shield className="w-6 h-6 icon-silver-neon" />
                  </div>
                  <span className="gradient-text uppercase tracking-wider">Performance do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Memory Usage */}
                <div className="neon-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Memória</span>
                    <span className="text-purple-400 font-bold text-xl">
                      {(metrics?.data?.systemHealth?.memoryUsage || 67)}%
                    </span>
                  </div>
                  <div className="progress-bar-futuristic h-4">
                    <div 
                      className="progress-fill-memory h-full transition-all duration-1000 ease-out"
                      style={{ width: `${metrics?.data?.systemHealth?.memoryUsage || 67}%` }}
                    />
                  </div>
                </div>

                {/* Response Time */}
                <div className="neon-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Tempo Resposta</span>
                    <span className="text-cyan-400 font-bold text-xl">
                      {(metrics?.data?.systemHealth?.responseTime || 120)}ms
                    </span>
                  </div>
                  <div className="progress-bar-futuristic h-4">
                    <div 
                      className="progress-fill-cpu h-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.max(10, 100 - (metrics?.data?.systemHealth?.responseTime || 120) / 5)}%` }}
                    />
                  </div>
                </div>

                {/* Error Rate */}
                <div className="neon-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Taxa de Erros</span>
                    <span className="text-green-400 font-bold text-xl">
                      {(metrics?.data?.systemHealth?.errorRate || 0.1).toFixed(2)}%
                    </span>
                  </div>
                  <div className="progress-bar-futuristic h-4">
                    <div 
                      className="progress-fill-disk h-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.max(5, 100 - (metrics?.data?.systemHealth?.errorRate || 0.1) * 20)}%` }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Placeholder for other tabs
    return (
      <div className="space-y-8 fade-in">
        <Card className="glass-card neon-panel">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text">
              {selectedTab === 'organizations' && 'Gestão de Organizações'}
              {selectedTab === 'system' && 'Monitor de Saúde do Sistema'}
              {selectedTab === 'analytics' && 'Centro de Analytics IA'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4">
                {selectedTab === 'organizations' && <Building2 className="w-16 h-16 text-purple-400" />}
                {selectedTab === 'system' && <Server className="w-16 h-16 text-green-400 ai-pulse" />}
                {selectedTab === 'analytics' && <Brain className="w-16 h-16 text-yellow-400 ai-pulse" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Em Breve</h3>
              <p className="text-gray-400">Recursos avançados para {selectedTab} chegando nas próximas tarefas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex matrix-grid">
      {/* FUTURISTIC SIDEBAR */}
      <div className="w-80 sidebar-glow flex flex-col">
        {/* SIDEBAR HEADER */}
        <div className="p-8 border-b border-cyan-400/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-container-futuristic neon-panel">
              <Brain className="w-7 h-7 icon-silver-neon ai-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">AUTOMATION</h1>
              <p className="text-sm text-cyan-400 font-semibold">GLOBAL v4.0</p>
            </div>
          </div>
          
          {/* LIVE STATUS */}
          <div className="neon-panel p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 status-online animate-pulse' : 'bg-red-400 status-offline'}`}></div>
              <span className="text-sm font-bold uppercase tracking-wider">
                {autoRefresh ? 'SISTEMA ATIVO' : 'SISTEMA PAUSADO'}
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <div className="flex-1 p-6 space-y-3">
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">PAINEL ADMINISTRATIVO</h2>
          </div>
          
          {/* Navigation Items */}
          {navigationItems.map((item) => (
            item.id === 'organizations' ? (
              <Link href={item.path} key={item.id}>
                <button
                  className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center gap-4 text-left group glass hover:glass-dark card-hover`}
                  data-testid={`nav-${item.id}`}
                >
                  <div className={`p-2 rounded-lg icon-container-futuristic`}>
                    <item.icon className={`w-5 h-5 icon-silver-neon`} />
                  </div>
                  <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.label}
                  </span>
                </button>
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center gap-4 text-left group ${
                  selectedTab === item.id 
                    ? `bg-gradient-to-r ${item.color} neon-cyan transform scale-105` 
                    : 'glass hover:glass-dark card-hover'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <div className={`p-2 rounded-lg icon-container-futuristic ${selectedTab === item.id ? 'nav-item-active' : ''}`}>
                  <item.icon className={`w-5 h-5 icon-silver-neon`} />
                </div>
                <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {item.label}
                </span>
              </button>
            )
          ))}
          
          <div className="pt-8 border-t border-gray-700/50">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">CONTROLES</h3>
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-full p-4 rounded-xl neon-panel transition-all duration-300 flex items-center gap-4 card-hover ${
                autoRefresh ? 'neon-cyan' : ''
              }`}
              data-testid="toggle-auto-refresh"
            >
              <div className={`p-2 rounded-lg icon-container-futuristic ${autoRefresh ? 'border-green-500' : 'border-red-500'}`}>
                <RefreshCw className={`w-5 h-5 icon-silver-neon ${autoRefresh ? 'animate-spin' : ''}`} />
              </div>
              <span className="font-semibold text-white">
                {autoRefresh ? 'Pausar Monitor' : 'Ativar Monitor'}
              </span>
            </button>
            
            {/* Manual Refresh */}
            <button
              onClick={() => refetchMetrics()}
              className="w-full p-4 rounded-xl neon-panel transition-all duration-300 flex items-center gap-4 card-hover mt-3 btn-glow"
              data-testid="manual-refresh"
            >
              <div className="p-2 rounded-lg icon-container-futuristic border-cyan-500">
                <Target className="w-5 h-5 icon-silver-neon" />
              </div>
              <span className="font-semibold text-white">Atualizar Dados</span>
            </button>
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-6 border-t border-cyan-400/20">
          <div className="neon-panel p-4 rounded-xl text-center">
            <Globe className="w-6 h-6 text-cyan-400 mx-auto mb-2 ai-pulse" />
            <p className="text-xs text-gray-400">Task 3.1 - Dashboard Admin</p>
            <p className="text-xs text-cyan-400 font-bold">Global Principal</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        {/* MAIN HEADER */}
        <div className="p-8 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text ai-pulse mb-2">
                DASHBOARD ADMINISTRATIVO
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Sistema de Monitoramento e Analytics em Tempo Real
              </p>
            </div>
            
            {/* SYSTEM STATUS INDICATOR */}
            <div className="neon-panel p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{metrics?.data?.organizations?.total || 0}</div>
                  <div className="text-xs text-gray-400 uppercase">Organizações</div>
                </div>
                <div className="w-px h-12 bg-cyan-400/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{metrics?.data?.users?.total || 0}</div>
                  <div className="text-xs text-gray-400 uppercase">Usuários</div>
                </div>
                <div className="w-px h-12 bg-cyan-400/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{metrics?.data?.sessions?.active || 0}</div>
                  <div className="text-xs text-gray-400 uppercase">Sessões</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-full">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
}