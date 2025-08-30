import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  Brain, 
  DollarSign, 
  Search, 
  Plus, 
  Activity,
  TrendingUp,
  CheckCircle,
  Calendar,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface OrganizationData {
  id: string;
  name: string;
  userCount?: number;
  planType?: string;
  status: string;
  lastActivity?: string;
  aiUsage?: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: OrganizationData[];
  message?: string;
}

// Form schemas
const createOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['starter', 'professional', 'enterprise'], {
    required_error: 'Selecione um plano'
  }),
  description: z.string().optional(),
});

const editOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  status: z.enum(['active', 'inactive', 'trial', 'suspended']),
  description: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;
type EditOrgForm = z.infer<typeof editOrgSchema>;

export default function OrganizationsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations from API
  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/admin/organizations-simple'],
    queryFn: async () => {
      const res = await fetch('/api/admin/organizations?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    retry: false
  });

  const organizations = response?.data || [];

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
    const colors = status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
    return (
      <Badge className={`${colors} border glass-effect`}>
        {status === 'active' ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      starter: 'bg-blue-500/20 text-blue-400',
      professional: 'bg-purple-500/20 text-purple-400', 
      enterprise: 'bg-yellow-500/20 text-yellow-400'
    };
    const color = planColors[plan?.toLowerCase() as keyof typeof planColors] || planColors.starter;
    
    return (
      <Badge className={`${color} border glass-effect`}>
        {plan || 'Starter'}
      </Badge>
    );
  };

  // Form handlers
  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      email: '',
      plan: 'starter',
      description: '',
    },
  });

  const editForm = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: '',
      email: '',
      plan: 'starter',
      status: 'active',
      description: '',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrgForm) => {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations-simple'] });
      setShowCreateModal(false);
      createForm.reset();
      toast({
        title: 'Sucesso!',
        description: 'Organização criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditOrgForm }) => {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations-simple'] });
      setShowEditModal(false);
      setSelectedOrg(null);
      editForm.reset();
      toast({
        title: 'Sucesso!',
        description: 'Organização atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations-simple'] });
      toast({
        title: 'Sucesso!',
        description: 'Organização removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateSubmit = (data: CreateOrgForm) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: EditOrgForm) => {
    if (!selectedOrg) return;
    updateMutation.mutate({ id: selectedOrg.id, data });
  };

  const handleEditClick = (org: OrganizationData) => {
    setSelectedOrg(org);
    editForm.reset({
      name: org.name,
      email: org.email || '',
      plan: (org.planType?.toLowerCase() || 'starter') as any,
      status: org.status as any,
      description: '',
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta organização?')) {
      deleteMutation.mutate(id);
    }
  };

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
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 btn-glow">
                <Plus className="h-5 w-5 mr-2" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-dark max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Organização</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Crie uma nova organização na plataforma.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Nome</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o nome da organização" 
                            className="glass-dark" 
                            {...field}
                            data-testid="input-org-name"
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
                            placeholder="email@organizacao.com" 
                            type="email"
                            className="glass-dark" 
                            {...field}
                            data-testid="input-org-email"
                          />
                        </FormControl>
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
                            <SelectTrigger className="glass-dark" data-testid="select-org-plan">
                              <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-dark">
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição da organização..." 
                            className="glass-dark resize-none" 
                            rows={3}
                            {...field}
                            data-testid="textarea-org-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 glass-dark"
                      data-testid="button-cancel-create"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                      data-testid="button-submit-create"
                    >
                      {createMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
                {organizations.length}
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
                {organizations.filter(org => org.status === 'active').length}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <span className="text-green-400">
                  {Math.round((organizations.filter(org => org.status === 'active').length / Math.max(organizations.length, 1)) * 100)}%
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
                  organizations.reduce((sum, org) => sum + (org.aiUsage?.cost || 0), 0)
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
                Requests IA
              </CardTitle>
              <Brain className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {organizations.reduce((sum, org) => sum + (org.aiUsage?.requests || 0), 0).toLocaleString()}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-2">
                <Activity className="h-4 w-4 text-purple-400 mr-1" />
                <span className="text-purple-400">total geral</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card neon-panel">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar organizações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-dark"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="pl-10 glass-dark">
                    <SelectValue placeholder="Filtrar por data" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark">
                    <SelectItem value="all">Todas as datas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="pl-10 glass-dark">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card className="glass-card neon-panel">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-cyan-400" />
              Lista de Organizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300 font-bold">ID</TableHead>
                    <TableHead className="text-gray-300 font-bold">Nome</TableHead>
                    <TableHead className="text-gray-300 font-bold">Usuários</TableHead>
                    <TableHead className="text-gray-300 font-bold">Plano</TableHead>
                    <TableHead className="text-gray-300 font-bold">Data Criação</TableHead>
                    <TableHead className="text-gray-300 font-bold">Vlr/Hora</TableHead>
                    <TableHead className="text-gray-300 font-bold">Vlr Total</TableHead>
                    <TableHead className="text-gray-300 font-bold">Obs</TableHead>
                    <TableHead className="text-gray-300 font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gray-700">
                        <TableCell colSpan={9}>
                          <div className="animate-pulse flex space-x-4">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : organizations
                    .filter(org => 
                      org.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      (statusFilter === 'all' || org.status === statusFilter)
                    )
                    .map((org) => (
                      <TableRow 
                        key={org.id} 
                        className="border-gray-700 hover:bg-gray-800/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-gradient-to-r from-cyan-600/20 to-blue-600/20 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-cyan-400" />
                            </div>
                            <span className="text-gray-300 font-mono text-sm">{org.id}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{org.name}</span>
                            {getStatusBadge(org.status)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-bold">{org.userCount || 0}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getPlanBadge(org.planType || 'starter')}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              {org.lastActivity ? formatDate(org.lastActivity) : '--/--/----'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-green-400 font-bold">
                            {formatCurrency((org.aiUsage?.cost || 0) / Math.max((org.aiUsage?.requests || 1) / 1000, 1))}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-yellow-400 font-bold">
                            {formatCurrency(org.aiUsage?.cost || 0)}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-400 text-sm">
                              {org.aiUsage?.requests?.toLocaleString() || '0'} req
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700">
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="glass-dark" align="end">
                              <DropdownMenuItem className="text-gray-300 hover:text-cyan-400">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-gray-300 hover:text-blue-400 cursor-pointer"
                                onClick={() => handleEditClick(org)}
                                data-testid={`button-edit-${org.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-gray-300 hover:text-red-400 cursor-pointer"
                                onClick={() => handleDeleteClick(org.id)}
                                data-testid={`button-delete-${org.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
            
            {organizations.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma organização encontrada</h3>
                <p className="text-gray-400">Não há organizações para exibir no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Organization Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="glass-dark max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Organização</DialogTitle>
              <DialogDescription className="text-gray-400">
                Atualize as informações da organização.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Nome</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome da organização" 
                          className="glass-dark" 
                          {...field}
                          data-testid="input-edit-org-name"
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
                          placeholder="email@organizacao.com" 
                          type="email"
                          className="glass-dark" 
                          {...field}
                          data-testid="input-edit-org-email"
                        />
                      </FormControl>
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
                          <SelectTrigger className="glass-dark" data-testid="select-edit-org-plan">
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-dark">
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
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
                          <SelectTrigger className="glass-dark" data-testid="select-edit-org-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-dark">
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição da organização..." 
                          className="glass-dark resize-none" 
                          rows={3}
                          {...field}
                          data-testid="textarea-edit-org-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedOrg(null);
                    }}
                    className="flex-1 glass-dark"
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    data-testid="button-submit-edit"
                  >
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
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