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
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// Task 3.1: Dashboard Admin Global Principal - FUTURISTIC DESIGN SYSTEM

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
    { id: 'overview', icon: BarChart3, label: 'Visão Geral', color: 'from-cyan-600 to-blue-600' },
    { id: 'organizations', icon: Building2, label: 'Organizações', color: 'from-purple-600 to-pink-600' },
    { id: 'system', icon: Server, label: 'Sistema', color: 'from-green-600 to-emerald-600' },
    { id: 'analytics', icon: LineChart, label: 'IA Analytics', color: 'from-yellow-600 to-orange-600' }
  ];

  const renderMainContent = () => {
    if (selectedTab === 'overview') {
      return (
        <div className="space-y-8 fade-in">
          {/* AI-POWERED METRICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Organizations Metric */}
            <Card className="glass border-gray-700 card-hover neon-blue relative overflow-hidden">
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
            <Card className="glass border-gray-700 card-hover relative overflow-hidden">
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
            <Card className="glass border-gray-700 card-hover neon-cyan relative overflow-hidden">
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
            <Card className="glass border-gray-700 card-hover relative overflow-hidden">
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

          {/* VISUAL ANALYTICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Organization Distribution Chart */}
            <Card className="glass border-gray-700 card-hover relative overflow-hidden">
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
            <Card className="glass border-gray-700 card-hover relative overflow-hidden">
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
                
                {/* Uptime Display */}
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Tempo de Atividade</span>
                    <span className="text-green-400 font-bold text-xl">
                      {Math.floor((metrics?.data?.systemHealth?.uptime || 0) / 86400)}d {Math.floor(((metrics?.data?.systemHealth?.uptime || 0) % 86400) / 3600)}h
                    </span>
                  </div>
                  <Progress 
                    value={99.9} 
                    className="h-3 bg-gray-800" 
                  />
                </div>

                {/* Response Time */}
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Tempo Resposta Médio</span>
                    <span className="text-cyan-400 font-bold text-xl">
                      {metrics?.data?.systemHealth?.responseTime || 0}ms
                    </span>
                  </div>
                  <Progress 
                    value={100 - (metrics?.data?.systemHealth?.responseTime || 0) / 10} 
                    className="h-3 bg-gray-800" 
                  />
                </div>

                {/* Error Rate */}
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 font-bold uppercase tracking-wider">Taxa de Erros</span>
                    <span className="text-yellow-400 font-bold text-xl">
                      {(metrics?.data?.systemHealth?.errorRate || 0).toFixed(2)}%
                    </span>
                  </div>
                  <Progress 
                    value={100 - (metrics?.data?.systemHealth?.errorRate || 0)} 
                    className="h-3 bg-gray-800" 
                  />
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
        <Card className="glass border-gray-700">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-container-futuristic neon-cyan">
              <Brain className="w-7 h-7 icon-silver-neon ai-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">AUTOMATION</h1>
              <p className="text-sm text-cyan-400 font-semibold">GLOBAL v4.0</p>
            </div>
          </div>
          
          {/* LIVE STATUS */}
          <div className="glass p-4 rounded-xl neon-blue">
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
          ))}
          
          <div className="pt-8 border-t border-gray-700/50">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">CONTROLES</h3>
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-full p-4 rounded-xl glass transition-all duration-300 flex items-center gap-4 card-hover ${
                autoRefresh ? 'neon-blue' : ''
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
              className="w-full p-4 rounded-xl glass transition-all duration-300 flex items-center gap-4 card-hover mt-3 btn-glow"
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
          <div className="glass p-4 rounded-xl text-center">
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
            <div className="glass p-6 rounded-xl neon-blue">
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