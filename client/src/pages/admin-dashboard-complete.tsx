import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  Building2, 
  Brain, 
  TrendingUp, 
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Target,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Map,
  Layers,
  DollarSign,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// Task 3.1: Dashboard Admin Global Principal - COMPLETE VERSION

interface GlobalMetrics {
  organizations: {
    total: number;
    active: number;
    inactive: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    growth: number;
  };
  aiUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  systemHealth: {
    status: string;
    uptime: string;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  };
  revenue: {
    total: number;
    growth: number;
  };
  activeSessions: number;
}

interface MetricsResponse {
  success: boolean;
  message: string;
  data: GlobalMetrics;
  timestamp: string;
}

// Mock data for charts
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
  { org: 'TechCorp', usage: 95, cost: 245 },
  { org: 'StartupX', usage: 78, cost: 156 },
  { org: 'Enterprise Co', usage: 88, cost: 198 },
  { org: 'AI Solutions', usage: 92, cost: 234 },
  { org: 'Innovation Lab', usage: 85, cost: 187 }
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

export default function AdminDashboardComplete() {
  const [isRealTime, setIsRealTime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: metrics, isLoading, refetch } = useQuery<MetricsResponse>({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: isRealTime ? 30000 : false, // Real-time updates every 30s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const systemAlerts = [
    { type: 'warning', message: 'High memory usage (67.4%)', icon: AlertTriangle, color: 'text-yellow-400' },
    { type: 'success', message: 'All systems operational', icon: CheckCircle, color: 'text-green-400' },
    { type: 'info', message: 'Redis fallback active', icon: Server, color: 'text-blue-400' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-[#00f5ff]">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Carregando Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative overflow-hidden">
      {/* Matrix Grid Background */}
      <div className="matrix-grid absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Header with Real-time Status */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-wider bg-gradient-to-r from-[#00f5ff] to-[#8b5cf6] bg-clip-text text-transparent">
              AUTOMATION GLOBAL v4.0
            </h1>
            <p className="text-[#e2e8f0] mt-2">Dashboard Admin Global Principal</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isRealTime ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className="text-sm">
                {isRealTime ? 'Real-time Ativo' : 'Real-time Inativo'}
              </span>
            </div>
            
            <div className="text-sm text-[#64748b]">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </div>
            
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className="px-4 py-2 bg-[#1e293b] border border-[#00f5ff] rounded-lg text-[#00f5ff] hover:bg-[#00f5ff] hover:text-black transition-all duration-300"
            >
              {isRealTime ? 'Pausar' : 'Ativar'} Real-time
            </button>
          </div>
        </div>

        {/* System Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {systemAlerts.map((alert, index) => (
            <div key={index} className="neon-panel p-4 flex items-center space-x-3">
              <alert.icon className={`w-5 h-5 ${alert.color}`} />
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Organizations */}
          <Card className="neon-panel border-[#00f5ff]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#e2e8f0]">
                Organizações Ativas
              </CardTitle>
              <Building2 className="icon-silver-neon w-6 h-6" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00f5ff] mb-2">
                {metrics?.data.organizations.total || 0}
              </div>
              <p className="text-sm text-[#10b981] flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{metrics?.data.organizations.growth || 0}% este mês
              </p>
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="neon-panel border-[#8b5cf6]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#e2e8f0]">
                Usuários Totais
              </CardTitle>
              <Users className="icon-silver-neon w-6 h-6" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#8b5cf6] mb-2">
                {metrics?.data.users.total || 0}
              </div>
              <p className="text-sm text-[#10b981] flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{metrics?.data.users.growth || 0}% crescimento
              </p>
            </CardContent>
          </Card>

          {/* AI Usage */}
          <Card className="neon-panel border-[#10b981]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#e2e8f0]">
                Uso de IA
              </CardTitle>
              <Brain className="icon-silver-neon w-6 h-6" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#10b981] mb-2">
                {metrics?.data.aiUsage.requests || 0}
              </div>
              <p className="text-sm text-[#e2e8f0]">
                Requests hoje
              </p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="neon-panel border-[#fbbf24]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#e2e8f0]">
                Revenue Total
              </CardTitle>
              <DollarSign className="icon-silver-neon w-6 h-6" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#fbbf24] mb-2">
                ${metrics?.data.revenue.total || 0}
              </div>
              <p className="text-sm text-[#10b981] flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{metrics?.data.revenue.growth || 0}% este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Chart */}
          <Card className="neon-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5 text-[#00f5ff]" />
                <span>Growth Chart - Últimos 6 Meses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #00f5ff',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="organizations" stroke="#00f5ff" strokeWidth={3} />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="neon-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-[#8b5cf6]" />
                <span>Revenue por Plano</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Usage Heatmap & Geographic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Usage Heatmap */}
          <Card className="neon-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-[#10b981]" />
                <span>AI Usage Heatmap</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiUsageHeatmap.map((org, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{org.org}</span>
                    <div className="flex items-center space-x-3">
                      <Progress value={org.usage} className="w-24" />
                      <span className="text-sm text-[#10b981]">${org.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card className="neon-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-[#fbbf24]" />
                <span>Distribuição Geográfica</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={geographicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="region" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="organizations" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Module Adoption Rates */}
        <Card className="neon-panel mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#8b5cf6]" />
              <span>Taxa de Adoção dos Módulos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {moduleAdoption.map((module, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{module.module}</span>
                    <span className="text-sm text-[#8b5cf6]">{module.adoption}%</span>
                  </div>
                  <Progress value={module.adoption} className="progress-bar-futuristic" />
                  <span className="text-xs text-[#64748b]">
                    {module.organizations} organizações
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health Status */}
        <Card className="neon-panel">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-[#00f5ff]" />
              <span>System Status Indicators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b981] mb-2">
                  {metrics?.data.systemHealth.uptime || '99.8%'}
                </div>
                <p className="text-sm text-[#e2e8f0]">Uptime</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00f5ff] mb-2">
                  {metrics?.data.systemHealth.responseTime || 120}ms
                </div>
                <p className="text-sm text-[#e2e8f0]">Response Time</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-[#fbbf24] mb-2">
                  {metrics?.data.systemHealth.memoryUsage || 67.4}%
                </div>
                <p className="text-sm text-[#e2e8f0]">Memory Usage</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8b5cf6] mb-2">
                  {metrics?.data.activeSessions || 45}
                </div>
                <p className="text-sm text-[#e2e8f0]">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}