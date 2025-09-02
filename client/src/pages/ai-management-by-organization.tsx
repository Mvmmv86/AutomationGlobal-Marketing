import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Settings, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  Cpu, 
  Eye, 
  Edit3, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Globe,
  Target,
  Gauge,
  PieChart,
  LineChart,
  BarChart2,
  TrendingDown,
  Server,
  CloudCog,
  Key,
  Layers,
  ArrowUpDown,
  Timer,
  BellRing,
  Calculator,
  Sparkles,
  Star,
  Info,
  Play,
  Pause,
  Building2,
  Megaphone,
  Headphones,
  Building,
  Filter,
  Search,
  Home
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Interfaces para gestão de IA por organização
interface OrganizationAI {
  organizationId: string;
  organizationName: string;
  organizationType: 'marketing' | 'support' | 'trading';
  plan: 'starter' | 'professional' | 'enterprise';
  aiConfig: {
    openai?: {
      hasApiKey: boolean;
      models: string[];
      monthlyLimit: number;
      dailyLimit: number;
      usedThisMonth: number;
      usedToday: number;
      isActive: boolean;
      isPausedByAdmin: boolean;
    };
    anthropic?: {
      hasApiKey: boolean;
      models: string[];
      monthlyLimit: number;
      dailyLimit: number;
      usedThisMonth: number;
      usedToday: number;
      isActive: boolean;
      isPausedByAdmin: boolean;
    };
  };
  usage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    lastRequest: string;
    avgResponseTime: number;
    successRate: number;
  };
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
}

// Mock data para desenvolvimento - cada organização gerencia sua própria IA
const mockOrganizationsAI: OrganizationAI[] = [
  {
    organizationId: 'org-1',
    organizationName: 'TechCorp Solutions',
    organizationType: 'marketing',
    plan: 'enterprise',
    aiConfig: {
      openai: {
        hasApiKey: true,
        models: ['gpt-4', 'gpt-3.5-turbo'],
        monthlyLimit: 50000,
        dailyLimit: 2000,
        usedThisMonth: 12400,
        usedToday: 340,
        isActive: true,
        isPausedByAdmin: false
      },
      anthropic: {
        hasApiKey: true,
        models: ['claude-3-sonnet'],
        monthlyLimit: 25000,
        dailyLimit: 1000,
        usedThisMonth: 8900,
        usedToday: 150,
        isActive: true,
        isPausedByAdmin: false
      }
    },
    usage: {
      totalRequests: 21300,
      totalTokens: 1245000,
      totalCost: 567.89,
      lastRequest: '2025-01-29T09:15:00Z',
      avgResponseTime: 1200,
      successRate: 99.2
    },
    alerts: [
      {
        type: 'info',
        message: 'Uso normal dentro dos limites',
        timestamp: '2025-01-29T09:00:00Z'
      }
    ]
  },
  {
    organizationId: 'org-2',
    organizationName: 'StartupX Innovation',
    organizationType: 'support',
    plan: 'professional',
    aiConfig: {
      openai: {
        hasApiKey: false,
        models: [],
        monthlyLimit: 10000,
        dailyLimit: 500,
        usedThisMonth: 0,
        usedToday: 0,
        isActive: false,
        isPausedByAdmin: false
      },
      anthropic: {
        hasApiKey: true,
        models: ['claude-3-sonnet'],
        monthlyLimit: 15000,
        dailyLimit: 600,
        usedThisMonth: 13400,
        usedToday: 520,
        isActive: true,
        isPausedByAdmin: false
      }
    },
    usage: {
      totalRequests: 13400,
      totalTokens: 890000,
      totalCost: 234.56,
      lastRequest: '2025-01-29T09:10:00Z',
      avgResponseTime: 1500,
      successRate: 98.7
    },
    alerts: [
      {
        type: 'warning',
        message: 'Aproximando do limite mensal (89.3%)',
        timestamp: '2025-01-29T08:30:00Z'
      },
      {
        type: 'critical',
        message: 'Excedeu limite diário (104%)',
        timestamp: '2025-01-29T09:05:00Z'
      }
    ]
  },
  {
    organizationId: 'org-3',
    organizationName: 'Enterprise Analytics',
    organizationType: 'trading',
    plan: 'enterprise',
    aiConfig: {
      openai: {
        hasApiKey: true,
        models: ['gpt-4', 'gpt-4-turbo'],
        monthlyLimit: 100000,
        dailyLimit: 4000,
        usedThisMonth: 67800,
        usedToday: 1890,
        isActive: true,
        isPausedByAdmin: true // Admin pausou
      },
      anthropic: {
        hasApiKey: false,
        models: [],
        monthlyLimit: 50000,
        dailyLimit: 2000,
        usedThisMonth: 0,
        usedToday: 0,
        isActive: false,
        isPausedByAdmin: false
      }
    },
    usage: {
      totalRequests: 67800,
      totalTokens: 3450000,
      totalCost: 1234.78,
      lastRequest: '2025-01-29T07:45:00Z',
      avgResponseTime: 980,
      successRate: 99.8
    },
    alerts: [
      {
        type: 'critical',
        message: 'IA pausada pelo administrador',
        timestamp: '2025-01-29T07:00:00Z'
      }
    ]
  }
];

