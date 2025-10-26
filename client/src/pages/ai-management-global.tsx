import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interfaces para os dados de IA
interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'custom';
  status: 'active' | 'inactive' | 'error';
  apiKey: string;
  models: AIModel[];
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    dailyLimit: number;
  };
  costs: {
    inputTokenCost: number; // por 1k tokens
    outputTokenCost: number; // por 1k tokens
    requestCost: number;
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
  };
  lastPing: string;
  config: Record<string, any>;
}

interface AIModel {
  id: string;
  name: string;
  providerId: string;
  type: 'text' | 'chat' | 'image' | 'audio';
  maxTokens: number;
  costPer1kTokens: number;
  isActive: boolean;
  popularity: number;
  performance: {
    avgResponseTime: number;
    successRate: number;
  };
}

interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgResponseTime: number;
  requestsByProvider: Record<string, number>;
  costsByProvider: Record<string, number>;
  requestsByModel: Record<string, number>;
  requestsByOrganization: Record<string, number>;
  timeSeriesData: Array<{
    timestamp: string;
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  }>;
}

interface OrganizationQuota {
  organizationId: string;
  organizationName: string;
  plan: string;
  monthlyLimit: number;
  usedThisMonth: number;
  dailyLimit: number;
  usedToday: number;
  overage: number;
  overageAllowed: boolean;
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
}

interface LoadBalancingConfig {
  strategy: 'round-robin' | 'weighted' | 'cost-optimized' | 'performance-based';
  weights: Record<string, number>;
  fallbackOrder: string[];
  healthCheckInterval: number;
  failoverThreshold: number;
  autoScaling: {
    enabled: boolean;
    minProviders: number;
    maxProviders: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
  };
}

// Mock data para desenvolvimento (sem credenciais reais)
const mockProviders: AIProvider[] = [
  {
    id: 'openai-1',
    name: 'OpenAI Primary',
    type: 'openai',
    status: 'active',
    apiKey: '••••••••••••••••••••••••••••••••',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        providerId: 'openai-1',
        type: 'chat',
        maxTokens: 8192,
        costPer1kTokens: 0.03,
        isActive: true,
        popularity: 85,
        performance: { avgResponseTime: 1200, successRate: 99.2 }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        providerId: 'openai-1',
        type: 'chat',
        maxTokens: 4096,
        costPer1kTokens: 0.002,
        isActive: true,
        popularity: 92,
        performance: { avgResponseTime: 800, successRate: 99.5 }
      }
    ],
    rateLimit: {
      requestsPerMinute: 3500,
      tokensPerMinute: 90000,
      dailyLimit: 1000000
    },
    costs: {
      inputTokenCost: 0.03,
      outputTokenCost: 0.06,
      requestCost: 0.001
    },
    performance: {
      avgResponseTime: 1000,
      successRate: 99.3,
      errorRate: 0.7,
      uptime: 99.8
    },
    lastPing: '2025-01-28T22:45:00Z',
    config: {
      temperature: 0.7,
      maxRetries: 3,
      timeout: 30000
    }
  },
  {
    id: 'anthropic-1',
    name: 'Anthropic Claude',
    type: 'anthropic',
    status: 'active',
    apiKey: '••••••••••••••••••••••••••••••••',
    models: [
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        providerId: 'anthropic-1',
        type: 'chat',
        maxTokens: 200000,
        costPer1kTokens: 0.015,
        isActive: true,
        popularity: 78,
        performance: { avgResponseTime: 1500, successRate: 98.9 }
      }
    ],
    rateLimit: {
      requestsPerMinute: 1000,
      tokensPerMinute: 40000,
      dailyLimit: 500000
    },
    costs: {
      inputTokenCost: 0.015,
      outputTokenCost: 0.075,
      requestCost: 0.002
    },
    performance: {
      avgResponseTime: 1500,
      successRate: 98.9,
      errorRate: 1.1,
      uptime: 99.5
    },
    lastPing: '2025-01-28T22:44:30Z',
    config: {
      temperature: 0.6,
      maxRetries: 2,
      timeout: 45000
    }
  }
];

