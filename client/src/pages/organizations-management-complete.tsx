import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  Mail,
  Phone,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Search,
  Filter,
  Eye,
  CreditCard,
  Pause,
  Play,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Brain,
  DollarSign,
  Target,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

// Tipos seguindo o schema do projeto
interface Organization {
  id: string;
  name: string;
  email: string;
  type: 'marketing' | 'support' | 'trading';
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'inactive';
  logoUrl?: string;
  userCount: number;
  aiUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  revenue: number;
  lastActivity: string;
  createdAt: string;
  settings: {
    maxUsers: number;
    maxAiRequests: number;
    features: string[];
  };
}

interface FilterState {
  search: string;
  type: string;
  plan: string;
  status: string;
  dateRange: string;
}

interface GlobalStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  totalAiRequests: number;
  totalAiCost: number;
  growthRate: number;
}

// Schemas de formulário
const createOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['starter', 'pro', 'enterprise'], {
    required_error: 'Selecione um plano'
  }),
  type: z.enum(['marketing', 'support', 'trading'], {
    required_error: 'Selecione um tipo'
  }),
  description: z.string().optional(),
});

const editOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['starter', 'pro', 'enterprise']),
  type: z.enum(['marketing', 'support', 'trading']),
  status: z.enum(['active', 'inactive', 'trial', 'suspended']),
  description: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;
type EditOrgForm = z.infer<typeof editOrgSchema>;

const ITEMS_PER_PAGE = 25;

// Mock data - será substituído pela API real
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    email: 'admin@techcorp.com',
    type: 'marketing',
    plan: 'enterprise',
    status: 'active',
    logoUrl: 'https://via.placeholder.com/40x40/00f5ff/ffffff?text=TC',
    userCount: 45,
    aiUsage: { requests: 12500, tokens: 450000, cost: 127.50 },
    revenue: 2400,
    lastActivity: '2025-01-28T10:30:00Z',
    createdAt: '2024-08-15T09:00:00Z',
    settings: { maxUsers: 50, maxAiRequests: 50000, features: ['advanced-ai', 'priority-support'] }
  },
  {
    id: '2',
    name: 'StartupX Innovation',
    email: 'team@startupx.io',
    type: 'support',
    plan: 'pro',
    status: 'trial',
    logoUrl: 'https://via.placeholder.com/40x40/8b5cf6/ffffff?text=SX',
    userCount: 12,
    aiUsage: { requests: 3200, tokens: 85000, cost: 34.80 },
    revenue: 890,
    lastActivity: '2025-01-28T08:15:00Z',
    createdAt: '2024-12-10T14:30:00Z',
    settings: { maxUsers: 25, maxAiRequests: 10000, features: ['standard-ai'] }
  },
  {
    id: '3',
    name: 'Enterprise Analytics Co',
    email: 'ops@enterprise-analytics.com',
    type: 'trading',
    plan: 'enterprise',
    status: 'active',
    logoUrl: 'https://via.placeholder.com/40x40/10b981/ffffff?text=EA',
    userCount: 78,
    aiUsage: { requests: 25600, tokens: 890000, cost: 245.30 },
    revenue: 4800,
    lastActivity: '2025-01-28T11:45:00Z',
    createdAt: '2024-06-20T11:00:00Z',
    settings: { maxUsers: 100, maxAiRequests: 100000, features: ['advanced-ai', 'priority-support'] }
  }
];

const mockGlobalStats: GlobalStats = {
  totalOrganizations: 22,
  activeOrganizations: 18,
  totalUsers: 340,
  totalRevenue: 28500,
  totalAiRequests: 89300,
  totalAiCost: 2180.75,
  growthRate: 15.3
};