// Função para formatar números
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Função para formatar moeda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Função para obter ícone do tipo de organização
const getOrgTypeIcon = (type: string) => {
  switch (type) {
    case 'marketing': return Megaphone;
    case 'support': return Headphones;
    case 'trading': return TrendingUp;
    default: return Building;
  }
};

export default function AIManagementByOrganization() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationAI | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);
  const [editingLimits, setEditingLimits] = useState<{
    provider: 'openai' | 'anthropic';
    monthlyLimit: number;
    dailyLimit: number;
  } | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulação de dados (em produção, viria da API)
  const organizationsAI = mockOrganizationsAI;

  // Filtros
  const filteredOrgs = organizationsAI.filter(org => {
    const matchesType = filterType === 'all' || org.organizationType === filterType;
    const matchesPlan = filterPlan === 'all' || org.plan === filterPlan;
    const matchesSearch = org.organizationName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesPlan && matchesSearch;
  });

  // Estatísticas globais
  const totalOrgs = organizationsAI.length;
  const totalRequests = organizationsAI.reduce((acc, org) => acc + org.usage.totalRequests, 0);
  const totalCosts = organizationsAI.reduce((acc, org) => acc + org.usage.totalCost, 0);
  const orgsWithAlerts = organizationsAI.filter(org => 
    org.alerts.some(alert => alert.type === 'warning' || alert.type === 'critical')
  ).length;

  // Função para pausar/ativar IA de uma organização
  const toggleOrgAI = useMutation({
    mutationFn: async ({ orgId, provider, action }: { orgId: string, provider: string, action: 'pause' | 'activate' }) => {
      // Simulação da API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'pause' ? 'IA Pausada' : 'IA Ativada',
        description: `${variables.provider} ${variables.action === 'pause' ? 'pausado' : 'ativado'} com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/ai'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da IA',
        variant: 'destructive',
      });
    }
  });

  // Função para atualizar limites de IA
  const updateLimits = useMutation({
    mutationFn: async ({ orgId, provider, monthlyLimit, dailyLimit }: { 
      orgId: string, 
      provider: string, 
      monthlyLimit: number, 
      dailyLimit: number 
    }) => {
      // Simulação da API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Limites Atualizados',
        description: `Limites do ${variables.provider} atualizados com sucesso`,
      });
      setShowLimitsDialog(false);
      setEditingLimits(null);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/ai'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os limites',
        variant: 'destructive',
      });
    }
  });

  // Função para abrir modal de edição de limites
  const openLimitsDialog = (org: OrganizationAI, provider: 'openai' | 'anthropic') => {
    const config = org.aiConfig[provider];
    if (config) {
      setSelectedOrganization(org);
      setEditingLimits({
        provider,
        monthlyLimit: config.monthlyLimit,
        dailyLimit: config.dailyLimit
      });
      setShowLimitsDialog(true);
    }
  };

  // Função para salvar limites
  const handleSaveLimits = () => {
    if (selectedOrganization && editingLimits) {
      updateLimits.mutate({
        orgId: selectedOrganization.organizationId,
        provider: editingLimits.provider,
        monthlyLimit: editingLimits.monthlyLimit,
        dailyLimit: editingLimits.dailyLimit
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Matrix Grid Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
        <div className="matrix-grid absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header com botão de voltar */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => setLocation('/admin-dashboard-final')}
            className="bg-gradient-to-r from-gray-700/20 to-gray-600/20 border border-gray-500/30 text-gray-300 hover:from-gray-600/40 hover:to-gray-500/40 hover:border-gray-400/50 hover:text-gray-200 transition-all duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              🧠 Gestão de IA por Organização
            </h1>
            <p className="text-gray-400 text-lg">
              Monitoramento e controle de IA para todas as organizações
            </p>
          </div>
          
          <div className="w-32"></div> {/* Spacer para centralizar o título */}
        </div>

        {/* Cards de Estatísticas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Organizações</p>
                  <p className="text-2xl font-bold text-cyan-400">{totalOrgs}</p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-full">
                  <Building2 className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Requisições</p>
                  <p className="text-2xl font-bold text-green-400">{formatNumber(totalRequests)}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Custos Totais</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalCosts)}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-red-400">{orgsWithAlerts}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="glass-card neon-panel">
          <CardHeader>
            <CardTitle className="text-lg text-white">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">Buscar</Label>
                <Input 
                  placeholder="Nome da organização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Plano</Label>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterPlan('all');
                  }}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Organizações */}
        <div className="space-y-4">
          {filteredOrgs.map((org) => {
            const IconComponent = getOrgTypeIcon(org.organizationType);
            const hasOpenAI = org.aiConfig.openai?.hasApiKey;
            const hasAnthropic = org.aiConfig.anthropic?.hasApiKey;
            const criticalAlerts = org.alerts.filter(alert => alert.type === 'critical').length;
            const warningAlerts = org.alerts.filter(alert => alert.type === 'warning').length;

            return (
              <Card key={org.organizationId} className="glass-card neon-panel">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-500/20 rounded-full">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{org.organizationName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="bg-purple-500/20 text-purple-300 capitalize"
                          >
                            {org.organizationType}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-500/20 text-blue-300 capitalize"
                          >
                            {org.plan}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {criticalAlerts > 0 && (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                          {criticalAlerts} crítico{criticalAlerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {warningAlerts > 0 && (
                        <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-400">
                          {warningAlerts} aviso{warningAlerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuração de IA */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">Configuração de IA</h4>
                      
                      {/* OpenAI */}
                      <div className="p-3 bg-gray-800/50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              hasOpenAI && org.aiConfig.openai?.isActive && !org.aiConfig.openai?.isPausedByAdmin
                                ? 'bg-green-400' 
                                : org.aiConfig.openai?.isPausedByAdmin
                                ? 'bg-red-400'
                                : 'bg-gray-400'
                            }`} />
                            <span className="text-white font-medium">OpenAI</span>
                          </div>
                          <div className="flex gap-1">
                            {hasOpenAI && org.aiConfig.openai?.isPausedByAdmin && (
                              <Button 
                                size="sm" 
                                onClick={() => toggleOrgAI.mutate({ 
                                  orgId: org.organizationId, 
                                  provider: 'OpenAI', 
                                  action: 'activate' 
                                })}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {hasOpenAI && org.aiConfig.openai?.isActive && !org.aiConfig.openai?.isPausedByAdmin && (
                              <Button 
                                size="sm" 
                                onClick={() => toggleOrgAI.mutate({ 
                                  orgId: org.organizationId, 
                                  provider: 'OpenAI', 
                                  action: 'pause' 
                                })}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 h-6"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {hasOpenAI ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Modelos</span>
                              <span className="text-gray-300">{org.aiConfig.openai?.models.join(', ')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Uso mensal</span>
                              <span className="text-gray-300">
                                {formatNumber(org.aiConfig.openai?.usedThisMonth || 0)} / {formatNumber(org.aiConfig.openai?.monthlyLimit || 0)}
                              </span>
                            </div>
                            <Progress 
                              value={((org.aiConfig.openai?.usedThisMonth || 0) / (org.aiConfig.openai?.monthlyLimit || 1)) * 100} 
                              className="h-1" 
                            />
                            <Button 
                              size="sm" 
                              onClick={() => openLimitsDialog(org, 'openai')}
                              className="mt-2 h-8 px-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-600/40 hover:to-blue-600/40 hover:border-cyan-400/50 hover:text-cyan-200 transition-all duration-200 text-xs font-medium"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Ajustar Limites
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">API Key não configurada</p>
                        )}
                      </div>

                      {/* Anthropic */}
                      <div className="p-3 bg-gray-800/50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              hasAnthropic && org.aiConfig.anthropic?.isActive && !org.aiConfig.anthropic?.isPausedByAdmin
                                ? 'bg-green-400' 
                                : org.aiConfig.anthropic?.isPausedByAdmin
                                ? 'bg-red-400'
                                : 'bg-gray-400'
                            }`} />
                            <span className="text-white font-medium">Anthropic</span>
                          </div>
                          <div className="flex gap-1">
                            {hasAnthropic && org.aiConfig.anthropic?.isPausedByAdmin && (
                              <Button 
                                size="sm" 
                                onClick={() => toggleOrgAI.mutate({ 
                                  orgId: org.organizationId, 
                                  provider: 'Anthropic', 
                                  action: 'activate' 
                                })}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {hasAnthropic && org.aiConfig.anthropic?.isActive && !org.aiConfig.anthropic?.isPausedByAdmin && (
                              <Button 
                                size="sm" 
                                onClick={() => toggleOrgAI.mutate({ 
                                  orgId: org.organizationId, 
                                  provider: 'Anthropic', 
                                  action: 'pause' 
                                })}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 h-6"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {hasAnthropic ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Modelos</span>
                              <span className="text-gray-300">{org.aiConfig.anthropic?.models.join(', ')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Uso mensal</span>
                              <span className="text-gray-300">
                                {formatNumber(org.aiConfig.anthropic?.usedThisMonth || 0)} / {formatNumber(org.aiConfig.anthropic?.monthlyLimit || 0)}
                              </span>
                            </div>
                            <Progress 
                              value={((org.aiConfig.anthropic?.usedThisMonth || 0) / (org.aiConfig.anthropic?.monthlyLimit || 1)) * 100} 
                              className="h-1" 
                            />
                            <Button 
                              size="sm" 
                              onClick={() => openLimitsDialog(org, 'anthropic')}
                              className="mt-2 h-8 px-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:from-purple-600/40 hover:to-pink-600/40 hover:border-purple-400/50 hover:text-purple-200 transition-all duration-200 text-xs font-medium"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Ajustar Limites
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">API Key não configurada</p>
                        )}
                      </div>
                    </div>

                    {/* Estatísticas de Uso */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">Estatísticas</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Requisições</p>
                          <p className="text-white font-semibold">{formatNumber(org.usage.totalRequests)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tokens</p>
                          <p className="text-white font-semibold">{formatNumber(org.usage.totalTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Custo Total</p>
                          <p className="text-green-400 font-semibold">{formatCurrency(org.usage.totalCost)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Taxa Sucesso</p>
                          <p className="text-blue-400 font-semibold">{org.usage.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Resp. Médio</p>
                          <p className="text-yellow-400 font-semibold">{org.usage.avgResponseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Última Req.</p>
                          <p className="text-purple-400 font-semibold">
                            {new Date(org.usage.lastRequest).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Alertas Recentes */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">Alertas Recentes</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {org.alerts.length > 0 ? (
                          org.alerts.map((alert, index) => (
                            <div 
                              key={index} 
                              className={`flex items-center gap-2 p-2 rounded text-xs ${
                                alert.type === 'critical' ? 'bg-red-500/20 text-red-300' :
                                alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {alert.type === 'critical' ? <AlertTriangle className="w-3 h-3" /> :
                               alert.type === 'warning' ? <AlertCircle className="w-3 h-3" /> :
                               <Info className="w-3 h-3" />}
                              <span className="flex-1">{alert.message}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-xs">Nenhum alerta</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedOrganization(org);
                        setShowConfigDialog(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                    <Button size="sm" variant="ghost">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrgs.length === 0 && (
          <Card className="glass-card neon-panel">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Nenhuma organização encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou termo de busca.</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Ajuste de Limites */}
        <Dialog open={showLimitsDialog} onOpenChange={setShowLimitsDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold gradient-text">
                🎛️ Ajustar Limites de IA
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrganization && editingLimits && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedOrganization.organizationName}
                  </h3>
                  <p className="text-gray-400">
                    Configurando limites para{' '}
                    <span className="text-cyan-400 font-semibold">
                      {editingLimits.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Limite Mensal */}
                  <div>
                    <Label className="text-gray-300 font-medium">
                      Limite Mensal (requisições)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingLimits.monthlyLimit}
                      onChange={(e) => setEditingLimits({
                        ...editingLimits,
                        monthlyLimit: parseInt(e.target.value) || 0
                      })}
                      className="bg-gray-800 border-gray-600 text-white mt-1"
                      placeholder="Ex: 10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número máximo de requisições por mês
                    </p>
                  </div>

                  {/* Limite Diário */}
                  <div>
                    <Label className="text-gray-300 font-medium">
                      Limite Diário (requisições)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingLimits.dailyLimit}
                      onChange={(e) => setEditingLimits({
                        ...editingLimits,
                        dailyLimit: parseInt(e.target.value) || 0
                      })}
                      className="bg-gray-800 border-gray-600 text-white mt-1"
                      placeholder="Ex: 500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número máximo de requisições por dia
                    </p>
                  </div>

                  {/* Uso Atual */}
                  <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Uso Atual
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Este mês</p>
                        <p className="text-white font-semibold">
                          {formatNumber(
                            editingLimits.provider === 'openai' 
                              ? selectedOrganization.aiConfig.openai?.usedThisMonth || 0
                              : selectedOrganization.aiConfig.anthropic?.usedThisMonth || 0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Hoje</p>
                        <p className="text-white font-semibold">
                          {formatNumber(
                            editingLimits.provider === 'openai' 
                              ? selectedOrganization.aiConfig.openai?.usedToday || 0
                              : selectedOrganization.aiConfig.anthropic?.usedToday || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alertas de Validação */}
                  {editingLimits.dailyLimit > editingLimits.monthlyLimit && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Limite diário não pode ser maior que o mensal</span>
                    </div>
                  )}

                  {editingLimits.monthlyLimit < (
                    editingLimits.provider === 'openai' 
                      ? selectedOrganization.aiConfig.openai?.usedThisMonth || 0
                      : selectedOrganization.aiConfig.anthropic?.usedThisMonth || 0
                  ) && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/20 text-red-300 rounded text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>Limite mensal menor que uso atual</span>
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowLimitsDialog(false);
                      setEditingLimits(null);
                    }}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveLimits}
                    disabled={
                      updateLimits.isPending || 
                      editingLimits.dailyLimit > editingLimits.monthlyLimit
                    }
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                  >
                    {updateLimits.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Limites
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}