const mockUsageStats: AIUsageStats = {
  totalRequests: 125600,
  totalTokens: 8945000,
  totalCost: 2347.85,
  successRate: 99.1,
  avgResponseTime: 1200,
  requestsByProvider: {
    'openai-1': 89400,
    'anthropic-1': 36200
  },
  costsByProvider: {
    'openai-1': 1598.32,
    'anthropic-1': 749.53
  },
  requestsByModel: {
    'gpt-3.5-turbo': 56800,
    'gpt-4': 32600,
    'claude-3-sonnet': 36200
  },
  requestsByOrganization: {
    'org-1': 45600,
    'org-2': 32400,
    'org-3': 47600
  },
  timeSeriesData: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
    requests: Math.floor(Math.random() * 1000) + 500,
    tokens: Math.floor(Math.random() * 50000) + 25000,
    cost: Math.floor(Math.random() * 50) + 25,
    errors: Math.floor(Math.random() * 10)
  }))
};

const mockQuotas: OrganizationQuota[] = [
  {
    organizationId: 'org-1',
    organizationName: 'TechCorp Solutions',
    plan: 'Enterprise',
    monthlyLimit: 100000,
    usedThisMonth: 45600,
    dailyLimit: 5000,
    usedToday: 1240,
    overage: 0,
    overageAllowed: true,
    alerts: [
      {
        type: 'info',
        message: 'Uso normal dentro dos limites',
        timestamp: '2025-01-28T22:00:00Z'
      }
    ]
  },
  {
    organizationId: 'org-2',
    organizationName: 'StartupX Innovation',
    plan: 'Professional',
    monthlyLimit: 10000,
    usedThisMonth: 8970,
    dailyLimit: 500,
    usedToday: 450,
    overage: 0,
    overageAllowed: false,
    alerts: [
      {
        type: 'warning',
        message: 'Aproximando do limite mensal (89.7%)',
        timestamp: '2025-01-28T21:30:00Z'
      },
      {
        type: 'warning',
        message: 'Uso diário próximo do limite (90%)',
        timestamp: '2025-01-28T21:30:00Z'
      }
    ]
  },
  {
    organizationId: 'org-3',
    organizationName: 'Enterprise Analytics',
    plan: 'Enterprise',
    monthlyLimit: 150000,
    usedThisMonth: 47600,
    dailyLimit: 7500,
    usedToday: 890,
    overage: 2600,
    overageAllowed: true,
    alerts: [
      {
        type: 'critical',
        message: 'Overage detectado: +2,600 requisições',
        timestamp: '2025-01-28T20:15:00Z'
      }
    ]
  }
];

const mockLoadBalancing: LoadBalancingConfig = {
  strategy: 'cost-optimized',
  weights: {
    'openai-1': 70,
    'anthropic-1': 30
  },
  fallbackOrder: ['openai-1', 'anthropic-1'],
  healthCheckInterval: 30,
  failoverThreshold: 3,
  autoScaling: {
    enabled: true,
    minProviders: 2,
    maxProviders: 5,
    scaleUpThreshold: 80,
    scaleDownThreshold: 30
  }
};

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

