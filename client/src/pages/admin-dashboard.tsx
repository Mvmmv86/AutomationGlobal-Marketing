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
  LineChart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
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
    lastWeek: number;
    growthRate: number;
  };
  sessions: {
    active: number;
    total: number;
    avgDuration: number;
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    avgResponseTime: number;
    costToday: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

interface SystemStatus {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: string;
    responseTime: number;
    connections: number;
  };
  redis: {
    status: string;
    responseTime: number;
    memoryUsage: number;
  };
  api: {
    requestsPerMinute: number;
    avgResponseTime: number;
    errorRate: number;
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

export default function AdminDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch global metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<MetricsResponse>({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: false
  });

  // Fetch time series data
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['/api/admin/timeseries'],
    refetchInterval: autoRefresh ? refreshInterval * 2 : false,
    retry: false
  });

  // Fetch organizations analytics
  const { data: organizationsData, isLoading: organizationsLoading } = useQuery({
    queryKey: ['/api/admin/organizations'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: false
  });

  // Fetch system status
  const { data: systemStatus, isLoading: systemLoading } = useQuery({
    queryKey: ['/api/admin/system-status'],
    refetchInterval: autoRefresh ? 5000 : false,
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

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'healthy': 
        return 'text-green-400';
      case 'degraded':
      case 'warning': 
        return 'text-yellow-400';
      case 'error':
      case 'unhealthy': 
        return 'text-red-400';
      default: 
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'healthy': 
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'degraded':
      case 'warning': 
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
      case 'unhealthy': 
        return <XCircle className="w-4 h-4 text-red-400" />;
      default: 
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  // Chart colors
  const chartColors = {
    primary: '#00f5ff',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const pieChartData: PieChartEntry[] = metrics?.success ? [
    { name: 'Active Orgs', value: metrics.data.organizations.active, color: chartColors.success },
    { name: 'Inactive Orgs', value: metrics.data.organizations.inactive, color: chartColors.error }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 matrix-grid">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold gradient-text ai-pulse">
              AUTOMATION GLOBAL v4.0
            </h1>
            <h2 className="text-2xl font-semibold text-cyan-400 mt-2">Admin Global Dashboard</h2>
            <p className="text-gray-400 mt-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              Task 3.1 - AI-Powered System Analytics & Real-time Monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass p-3 rounded-lg flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 neon-cyan animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300 font-medium">
                {autoRefresh ? 'LIVE MONITORING' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-6 py-3 glass rounded-lg text-sm transition-all btn-glow font-medium ${
                autoRefresh ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
              }`}
              data-testid="button-toggle-refresh"
            >
              {autoRefresh ? 'PAUSE' : 'RESUME'}
            </button>
            <button
              onClick={() => {
                refetchMetrics();
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm transition-all btn-glow flex items-center gap-2 font-medium neon-blue"
              data-testid="button-manual-refresh"
            >
              <RefreshCw className="w-4 h-4" />
              REFRESH NOW
            </button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="glass border-gray-700 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white px-6 py-3 rounded-lg transition-all">
              <BarChart3 className="w-5 h-5" />
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white px-6 py-3 rounded-lg transition-all">
              <Building2 className="w-5 h-5" />
              ORGANIZATIONS
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white px-6 py-3 rounded-lg transition-all">
              <Server className="w-5 h-5" />
              SYSTEM HEALTH
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white px-6 py-3 rounded-lg transition-all">
              <LineChart className="w-5 h-5" />
              AI ANALYTICS
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 fade-in">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Organizations Metric */}
              <Card className="glass border-gray-700 card-hover neon-blue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 uppercase tracking-wider">Organizations</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {metricsLoading ? (
                      <div className="animate-pulse text-gray-400">...</div>
                    ) : (
                      <span className="gradient-text">{formatNumber(metrics?.data?.organizations?.total || 0)}</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400 font-medium">{metrics?.data?.organizations?.growthRate || 0}%</span>
                    <span className="ml-1">from last month</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400 font-medium">{metrics?.data?.organizations?.active || 0} active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-red-400 font-medium">{metrics?.data?.organizations?.inactive || 0} inactive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Metric */}
              <Card className="glass border-gray-700 card-hover neon-cyan">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 uppercase tracking-wider">Total Users</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {metricsLoading ? (
                      <div className="animate-pulse text-gray-400">...</div>
                    ) : (
                      <span className="gradient-text">{formatNumber(metrics?.data?.users?.total || 0)}</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400 font-medium">{metrics?.data?.users?.growthRate || 0}%</span>
                    <span className="ml-1">growth rate</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400 font-medium">{metrics?.data?.users?.active || 0} active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span className="text-cyan-400 font-medium">{metrics?.data?.users?.lastWeek || 0} new week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Usage Metric */}
              <Card className="glass border-gray-700 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-medium text-gray-300 uppercase tracking-wider">AI Requests</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
                    <Brain className="h-5 w-5 text-white ai-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-2">
                    {metricsLoading ? (
                      <div className="animate-pulse text-gray-400">...</div>
                    ) : (
                      <span className="text-yellow-400">{formatNumber(metrics?.data?.aiUsage?.totalRequests || 0)}</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <Activity className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 font-medium">{metrics?.data?.aiUsage?.avgResponseTime || 0}ms</span>
                    <span className="ml-1">avg response</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span className="text-yellow-400 font-medium">{formatNumber(metrics?.data?.aiUsage?.totalTokens || 0)} tokens</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400 font-medium">{formatCurrency(metrics?.data?.aiUsage?.costToday || 0)} today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions Metric */}
              <Card className="glass border-gray-700 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 uppercase tracking-wider">Active Sessions</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {metricsLoading ? (
                      <div className="animate-pulse text-gray-400">...</div>
                    ) : (
                      <span className="text-green-400">{formatNumber(metrics?.data?.sessions?.active || 0)}</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <Wifi className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-green-400 font-medium">{metrics?.data?.sessions?.avgDuration || 0}min</span>
                    <span className="ml-1">avg duration</span>
                  </div>
                  <div className="mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400 font-medium">{formatNumber(metrics?.data?.sessions?.total || 0)} total sessions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Series Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Growth Trends</CardTitle>
                  <CardDescription className="text-slate-300">
                    Organizations and users over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeSeriesLoading ? (
                    <div className="h-80 flex items-center justify-center text-slate-400">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timeSeriesData?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="organizations"
                          stackId="1"
                          stroke={chartColors.primary}
                          fill={chartColors.primary}
                          fillOpacity={0.6}
                          name="Organizations"
                        />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stackId="1"
                          stroke={chartColors.secondary}
                          fill={chartColors.secondary}
                          fillOpacity={0.6}
                          name="Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Organization Status Pie Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Organization Status</CardTitle>
                  <CardDescription className="text-slate-300">
                    Active vs inactive organizations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="h-80 flex items-center justify-center text-slate-400">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Legend />
                        <Pie
                          dataKey="value"
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Organizations Overview</CardTitle>
                <CardDescription className="text-slate-300">
                  Detailed analytics for all organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organizationsLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading organizations...</div>
                ) : organizationsData?.success ? (
                  <div className="space-y-4">
                    {organizationsData.data.map((org: any) => (
                      <div key={org.id} className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-medium">{org.name}</h3>
                            <Badge 
                              className={
                                org.status === 'active' ? 'bg-green-600' :
                                org.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'
                              }
                            >
                              {org.status}
                            </Badge>
                            <Badge variant="outline" className="border-slate-500">
                              {org.planType}
                            </Badge>
                          </div>
                          <div className="text-slate-300 text-sm">
                            {org.userCount} users
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">AI Requests:</span>
                            <div className="text-white font-medium">{formatNumber(org.aiUsage.requests)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">AI Tokens:</span>
                            <div className="text-white font-medium">{formatNumber(org.aiUsage.tokens)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">AI Cost:</span>
                            <div className="text-white font-medium">{formatCurrency(org.aiUsage.cost)}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Active Modules:</span>
                            <div className="text-white font-medium">{org.modules.active}/{org.modules.total}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {org.modules.list.map((module: string) => (
                            <Badge key={module} variant="secondary" className="text-xs">
                              {module}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">Failed to load organizations</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CPU Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemLoading ? '...' : `${systemStatus?.data?.cpu?.usage?.toFixed(1) || 0}%`}
                  </div>
                  <Progress 
                    value={systemStatus?.data?.cpu?.usage || 0} 
                    className="mt-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    {systemStatus?.data?.cpu?.cores || 0} cores available
                  </div>
                </CardContent>
              </Card>

              {/* Memory Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Memory</CardTitle>
                  <HardDrive className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemLoading ? '...' : `${systemStatus?.data?.memory?.percentage?.toFixed(1) || 0}%`}
                  </div>
                  <Progress 
                    value={systemStatus?.data?.memory?.percentage || 0} 
                    className="mt-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    {formatNumber(systemStatus?.data?.memory?.used || 0)} / {formatNumber(systemStatus?.data?.memory?.total || 0)} bytes
                  </div>
                </CardContent>
              </Card>

              {/* Database Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Database</CardTitle>
                  <Database className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(systemStatus?.data?.database?.status || 'unknown')}
                    <span className={`text-sm font-medium ${getStatusColor(systemStatus?.data?.database?.status || 'unknown')}`}>
                      {systemStatus?.data?.database?.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Response: {systemStatus?.data?.database?.responseTime?.toFixed(1) || 0}ms
                  </div>
                  <div className="text-xs text-slate-400">
                    Connections: {systemStatus?.data?.database?.connections || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Redis Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Redis Cache</CardTitle>
                  <Server className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(systemStatus?.data?.redis?.status || 'unknown')}
                    <span className={`text-sm font-medium ${getStatusColor(systemStatus?.data?.redis?.status || 'unknown')}`}>
                      {systemStatus?.data?.redis?.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Response: {systemStatus?.data?.redis?.responseTime?.toFixed(1) || 0}ms
                  </div>
                  <div className="text-xs text-slate-400">
                    Memory: {formatNumber(systemStatus?.data?.redis?.memoryUsage || 0)} bytes
                  </div>
                </CardContent>
              </Card>

              {/* API Performance */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">API Performance</CardTitle>
                  <Activity className="h-4 w-4 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemLoading ? '...' : `${systemStatus?.data?.api?.requestsPerMinute || 0}`}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">req/min</div>
                  <div className="text-xs text-slate-400">
                    Avg response: {systemStatus?.data?.api?.avgResponseTime?.toFixed(1) || 0}ms
                  </div>
                  <div className="text-xs text-slate-400">
                    Error rate: {systemStatus?.data?.api?.errorRate?.toFixed(2) || 0}%
                  </div>
                </CardContent>
              </Card>

              {/* System Uptime */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">System Uptime</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {metricsLoading ? '...' : formatUptime(metrics?.data?.systemHealth?.uptime || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Since last restart
                  </div>
                  <div className="text-xs text-green-400">
                    System running smoothly
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">AI Usage Analytics</CardTitle>
                <CardDescription className="text-slate-300">
                  Comprehensive AI request and token usage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeriesLoading ? (
                  <div className="h-80 flex items-center justify-center text-slate-400">
                    Loading analytics data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsLineChart data={timeSeriesData?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="aiRequests"
                        stroke={chartColors.accent}
                        strokeWidth={2}
                        name="AI Requests"
                        dot={{ fill: chartColors.accent, strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke={chartColors.success}
                        strokeWidth={2}
                        name="Revenue ($)"
                        dot={{ fill: chartColors.success, strokeWidth: 2 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}