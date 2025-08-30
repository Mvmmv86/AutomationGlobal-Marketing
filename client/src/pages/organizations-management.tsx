import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  Brain, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  users: number;
  aiUsage: number;
  monthlySpend: number;
  createdAt: string;
  lastActivity: string;
  subscription: {
    tier: string;
    limits: {
      users: number;
      aiRequests: number;
      storage: string;
    };
  };
}

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
  pagination: {
    current: number;
    total: number;
    totalItems: number;
    limit: number;
  };
  filters: {
    search: string;
    status: string;
    plan: string;
    sortBy: string;
    sortOrder: string;
  };
}

export default function OrganizationsManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations list
  const { data: organizationsData, isLoading } = useQuery<OrganizationsResponse>({
    queryKey: ['/api/admin/organizations', currentPage, searchTerm, statusFilter, planFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        plan: planFilter,
        sortBy,
        sortOrder
      });
      const response = await fetch(`/api/admin/organizations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
      inactive: { label: 'Inativo', color: 'bg-red-500/20 text-red-400 border-red-400/30' },
      trial: { label: 'Trial', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
      suspended: { label: 'Suspenso', color: 'bg-gray-500/20 text-gray-400 border-gray-400/30' }
    };

    const config = statusConfig[(status || 'inactive') as keyof typeof statusConfig] || statusConfig.inactive;

    return (
      <Badge className={`${config.color} border glass-effect`}>
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      starter: { label: 'Starter', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
      professional: { label: 'Professional', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
      enterprise: { label: 'Enterprise', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' }
    };

    const config = planConfig[(plan?.toLowerCase() || 'starter') as keyof typeof planConfig] || planConfig.starter;

    return (
      <Badge className={`${config.color} border glass-effect`}>
        {config.label}
      </Badge>
    );
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleStatusChange = useMutation({
    mutationFn: async ({ orgId, newStatus }: { orgId: string; newStatus: string }) => {
      return apiRequest(`/api/admin/organizations/${orgId}/status`, 'POST', { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      toast({
        title: "Status Atualizado",
        description: "Status da organização foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao alterar status da organização.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 matrix-grid">
      <div className="relative z-10 p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Gestão de Organizações
            </h1>
            <p className="text-gray-400">
              Gerencie todas as organizações da plataforma
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 btn-glow"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Organização
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card card-hover neon-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Total de Orgs
              </CardTitle>
              <Building2 className="h-5 w-5 icon-silver-neon" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {organizationsData?.pagination?.totalItems || 0}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400">+12%</span>
                <span className="ml-1">este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-hover neon-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Organizações Ativas
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {organizationsData?.data?.filter ? organizationsData.data.filter(org => org.status === 'active').length : 0}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <span className="text-green-400">
                  {organizationsData?.data?.filter ? Math.round(((organizationsData.data.filter(org => org.status === 'active').length) / 
                    (organizationsData?.pagination?.totalItems || 1)) * 100) : 0}%
                </span>
                <span className="ml-1">do total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-hover neon-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Revenue Total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(
                  organizationsData?.data?.reduce ? organizationsData.data.reduce((sum, org) => sum + org.monthlySpend, 0) : 0
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <span className="text-yellow-400">MRR</span>
                <span className="ml-1">mensal</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-hover neon-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Uso de IA Médio
              </CardTitle>
              <Brain className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.round(
                  organizationsData?.data?.reduce ? (organizationsData.data.reduce((sum, org) => sum + org.aiUsage, 0) / organizationsData.data.length) : 0
                )}%
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <Activity className="h-4 w-4 text-purple-400 mr-1" />
                <span className="text-purple-400">média geral</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="glass-card neon-panel">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar organizações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-dark"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] glass-dark">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[180px] glass-dark">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card className="glass-card neon-panel overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 icon-silver-neon" />
              <span className="gradient-text">Organizações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead 
                      className="text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Organização
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Plano</TableHead>
                    <TableHead 
                      className="text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('users')}
                    >
                      <div className="flex items-center gap-2">
                        Usuários
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-300">Uso de IA</TableHead>
                    <TableHead 
                      className="text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('monthlySpend')}
                    >
                      <div className="flex items-center gap-2">
                        Gasto Mensal
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Criado em
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gray-700">
                        <TableCell colSpan={8}>
                          <div className="animate-pulse flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : organizationsData?.data && Array.isArray(organizationsData.data) ? (
                    organizationsData.data.map((org) => (
                      <TableRow 
                        key={org.id} 
                        className="border-gray-700 hover:bg-gray-800/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOrg(org);
                          setShowDetailsModal(true);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{org.name}</div>
                              <div className="text-gray-400 text-sm">{org.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(org.status)}
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(org.plan || (org as any).planType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-white">{org.users || (org as any).userCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                                style={{ width: `${org.aiUsage}%` }}
                              />
                            </div>
                            <span className="text-green-400 text-sm font-bold">
                              {org.aiUsage || ((org as any).aiUsage?.requests ? Math.round(((org as any).aiUsage.requests / 1000) * 100) : 0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-400 font-bold">
                            {formatCurrency(org.monthlySpend || (org as any).aiUsage?.cost || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{formatDate(org.createdAt || (org as any).lastActivity)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-dark border-gray-700">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrg(org);
                                setShowDetailsModal(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newStatus = org.status === 'active' ? 'inactive' : 'active';
                                  handleStatusChange.mutate({ orgId: org.id, newStatus });
                                }}
                              >
                                {org.status === 'active' ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-gray-700">
                      <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                        Nenhuma organização encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {organizationsData?.pagination && (
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Mostrando {((organizationsData.pagination.current - 1) * organizationsData.pagination.limit) + 1} a{' '}
              {Math.min(organizationsData.pagination.current * organizationsData.pagination.limit, organizationsData.pagination.totalItems)} de{' '}
              {organizationsData.pagination.totalItems} organizações
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={organizationsData.pagination.current === 1}
                className="glass-dark"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, organizationsData.pagination.total) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-cyan-600 hover:bg-cyan-500" : "glass-dark"}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(organizationsData.pagination.total, prev + 1))}
                disabled={organizationsData.pagination.current === organizationsData.pagination.total}
                className="glass-dark"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Organization Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl glass-dark border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">
              Detalhes da Organização
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrg && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Gerais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-400 text-sm">Nome</label>
                      <p className="text-white font-medium">{selectedOrg.name}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Email</label>
                      <p className="text-white">{selectedOrg.email}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="text-gray-400 text-sm">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedOrg.status)}</div>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">Plano</label>
                        <div className="mt-1">{getPlanBadge(selectedOrg.plan)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Métricas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg glass-card">
                      <div className="text-gray-400 text-sm">Usuários</div>
                      <div className="text-white font-bold text-xl">{selectedOrg.users}</div>
                    </div>
                    <div className="p-3 rounded-lg glass-card">
                      <div className="text-gray-400 text-sm">Uso de IA</div>
                      <div className="text-green-400 font-bold text-xl">{selectedOrg.aiUsage}%</div>
                    </div>
                    <div className="p-3 rounded-lg glass-card">
                      <div className="text-gray-400 text-sm">Gasto Mensal</div>
                      <div className="text-yellow-400 font-bold text-xl">
                        {formatCurrency(selectedOrg.monthlySpend)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg glass-card">
                      <div className="text-gray-400 text-sm">Limite Usuários</div>
                      <div className="text-white font-bold text-xl">
                        {selectedOrg.subscription.limits.users}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Limites do Plano</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg glass-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      <span className="text-gray-400 text-sm">Usuários</span>
                    </div>
                    <div className="text-white font-bold">
                      {selectedOrg.users} / {selectedOrg.subscription.limits.users}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (selectedOrg.users / selectedOrg.subscription.limits.users) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg glass-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      <span className="text-gray-400 text-sm">Requests IA</span>
                    </div>
                    <div className="text-white font-bold">
                      {formatNumber(selectedOrg.subscription.limits.aiRequests)}
                    </div>
                    <div className="text-purple-400 text-sm mt-1">por mês</div>
                  </div>

                  <div className="p-4 rounded-lg glass-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      <span className="text-gray-400 text-sm">Storage</span>
                    </div>
                    <div className="text-white font-bold">
                      {selectedOrg.subscription.limits.storage}
                    </div>
                    <div className="text-green-400 text-sm mt-1">disponível</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}