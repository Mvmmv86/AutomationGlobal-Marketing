import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

export default function OrganizationsManagement() {
  const [searchTerm, setSearchTerm] = useState('');

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
          
          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 btn-glow">
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

        {/* Search */}
        <Card className="glass-card neon-panel">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar organizações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-dark"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-card neon-panel">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            organizations
              .filter(org => 
                org.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((org) => (
                <Card key={org.id} className="glass-card card-hover neon-panel">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">{org.name}</CardTitle>
                          <p className="text-sm text-gray-400">ID: {org.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(org.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Plano:</span>
                      {getPlanBadge(org.planType || 'starter')}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Usuários:</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-bold">{org.userCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Requests IA:</span>
                      <div className="flex items-center gap-1">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span className="text-white font-bold">
                          {org.aiUsage?.requests?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Custo:</span>
                      <span className="text-yellow-400 font-bold">
                        {formatCurrency(org.aiUsage?.cost || 0)}
                      </span>
                    </div>
                    
                    {org.lastActivity && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Última atividade:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {formatDate(org.lastActivity)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {organizations.length === 0 && !isLoading && (
          <Card className="glass-card neon-panel">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma organização encontrada</h3>
              <p className="text-gray-400">Não há organizações para exibir no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}