import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Building2, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
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
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Task 3.1: Dashboard Admin Global Principal
// Following PRD specifications for futuristic design system

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

export default function AdminDashboardV2() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 matrix-grid">
      <div className="max-w-7xl mx-auto">
        {/* FUTURISTIC HEADER - Following PRD Design System */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold gradient-text ai-pulse mb-2">
              AUTOMATION GLOBAL v4.0
            </h1>
            <h2 className="text-3xl font-semibold text-cyan-400 mb-1">Admin Global Dashboard</h2>
            <p className="text-gray-400 flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-cyan-400 ai-pulse" />
              Task 3.1 - AI-Powered System Analytics & Real-time Monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live Status Indicator */}
            <div className="glass p-4 rounded-xl flex items-center gap-4 neon-blue">
              <div className={`w-4 h-4 rounded-full ${autoRefresh ? 'bg-green-400 neon-cyan animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300 font-bold uppercase tracking-wider">
                {autoRefresh ? 'LIVE MONITORING' : 'PAUSED'}
              </span>
            </div>
            
            {/* Control Buttons */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-8 py-4 glass rounded-xl text-sm transition-all btn-glow font-bold uppercase tracking-wider ${
                autoRefresh ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
              }`}
              data-testid="button-toggle-refresh"
            >
              {autoRefresh ? 'PAUSE MONITOR' : 'START MONITOR'}
            </button>
            
            <button
              onClick={() => refetchMetrics()}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-sm transition-all btn-glow flex items-center gap-3 font-bold uppercase tracking-wider neon-blue"
              data-testid="button-manual-refresh"
            >
              <RefreshCw className="w-5 h-5" />
              REFRESH SYSTEM
            </button>
          </div>
        </div>

        {/* FUTURISTIC TABS - Following PRD Design */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="glass border-gray-700 p-2 rounded-2xl bg-black/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white px-8 py-4 rounded-xl transition-all font-bold uppercase tracking-wider"
            >
              <BarChart3 className="w-6 h-6" />
              SYSTEM OVERVIEW
            </TabsTrigger>
            <TabsTrigger 
              value="organizations" 
              className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white px-8 py-4 rounded-xl transition-all font-bold uppercase tracking-wider"
            >
              <Building2 className="w-6 h-6" />
              ORGANIZATIONS
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white px-8 py-4 rounded-xl transition-all font-bold uppercase tracking-wider"
            >
              <Server className="w-6 h-6" />
              SYSTEM HEALTH
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white px-8 py-4 rounded-xl transition-all font-bold uppercase tracking-wider"
            >
              <LineChart className="w-6 h-6" />
              AI ANALYTICS
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB - Task 3.1 Core Metrics */}
          <TabsContent value="overview" className="space-y-8 fade-in">
            {/* AI-POWERED METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Organizations Metric - Futuristic Design */}
              <Card className="glass border-gray-700 card-hover neon-blue relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                  <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Organizations</CardTitle>
                  <div className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl neon-blue">
                    <Building2 className="h-6 w-6 text-white" />
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
                    <span className="ml-2">from last month</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 neon-cyan"></div>
                      <span className="text-green-400 font-bold">{metrics?.data?.organizations?.active || 0} active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <span className="text-red-400 font-bold">{metrics?.data?.organizations?.inactive || 0} inactive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Usage Metric - Special AI-focused design */}
              <Card className="glass border-gray-700 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                  <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">AI Requests</CardTitle>
                  <div className="p-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl">
                    <Brain className="h-6 w-6 text-white ai-pulse" />
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
                    <span className="ml-2">avg response</span>
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
                  <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Users</CardTitle>
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
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
                    <span className="ml-2">growth rate</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="text-green-400 font-bold">{metrics?.data?.users?.active || 0} active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                      <span className="text-cyan-400 font-bold">{metrics?.data?.users?.lastWeek || 0} new</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions Metric */}
              <Card className="glass border-gray-700 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                  <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Live Sessions</CardTitle>
                  <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                    <Activity className="h-6 w-6 text-white" />
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
                    <span className="ml-2">avg duration</span>
                  </div>
                  <div className="mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 neon-cyan"></div>
                      <span className="text-green-400 font-bold">{formatNumber(metrics?.data?.sessions?.total || 0)} total today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* VISUAL ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Organization Distribution Chart - Futuristic Design */}
              <Card className="glass border-gray-700 card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <span className="gradient-text uppercase tracking-wider">Organization Distribution</span>
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
                    <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="gradient-text uppercase tracking-wider">System Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Uptime Display */}
                  <div className="glass p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 font-bold uppercase tracking-wider">System Uptime</span>
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
                      <span className="text-gray-300 font-bold uppercase tracking-wider">Avg Response Time</span>
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
                      <span className="text-gray-300 font-bold uppercase tracking-wider">Error Rate</span>
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
          </TabsContent>

          {/* ORGANIZATIONS TAB */}
          <TabsContent value="organizations" className="space-y-8 fade-in">
            <Card className="glass border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold gradient-text">Organization Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive organization analytics and management interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Organization Dashboard</h3>
                  <p className="text-gray-400">Advanced organization management coming in Task 3.2</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEM HEALTH TAB */}
          <TabsContent value="system" className="space-y-8 fade-in">
            <Card className="glass border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold gradient-text">System Health Monitor</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time system monitoring and health checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Server className="w-16 h-16 text-green-400 mx-auto mb-4 ai-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">System Monitoring</h3>
                  <p className="text-gray-400">Enhanced system health dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-8 fade-in">
            <Card className="glass border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold gradient-text">AI Analytics Center</CardTitle>
                <CardDescription className="text-gray-400">
                  Advanced AI usage analytics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-yellow-400 mx-auto mb-4 ai-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">AI Performance Analytics</h3>
                  <p className="text-gray-400">Comprehensive AI analytics dashboard coming in Task 4.4</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}