export default function OrganizationsManagementComplete() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    plan: 'all',
    status: 'all',
    dateRange: 'all'
  });
  
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      email: '',
      description: '',
    },
  });

  const editForm = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
  });

  // Queries
  const { data: organizations = mockOrganizations, isLoading, refetch } = useQuery({
    queryKey: ['/api/organizations/complete'],
    queryFn: () => Promise.resolve(mockOrganizations),
    refetchInterval: 30000,
  });

  const { data: globalStats = mockGlobalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/organizations/stats'],
    queryFn: () => Promise.resolve(mockGlobalStats),
    refetchInterval: 30000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrgForm) => {
      // Simulação da API - substituir pela chamada real
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização criada com sucesso!" });
      setIsCreateDialogOpen(false);
      createForm.reset();
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao criar organização", variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditOrgForm) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização atualizada com sucesso!" });
      setIsEditDialogOpen(false);
      setSelectedOrg(null);
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar organização", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização removida com sucesso!" });
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao remover organização", variant: "destructive" });
    }
  });

  // Filtered and paginated data
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !filters.search || 
        org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = filters.type === 'all' || org.type === filters.type;
      const matchesPlan = filters.plan === 'all' || org.plan === filters.plan;
      const matchesStatus = filters.status === 'all' || org.status === filters.status;
      
      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const orgDate = new Date(org.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orgDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case '7d': matchesDate = daysDiff <= 7; break;
          case '30d': matchesDate = daysDiff <= 30; break;
          case '90d': matchesDate = daysDiff <= 90; break;
          case '1y': matchesDate = daysDiff <= 365; break;
        }
      }
      
      return matchesSearch && matchesType && matchesPlan && matchesStatus && matchesDate;
    });
  }, [organizations, filters]);

  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganizations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrganizations, currentPage]);

  const totalPages = Math.ceil(filteredOrganizations.length / ITEMS_PER_PAGE);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Organization['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400 border-green-400/50', icon: CheckCircle, label: 'Ativa' },
      trial: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50', icon: Clock, label: 'Trial' },
      suspended: { color: 'bg-red-500/20 text-red-400 border-red-400/50', icon: XCircle, label: 'Suspensa' },
      inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-400/50', icon: AlertCircle, label: 'Inativa' }
    };
    
    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} border px-2 py-1 flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: Organization['plan']) => {
    const planConfig = {
      starter: { color: 'from-blue-600 to-cyan-600', label: 'Starter' },
      pro: { color: 'from-purple-600 to-pink-600', label: 'Pro' },
      enterprise: { color: 'from-yellow-600 to-orange-600', label: 'Enterprise' }
    };
    
    const config = planConfig[plan];
    
    return (
      <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 px-2 py-1 font-bold`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: Organization['type']) => {
    const typeConfig = {
      marketing: { color: 'text-cyan-400', icon: Target, label: 'Marketing' },
      support: { color: 'text-green-400', icon: Shield, label: 'Support' },
      trading: { color: 'text-yellow-400', icon: BarChart3, label: 'Trading' }
    };
    
    const config = typeConfig[type];
    const IconComponent = config.icon;
    
    return (
      <div className={`flex items-center gap-1 ${config.color} text-sm font-semibold`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  // Selection handlers
  const handleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrgs.size === paginatedOrganizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(paginatedOrganizations.map(org => org.id)));
    }
  };

  // Action handlers
  const handleSingleAction = (org: Organization, action: string) => {
    switch (action) {
      case 'edit':
        setSelectedOrg(org);
        editForm.reset({
          name: org.name,
          email: org.email,
          plan: org.plan,
          type: org.type,
          status: org.status,
        });
        setIsEditDialogOpen(true);
        break;
      case 'delete':
        if (confirm(`Tem certeza que deseja excluir a organização "${org.name}"?`)) {
          deleteMutation.mutate(org.id);
        }
        break;
      default:
        toast({
          title: "Ação Executada",
          description: `${action} executada para ${org.name}`,
        });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.size === 0) {
      toast({
        title: "Seleção Necessária",
        description: "Selecione pelo menos uma organização",
        variant: "destructive",
      });
      return;
    }

    const selectedNames = Array.from(selectedOrgs).map(id => 
      organizations.find(org => org.id === id)?.name
    ).join(', ');

    toast({
      title: "Ação em Massa Executada",
      description: `${action} aplicada a ${selectedOrgs.size} organizações: ${selectedNames}`,
    });

    setSelectedOrgs(new Set());
  };

  const onCreateSubmit = (data: CreateOrgForm) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EditOrgForm) => {
    editMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black text-white matrix-grid">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl icon-container-futuristic">
              <Building2 className="w-8 h-8 icon-silver-neon" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text uppercase tracking-wider">
                Gestão de Organizações
              </h1>
              <p className="text-gray-400 mt-1">Painel administrativo completo da plataforma</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => refetch()} 
              className="neon-panel btn-glow"
              data-testid="refresh-organizations"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Organizations */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Organizações</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <Building2 className="h-6 w-6 icon-silver-neon" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="gradient-text">{formatNumber(globalStats.totalOrganizations)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-green-400 font-bold">{globalStats.growthRate}%</span>
                <span className="ml-2">crescimento mensal</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-green-400 font-bold">{globalStats.activeOrganizations} ativas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
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
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-purple-400">{formatNumber(globalStats.totalUsers)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <Activity className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-purple-400 font-bold">Ativos</span>
                <span className="ml-2">na plataforma</span>
              </div>
            </CardContent>
          </Card>

          {/* Total AI Requests */}
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
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-yellow-400">{formatNumber(globalStats.totalAiRequests)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-yellow-400 font-bold">Total</span>
                <span className="ml-2">processadas</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-green-400 font-bold">{formatCurrency(globalStats.totalAiCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Revenue Total</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <DollarSign className="h-6 w-6 icon-silver-neon" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-green-400">{formatCurrency(globalStats.totalRevenue)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-green-400 font-bold">MRR</span>
                <span className="ml-2">recorrente</span>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="glass bg-gray-900/50 border-gray-700">
            <TabsTrigger value="manage" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Gerenciar Organizações
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Plus className="w-4 h-4 mr-2" />
              Criar Organização
            </TabsTrigger>
          </TabsList>

          {/* Manage Organizations Tab */}
          <TabsContent value="manage" className="space-y-6">
            
            {/* Filters Section */}
            <Card className="glass-card neon-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Filter className="w-5 h-5 text-cyan-400" />
                  <span className="gradient-text">Filtros e Busca</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome ou email da organização..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 glass bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-400"
                    data-testid="search-organizations"
                  />
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.plan} onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Planos</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Data" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todas as Datas</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                      <SelectItem value="1y">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400">
                    Mostrando <span className="text-cyan-400 font-bold">{paginatedOrganizations.length}</span> de{' '}
                    <span className="text-cyan-400 font-bold">{filteredOrganizations.length}</span> organizações
                    {selectedOrgs.size > 0 && (
                      <span className="ml-4 text-yellow-400">
                        • <span className="font-bold">{selectedOrgs.size}</span> selecionadas
                      </span>
                    )}
                  </div>
                  
                  {selectedOrgs.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48 glass bg-gray-900/50 border-gray-700 text-white">
                          <SelectValue placeholder="Ações em Massa" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="change-plan">Alterar Plano</SelectItem>
                          <SelectItem value="suspend">Suspender</SelectItem>
                          <SelectItem value="reactivate">Reativar</SelectItem>
                          <SelectItem value="notify">Enviar Notificação</SelectItem>
                          <SelectItem value="export">Exportar Dados</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        onClick={() => bulkAction && handleBulkAction(bulkAction)}
                        disabled={!bulkAction}
                        className="btn-glow"
                        data-testid="execute-bulk-action"
                      >
                        Executar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organizations Table */}
            <Card className="glass-card neon-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span className="gradient-text">Lista de Organizações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-purple-500 mx-auto"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-cyan-400/20"></div>
                    </div>
                    <p className="text-gray-400 mt-4">Carregando organizações...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700">
                        <tr>
                          <th className="p-4 text-left">
                            <Checkbox
                              checked={selectedOrgs.size === paginatedOrganizations.length && paginatedOrganizations.length > 0}
                              onCheckedChange={handleSelectAll}
                              data-testid="select-all-organizations"
                            />
                          </th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Organização</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Tipo</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Plano</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Usuários</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">IA Usage</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Revenue</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Status</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Última Atividade</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {paginatedOrganizations.map((org) => (
                          <tr key={org.id} className="hover:bg-gray-900/30 transition-colors duration-200">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedOrgs.has(org.id)}
                                onCheckedChange={() => handleSelectOrg(org.id)}
                                data-testid={`select-org-${org.id}`}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden icon-container-futuristic">
                                  {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-cyan-600 to-purple-600 flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{org.name}</p>
                                  <p className="text-sm text-gray-400">{org.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{getTypeBadge(org.type)}</td>
                            <td className="p-4">{getPlanBadge(org.plan)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-cyan-400" />
                                <span className="text-white font-semibold">{org.userCount}</span>
                                <span className="text-gray-400 text-sm">/ {org.settings.maxUsers}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Brain className="w-4 h-4 text-yellow-400" />
                                  <span className="text-yellow-400 font-semibold">{formatNumber(org.aiUsage.requests)}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  ${org.aiUsage.cost.toFixed(2)}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-semibold">{formatCurrency(org.revenue)}</span>
                              </div>
                            </td>
                            <td className="p-4">{getStatusBadge(org.status)}</td>
                            <td className="p-4">
                              <div className="text-sm text-gray-400">
                                {formatDate(org.lastActivity)}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'view')}
                                  className="p-2 hover:bg-cyan-500/20"
                                  data-testid={`view-org-${org.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'edit')}
                                  className="p-2 hover:bg-purple-500/20"
                                  data-testid={`edit-org-${org.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'delete')}
                                  className="p-2 hover:bg-red-500/20"
                                  data-testid={`delete-org-${org.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="glass-card neon-panel">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Página {currentPage} de {totalPages}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="hover:bg-cyan-500/20"
                        data-testid="prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        if (page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`${
                              page === currentPage 
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                                : 'hover:bg-gray-700'
                            } min-w-[40px]`}
                            data-testid={`page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="hover:bg-cyan-500/20"
                        data-testid="next-page"
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Create Organization Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="glass-card neon-panel max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Plus className="w-6 h-6 text-purple-400" />
                  <span className="gradient-text">Nova Organização</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Nome da Organização</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: TechCorp Solutions"
                                className="glass bg-gray-900/50 border-gray-700 text-white"
                                data-testid="create-org-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="contato@empresa.com"
                                className="glass bg-gray-900/50 border-gray-700 text-white"
                                data-testid="create-org-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={createForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Tipo de Organização</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white" data-testid="create-org-type">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="trading">Trading</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Plano</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white" data-testid="create-org-plan">
                                  <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Descrição (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Breve descrição sobre a organização..."
                              className="glass bg-gray-900/50 border-gray-700 text-white resize-none"
                              rows={3}
                              data-testid="create-org-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="btn-glow bg-gradient-to-r from-purple-600 to-pink-600 flex-1"
                        data-testid="create-org-submit"
                      >
                        {createMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Organização
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => createForm.reset()}
                        className="hover:bg-gray-700"
                      >
                        Limpar
                      </Button>
                    </div>
                    
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span className="gradient-text">Editar Organização</span>
              </DialogTitle>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="glass bg-gray-800/50 border-gray-600 text-white"
                            data-testid="edit-org-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="glass bg-gray-800/50 border-gray-600 text-white"
                            data-testid="edit-org-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="trading">Trading</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Plano</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-plan">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="active">Ativa</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="suspended">Suspensa</SelectItem>
                            <SelectItem value="inactive">Inativa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="btn-glow bg-gradient-to-r from-cyan-600 to-blue-600 flex-1"
                    data-testid="edit-org-submit"
                  >
                    {editMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
                
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}