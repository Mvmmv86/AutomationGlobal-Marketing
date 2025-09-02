import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus, 
  Building2, 
  Eye, 
  EyeOff, 
  Users, 
  Settings, 
  ExternalLink,
  Calendar,
  Mail,
  Lock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface Organization {
  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
    description?: string;
    createdAt: string;
    isActive: boolean;
  };
  credentials: {
    id: string;
    loginEmail: string;
    displayName: string;
    accessLevel: string;
    lastLoginAt?: string;
    createdAt: string;
  } | null;
}

interface CreateOrgResponse {
  success: boolean;
  organization: any;
  credentials: any;
  message: string;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');
  const [selectedType, setSelectedType] = useState<'marketing' | 'support' | 'trading'>('marketing');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    loginEmail: '',
    loginPassword: '',
    displayName: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch organizations by type
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/org-auth/admin/organizations', selectedType],
    enabled: activeTab === 'manage'
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof formData & { type: string }) => {
      const response = await apiRequest('/api/org-auth/admin/create-organization', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response.json() as Promise<CreateOrgResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(data.message);
        setError(null);
        // Reset form
        setFormData({
          name: '',
          slug: '',
          description: '',
          loginEmail: '',
          loginPassword: '',
          displayName: ''
        });
        // Refresh organizations list
        queryClient.invalidateQueries({ 
          queryKey: ['/api/org-auth/admin/organizations'] 
        });
      } else {
        setError('Failed to create organization');
      }
    },
    onError: (error: any) => {
      console.error('Create org error:', error);
      setError(error.message || 'Failed to create organization');
    }
  });

  // Impersonate organization mutation
  const impersonateMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest(`/api/org-auth/admin/impersonate/${orgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response.json();
    },
    onSuccess: (data, orgId) => {
      if (data.success) {
        // Store impersonation session
        localStorage.setItem('org_session_token', data.sessionToken);
        localStorage.setItem('org_access_type', 'admin_impersonate');
        localStorage.setItem('org_data', JSON.stringify({
          organization: data.organization,
          adminUser: data.adminUser,
          expiresAt: data.expiresAt
        }));

        // Redirect to organization dashboard
        if (data.organization.type === 'marketing') {
          setLocation(`/marketing/${orgId}`);
        } else if (data.organization.type === 'support') {
          setLocation(`/support/${orgId}`);
        } else if (data.organization.type === 'trading') {
          setLocation(`/trading/${orgId}`);
        }
      } else {
        setError('Failed to access organization');
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to access organization');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!formData.name || !formData.slug || !formData.loginEmail || !formData.loginPassword || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    // Auto-generate slug from name if not provided
    const slug = formData.slug || formData.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    createOrgMutation.mutate({
      ...formData,
      slug,
      type: selectedType
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(139, 92, 246, 0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
            <Shield size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Painel Administrativo
            </h1>
            <p className="text-gray-300">
              Gerencie organizações e seus acessos independentes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-md border-white/20">
            <TabsTrigger 
              value="create" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              data-testid="tab-create"
            >
              <Plus size={16} className="mr-2" />
              Criar Organização
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              data-testid="tab-manage"
            >
              <Users size={16} className="mr-2" />
              Gerenciar Organizações
            </TabsTrigger>
          </TabsList>

          {/* Create Organization Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 size={20} />
                  Nova Organização
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Crie uma nova organização com credenciais de acesso exclusivas
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert className="bg-red-500/10 border-red-500/50">
                    <AlertDescription className="text-red-100">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-500/10 border-green-500/50">
                    <AlertDescription className="text-green-100">{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Organization Type */}
                  <div className="space-y-2">
                    <Label className="text-gray-200">Tipo de Organização *</Label>
                    <Select 
                      value={selectedType} 
                      onValueChange={(value: 'marketing' | 'support' | 'trading') => setSelectedType(value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">📈 Marketing</SelectItem>
                        <SelectItem value="support">🎧 Suporte</SelectItem>
                        <SelectItem value="trading">💰 Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Organization Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Informações da Organização</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-200">Nome da Organização *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Empresa Marketing LTDA"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          data-testid="input-name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-gray-200">Slug (opcional)</Label>
                        <Input
                          id="slug"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          placeholder="empresa-marketing-ltda"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          data-testid="input-slug"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Descrição da organização..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-20"
                          data-testid="textarea-description"
                        />
                      </div>
                    </div>

                    {/* Access Credentials */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Credenciais de Acesso</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="loginEmail" className="text-gray-200">Email de Login *</Label>
                        <Input
                          id="loginEmail"
                          name="loginEmail"
                          type="email"
                          value={formData.loginEmail}
                          onChange={handleChange}
                          placeholder="marketing@empresa.com"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          data-testid="input-login-email"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="loginPassword" className="text-gray-200">Senha de Login *</Label>
                        <div className="relative">
                          <Input
                            id="loginPassword"
                            name="loginPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.loginPassword}
                            onChange={handleChange}
                            placeholder="••••••••••••"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                            data-testid="input-login-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-gray-200">Nome de Exibição *</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                          placeholder="Administrador Marketing"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          data-testid="input-display-name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
                    disabled={createOrgMutation.isPending}
                    data-testid="button-create-organization"
                  >
                    {createOrgMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Criando Organização...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus size={16} />
                        Criar Organização
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Organizations Tab */}
          <TabsContent value="manage" className="space-y-6">
            {/* Type Filter */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Filtrar por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedType} 
                  onValueChange={(value: 'marketing' | 'support' | 'trading') => setSelectedType(value)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-64" data-testid="select-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">📈 Marketing</SelectItem>
                    <SelectItem value="support">🎧 Suporte</SelectItem>
                    <SelectItem value="trading">💰 Trading</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Organizations List */}
            {orgsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations?.organizations?.map((org: Organization) => (
                  <Card key={org.organization.id} className="backdrop-blur-md bg-white/10 border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">{org.organization.name}</CardTitle>
                          <CardDescription className="text-gray-300">{org.organization.slug}</CardDescription>
                        </div>
                        <div className="text-xs px-2 py-1 bg-purple-500/20 text-purple-200 rounded">
                          {org.organization.type}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {org.credentials && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail size={14} />
                            <span>{org.credentials.loginEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Lock size={14} />
                            <span>{org.credentials.displayName}</span>
                          </div>
                          {org.credentials.lastLoginAt && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar size={14} />
                              <span>Último acesso: {new Date(org.credentials.lastLoginAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => impersonateMutation.mutate(org.organization.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        disabled={impersonateMutation.isPending}
                        data-testid={`button-access-${org.organization.id}`}
                      >
                        {impersonateMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Acessando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ExternalLink size={16} />
                            Acessar Dashboard
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {organizations?.organizations?.length === 0 && (
              <Card className="backdrop-blur-md bg-white/10 border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Building2 size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-300 text-lg">Nenhuma organização {selectedType} encontrada</p>
                  <p className="text-gray-400 text-sm">Crie sua primeira organização na aba "Criar Organização"</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}