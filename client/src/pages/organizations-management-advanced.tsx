import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Building2, 
  Users, 
  Brain, 
  DollarSign, 
  Calendar,
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  Pause,
  Play,
  Trash2,
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  Target,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types following project schema
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

const ITEMS_PER_PAGE = 25;

// Mock data following authentic structure
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
    settings: { maxUsers: 50, maxAiRequests: 50000, features: ['advanced-ai', 'priority-support', 'custom-models'] }
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
    settings: { maxUsers: 25, maxAiRequests: 10000, features: ['standard-ai', 'email-support'] }
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
    settings: { maxUsers: 100, maxAiRequests: 100000, features: ['advanced-ai', 'priority-support', 'custom-models', 'white-label'] }
  },
  {
    id: '4',
    name: 'Growth Marketing Lab',
    email: 'hello@growthlab.marketing',
    type: 'marketing',
    plan: 'starter',
    status: 'suspended',
    logoUrl: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=GL',
    userCount: 8,
    aiUsage: { requests: 1800, tokens: 45000, cost: 12.60 },
    revenue: 290,
    lastActivity: '2025-01-25T16:20:00Z',
    createdAt: '2024-11-05T10:15:00Z',
    settings: { maxUsers: 10, maxAiRequests: 5000, features: ['basic-ai'] }
  },
  {
    id: '5',
    name: 'AI Support Solutions',
    email: 'contact@aisupport.co',
    type: 'support',
    plan: 'pro',
    status: 'active',
    logoUrl: 'https://via.placeholder.com/40x40/ef4444/ffffff?text=AS',
    userCount: 23,
    aiUsage: { requests: 8900, tokens: 234000, cost: 78.90 },
    revenue: 1560,
    lastActivity: '2025-01-28T09:30:00Z',
    createdAt: '2024-09-12T13:45:00Z',
    settings: { maxUsers: 25, maxAiRequests: 15000, features: ['standard-ai', 'email-support', 'chat-support'] }
  }
];

export default function OrganizationsManagementAdvanced() {
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
  const [actionType, setActionType] = useState<string>('');
  const [bulkAction, setBulkAction] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate API fetch - replace with real API call
  const { data: organizations = mockOrganizations, isLoading, refetch } = useQuery({
    queryKey: ['/api/organizations/advanced'],
    queryFn: () => Promise.resolve(mockOrganizations),
    refetchInterval: 30000,
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
    setSelectedOrg(org);
    setActionType(action);
    
    toast({
      title: "Ação Executada",
      description: `${action} executada para ${org.name}`,
      variant: "default",
    });
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
      variant: "default",
    });

    setSelectedOrgs(new Set());
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
              <p className="text-gray-400 mt-1">Administração completa e avançada da plataforma</p>
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
              <span className="gradient-text">Tabela de Organizações</span>
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
                    {paginatedOrganizations.map((org, index) => (
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
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSingleAction(org, 'analytics')}
                              className="p-2 hover:bg-green-500/20"
                              data-testid={`analytics-org-${org.id}`}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSingleAction(org, 'billing')}
                              className="p-2 hover:bg-yellow-500/20"
                              data-testid={`billing-org-${org.id}`}
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSingleAction(org, org.status === 'suspended' ? 'reactivate' : 'suspend')}
                              className="p-2 hover:bg-orange-500/20"
                              data-testid={`toggle-org-${org.id}`}
                            >
                              {org.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
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
      </div>
    </div>
  );
}