export default function AIManagementGlobal() {
  const [activeTab, setActiveTab] = useState('providers');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const { toast } = useToast();

  // Simulação de dados (em produção, viria da API)
  const providers = mockProviders;
  const usageStats = mockUsageStats;
  const quotas = mockQuotas;
  const loadBalancing = mockLoadBalancing;

  // Cálculos derivados
  const totalProviders = providers.length;
  const activeProviders = providers.filter(p => p.status === 'active').length;
  const totalModels = providers.reduce((acc, p) => acc + p.models.length, 0);
  const avgResponseTime = providers.reduce((acc, p) => acc + p.performance.avgResponseTime, 0) / providers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Matrix Grid Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
        <div className="matrix-grid absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            🧠 Gestão de IA Global
          </h1>
          <p className="text-gray-400 text-lg">
            Controle completo sobre provedores, distribuição de carga e analytics de IA
          </p>
        </div>

        {/* Cards de Estatísticas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Provedores Ativos</p>
                  <p className="text-2xl font-bold text-cyan-400">{activeProviders}/{totalProviders}</p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-full">
                  <Server className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card neon-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Requisições</p>
                  <p className="text-2xl font-bold text-green-400">{formatNumber(usageStats.totalRequests)}</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(usageStats.totalCost)}</p>
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
                  <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-emerald-400">{usageStats.successRate}%</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass bg-gray-800/50 border border-cyan-500/30 p-1 rounded-lg">
            <TabsTrigger 
              value="providers" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400"
            >
              <Server className="w-4 h-4 mr-2" />
              Provedores
            </TabsTrigger>
            <TabsTrigger 
              value="load-balancing" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Load Balancing
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="quotas" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400"
            >
              <Gauge className="w-4 h-4 mr-2" />
              Cotas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuração de Provedores */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold gradient-text">🔧 Configuração de Provedores</h2>
              <Button 
                onClick={() => setShowProviderDialog(true)}
                className="btn-glow bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Provedor
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {providers.map((provider) => (
                <Card key={provider.id} className="glass-card neon-panel">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          provider.status === 'active' ? 'bg-green-400' : 
                          provider.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                        <div>
                          <CardTitle className="text-lg text-white">{provider.name}</CardTitle>
                          <p className="text-sm text-gray-400 capitalize">{provider.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setShowProviderDialog(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Tempo de Resposta</p>
                        <p className="text-white font-semibold">{provider.performance.avgResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Taxa de Sucesso</p>
                        <p className="text-green-400 font-semibold">{provider.performance.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Uptime</p>
                        <p className="text-blue-400 font-semibold">{provider.performance.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Modelos</p>
                        <p className="text-white font-semibold">{provider.models.length}</p>
                      </div>
                    </div>

                    {/* Rate Limits */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Rate Limits</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Req/min</span>
                          <span className="text-gray-300">{formatNumber(provider.rateLimit.requestsPerMinute)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Tokens/min</span>
                          <span className="text-gray-300">{formatNumber(provider.rateLimit.tokensPerMinute)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Costs */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Custos (por 1k tokens)</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Input</span>
                        <span className="text-green-300">${provider.costs.inputTokenCost}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Output</span>
                        <span className="text-yellow-300">${provider.costs.outputTokenCost}</span>
                      </div>
                    </div>

                    {/* Models List */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Modelos Ativos</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.models.filter(m => m.isActive).map((model) => (
                          <Badge 
                            key={model.id} 
                            variant="secondary" 
                            className="bg-cyan-500/20 text-cyan-300 text-xs"
                          >
                            {model.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Load Balancing */}
          <TabsContent value="load-balancing" className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">⚖️ Distribuição de Carga</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuração de Estratégia */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Estratégia de Load Balancing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Estratégia Atual</Label>
                    <Select value={loadBalancing.strategy}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round-robin">Round Robin</SelectItem>
                        <SelectItem value="weighted">Weighted</SelectItem>
                        <SelectItem value="cost-optimized">Cost Optimized</SelectItem>
                        <SelectItem value="performance-based">Performance Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Health Check Interval</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={loadBalancing.healthCheckInterval}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <span className="text-gray-400 text-sm">segundos</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Failover Threshold</Label>
                    <Input 
                      type="number" 
                      value={loadBalancing.failoverThreshold}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Auto Scaling</Label>
                    <Switch checked={loadBalancing.autoScaling.enabled} />
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição de Peso */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Distribuição de Peso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(loadBalancing.weights).map(([providerId, weight]) => {
                    const provider = providers.find(p => p.id === providerId);
                    return (
                      <div key={providerId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{provider?.name}</span>
                          <span className="text-cyan-400">{weight}%</span>
                        </div>
                        <Progress value={weight} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Ordem de Fallback */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Ordem de Fallback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadBalancing.fallbackOrder.map((providerId, index) => {
                    const provider = providers.find(p => p.id === providerId);
                    return (
                      <div key={providerId} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded">
                        <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{provider?.name}</p>
                          <p className="text-gray-400 text-sm">{provider?.type}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          provider?.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Auto Scaling Config */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Auto Scaling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Min Providers</Label>
                      <Input 
                        type="number"
                        value={loadBalancing.autoScaling.minProviders}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Max Providers</Label>
                      <Input 
                        type="number"
                        value={loadBalancing.autoScaling.maxProviders}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Scale Up (%)</Label>
                      <Input 
                        type="number"
                        value={loadBalancing.autoScaling.scaleUpThreshold}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Scale Down (%)</Label>
                      <Input 
                        type="number"
                        value={loadBalancing.autoScaling.scaleDownThreshold}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">📊 Analytics de IA</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Uso por Provedor */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Uso por Provedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usageStats.requestsByProvider).map(([providerId, requests]) => {
                      const provider = providers.find(p => p.id === providerId);
                      const percentage = (requests / usageStats.totalRequests) * 100;
                      return (
                        <div key={providerId} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{provider?.name}</span>
                            <span className="text-cyan-400">{formatNumber(requests)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Custos por Provedor */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Custos por Provedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usageStats.costsByProvider).map(([providerId, cost]) => {
                      const provider = providers.find(p => p.id === providerId);
                      const percentage = (cost / usageStats.totalCost) * 100;
                      return (
                        <div key={providerId} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{provider?.name}</span>
                            <span className="text-yellow-400">{formatCurrency(cost)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance por Modelo */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Performance por Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {providers.flatMap(p => p.models).map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                        <div>
                          <p className="text-white font-medium">{model.name}</p>
                          <p className="text-gray-400 text-sm">{formatNumber(usageStats.requestsByModel[model.id] || 0)} requisições</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-sm">{model.performance.successRate}%</p>
                          <p className="text-gray-400 text-xs">{model.performance.avgResponseTime}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Modelos Mais Populares */}
              <Card className="glass-card neon-panel">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Modelos Mais Populares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {providers.flatMap(p => p.models)
                      .sort((a, b) => (usageStats.requestsByModel[b.id] || 0) - (usageStats.requestsByModel[a.id] || 0))
                      .slice(0, 5)
                      .map((model, index) => (
                        <div key={model.id} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{model.name}</p>
                            <p className="text-gray-400 text-sm">{formatNumber(usageStats.requestsByModel[model.id] || 0)} requisições</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 text-sm">{model.popularity}%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Taxa de Erro */}
              <Card className="glass-card neon-panel lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Taxa de Erro por Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-gray-400 text-sm">Última Hora</p>
                        <p className="text-red-400 text-xl font-bold">0.8%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Últimas 24h</p>
                        <p className="text-yellow-400 text-xl font-bold">1.2%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Última Semana</p>
                        <p className="text-green-400 text-xl font-bold">0.9%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Último Mês</p>
                        <p className="text-blue-400 text-xl font-bold">1.1%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Gestão de Cotas */}
          <TabsContent value="quotas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold gradient-text">🚨 Gestão de Cotas</h2>
              <Button 
                onClick={() => setShowQuotaDialog(true)}
                className="btn-glow bg-purple-600 hover:bg-purple-700"
              >
                <BellRing className="w-4 h-4 mr-2" />
                Configurar Alertas
              </Button>
            </div>

            <div className="space-y-4">
              {quotas.map((quota) => (
                <Card key={quota.organizationId} className="glass-card neon-panel">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-white">{quota.organizationName}</CardTitle>
                        <p className="text-gray-400">Plano: {quota.plan}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {quota.overage > 0 && (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                            Overage: +{formatNumber(quota.overage)}
                          </Badge>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`${
                            quota.usedThisMonth / quota.monthlyLimit > 0.9 
                              ? 'bg-red-500/20 text-red-400'
                              : quota.usedThisMonth / quota.monthlyLimit > 0.7
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {((quota.usedThisMonth / quota.monthlyLimit) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Uso Mensal */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uso Mensal</span>
                        <span className="text-white">
                          {formatNumber(quota.usedThisMonth)} / {formatNumber(quota.monthlyLimit)}
                        </span>
                      </div>
                      <Progress 
                        value={(quota.usedThisMonth / quota.monthlyLimit) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Uso Diário */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uso Diário</span>
                        <span className="text-white">
                          {formatNumber(quota.usedToday)} / {formatNumber(quota.dailyLimit)}
                        </span>
                      </div>
                      <Progress 
                        value={(quota.usedToday / quota.dailyLimit) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Alertas */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Alertas Recentes</p>
                      {quota.alerts.map((alert, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            alert.type === 'critical' ? 'bg-red-500/20 text-red-300' :
                            alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {alert.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                           alert.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                           <Info className="w-4 h-4" />}
                          <span className="flex-1">{alert.message}</span>
                          <span className="text-xs opacity-75">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Configurações */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Overage permitido:</span>
                        <span className={quota.overageAllowed ? 'text-green-400' : 'text-red-400'}>
                          {quota.overageAllowed ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Calculator className="w-4 h-4 mr-1" />
                          Ajustar
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}