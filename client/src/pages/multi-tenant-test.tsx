// client/src/pages/multi-tenant-test.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Building2, Users, Shield, CheckCircle2, XCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'marketing' | 'support' | 'trading' | 'enterprise';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  isActive: boolean;
  createdAt: string;
}

interface OrganizationMembership {
  id: string;
  role: 'super_admin' | 'org_owner' | 'org_admin' | 'org_manager' | 'org_user' | 'org_viewer';
  permissions: Record<string, boolean>;
  isActive: boolean;
  joinedAt: string;
}

interface UserOrganization {
  organization: Organization;
  membership: OrganizationMembership;
}

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

export default function MultiTenantTest() {
  const [token, setToken] = useState(() => 
    localStorage.getItem('auth_token') || ''
  );
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [currentContext, setCurrentContext] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: 'auth-local@automation.global',
    password: '123456'
  });

  // Form states
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'marketing' as const,
    subscriptionPlan: 'starter' as const
  });

  const [switchContextData, setSwitchContextData] = useState({
    organizationId: ''
  });

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    const result: TestResult = {
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data);
      
      // Check if token is expired
      if (response.status === 401 && data.code === 'INVALID_TOKEN') {
        setTokenStatus('invalid');
        addTestResult('Token Status', 'error', 'Token expirado! Faça login novamente.');
      }
      
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    setTokenStatus('valid');
    console.log('✅ API Success:', data);
    return data;
  };

  const doLogin = async () => {
    try {
      addTestResult('Login', 'pending', 'Fazendo login...');
      
      const response = await fetch('/api/auth/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      const newToken = data.data.accessToken;
      setToken(newToken);
      localStorage.setItem('auth_token', newToken);
      setTokenStatus('valid');
      
      addTestResult('Login', 'success', `Login realizado com sucesso para ${loginData.email}`);
      
      // Automatically load organizations after successful login
      await testListOrganizations();
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      addTestResult('Login', 'error', error.message);
    }
  };

  const testListOrganizations = async () => {
    try {
      addTestResult('List Organizations', 'pending', 'Testando listagem de organizações...');
      
      const result = await makeRequest('/api/organizations');
      
      setOrganizations(result.data.organizations || []);
      setCurrentContext(result.data.currentContext);
      
      addTestResult(
        'List Organizations', 
        'success', 
        `${result.data.total} organizações encontradas`,
        result
      );
    } catch (error: any) {
      addTestResult('List Organizations', 'error', error.message);
    }
  };

  const testCreateOrganization = async () => {
    if (!newOrgData.name || !newOrgData.slug) {
      addTestResult('Create Organization', 'error', 'Nome e slug são obrigatórios');
      return;
    }

    try {
      addTestResult('Create Organization', 'pending', 'Criando nova organização...');
      
      console.log('🚀 Criando organização:', newOrgData);
      console.log('🔑 Token:', token ? 'Token presente' : 'Token ausente');
      
      const result = await makeRequest('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(newOrgData),
      });
      
      console.log('✅ Organização criada:', result);
      
      addTestResult(
        'Create Organization', 
        'success', 
        `Organização "${result.data.organization.name}" criada com sucesso (ID: ${result.data.organization.id})`,
        result
      );

      // Limpar form e recarregar lista
      setNewOrgData({
        name: '',
        slug: '',
        description: '',
        type: 'marketing',
        subscriptionPlan: 'starter'
      });
      
      console.log('🔄 Recarregando lista de organizações...');
      await testListOrganizations();
    } catch (error: any) {
      console.error('❌ Erro ao criar organização:', error);
      addTestResult('Create Organization', 'error', error.message);
    }
  };

  const testSwitchContext = async () => {
    if (!switchContextData.organizationId) {
      addTestResult('Switch Context', 'error', 'ID da organização é obrigatório');
      return;
    }

    try {
      addTestResult('Switch Context', 'pending', 'Mudando contexto de organização...');
      
      const result = await makeRequest('/api/organizations/switch-context', {
        method: 'POST',
        body: JSON.stringify(switchContextData),
      });
      
      setCurrentContext({
        organizationId: result.data.context.organizationId,
        organizationName: result.data.context.organization.name,
        role: result.data.context.role
      });
      
      addTestResult(
        'Switch Context', 
        'success', 
        `Contexto mudado para "${result.data.context.organization.name}" como ${result.data.context.role}`,
        result
      );
    } catch (error: any) {
      addTestResult('Switch Context', 'error', error.message);
    }
  };

  const testGetCurrentContext = async () => {
    try {
      addTestResult('Get Current Context', 'pending', 'Obtendo contexto atual...');
      
      const result = await makeRequest('/api/organizations/current');
      
      setCurrentContext({
        organizationId: result.data.context.organizationId,
        organizationName: result.data.context.organization.name,
        role: result.data.context.role
      });
      
      addTestResult(
        'Get Current Context', 
        'success', 
        `Contexto atual: "${result.data.context.organization.name}" como ${result.data.context.role}`,
        result
      );
    } catch (error: any) {
      addTestResult('Get Current Context', 'error', error.message);
    }
  };

  const testTenantIsolation = async () => {
    if (!currentContext?.organizationId) {
      addTestResult('Tenant Isolation', 'error', 'Nenhum contexto de organização ativo');
      return;
    }

    try {
      addTestResult('Tenant Isolation', 'pending', 'Testando isolamento de dados...');
      
      // Testar com header X-Organization-ID
      const result1 = await makeRequest(`/api/organizations/${currentContext.organizationId}`, {
        headers: {
          'X-Organization-ID': currentContext.organizationId
        }
      });
      
      addTestResult(
        'Tenant Isolation', 
        'success', 
        `Acesso autorizado com header X-Organization-ID: ${result1.data.organization.name}`,
        result1
      );

      // Testar acesso negado a organização inexistente
      try {
        await makeRequest('/api/organizations/00000000-0000-0000-0000-000000000000');
        addTestResult('Tenant Isolation', 'error', 'Deveria ter negado acesso a organização inexistente');
      } catch (error: any) {
        if (error.message.includes('Access denied') || error.message.includes('not found')) {
          addTestResult('Tenant Isolation', 'success', 'Acesso negado corretamente para organização inexistente');
        } else {
          addTestResult('Tenant Isolation', 'error', `Erro inesperado: ${error.message}`);
        }
      }
    } catch (error: any) {
      addTestResult('Tenant Isolation', 'error', error.message);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    clearResults();
    
    try {
      await testListOrganizations();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentContext?.organizationId) {
        await testGetCurrentContext();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await testTenantIsolation();
      }
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      testListOrganizations();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏢 Sistema Multi-Tenant - Teste Completo
          </h1>
          <p className="text-slate-300">
            Interface de teste para validação do sistema multi-tenant com organizações, contexto e isolamento de dados
          </p>
        </div>

        {/* Login & Token */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Login Rápido
              </CardTitle>
              <CardDescription className="text-slate-300">
                Fazer login para obter token válido automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-slate-200">Email</Label>
                <Input
                  id="login-email"
                  data-testid="input-login-email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-slate-200">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  data-testid="input-login-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button 
                onClick={doLogin} 
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-login"
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Status do Token
                {tokenStatus === 'valid' && <Badge className="bg-green-600">Válido</Badge>}
                {tokenStatus === 'invalid' && <Badge className="bg-red-600">Expirado</Badge>}
                {tokenStatus === 'unknown' && <Badge className="bg-gray-600">Desconhecido</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="token" className="text-slate-200">JWT Token (Opcional)</Label>
                <Input
                  id="token"
                  data-testid="input-auth-token"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    localStorage.setItem('auth_token', e.target.value);
                    setTokenStatus('unknown');
                  }}
                  placeholder="Cole seu JWT token aqui ou faça login..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button 
                onClick={runAllTests} 
                disabled={!token || loading || tokenStatus === 'invalid'}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-run-all-tests"
              >
                {loading ? 'Executando...' : 'Executar Todos os Testes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Context */}
        {currentContext && (
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Contexto Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Organização</Label>
                  <p className="text-white font-medium" data-testid="text-current-org">
                    {currentContext.organizationName}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">ID</Label>
                  <p className="text-slate-400 font-mono text-sm" data-testid="text-current-org-id">
                    {currentContext.organizationId}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">Role</Label>
                  <Badge variant="outline" className="text-green-400 border-green-400" data-testid="badge-current-role">
                    {currentContext.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="operations" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700 text-white">
              Operações Multi-Tenant
            </TabsTrigger>
            <TabsTrigger value="organizations" className="data-[state=active]:bg-slate-700 text-white">
              Organizações ({organizations.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 text-white">
              Resultados dos Testes ({testResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Organization */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Criar Organização</CardTitle>
                  <CardDescription className="text-slate-300">
                    Teste criação de nova organização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="org-name" className="text-slate-200">Nome</Label>
                    <Input
                      id="org-name"
                      data-testid="input-org-name"
                      value={newOrgData.name}
                      onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: Minha Empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-slug" className="text-slate-200">Slug</Label>
                    <Input
                      id="org-slug"
                      data-testid="input-org-slug"
                      value={newOrgData.slug}
                      onChange={(e) => setNewOrgData({ ...newOrgData, slug: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: minha-empresa"
                    />
                  </div>
                  <Button 
                    onClick={testCreateOrganization} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-create-org"
                  >
                    Criar Organização
                  </Button>
                </CardContent>
              </Card>

              {/* Switch Context */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Switch Contexto</CardTitle>
                  <CardDescription className="text-slate-300">
                    Teste mudança de contexto organizacional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="context-org-id" className="text-slate-200">ID da Organização</Label>
                    <Input
                      id="context-org-id"
                      data-testid="input-context-org-id"
                      value={switchContextData.organizationId}
                      onChange={(e) => setSwitchContextData({ organizationId: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="UUID da organização"
                    />
                  </div>
                  <Button 
                    onClick={testSwitchContext} 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    data-testid="button-switch-context"
                  >
                    Mudar Contexto
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Individual Test Buttons */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Testes Individuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={testListOrganizations} 
                    variant="outline" 
                    className="border-slate-600 text-white hover:bg-slate-700"
                    data-testid="button-test-list-orgs"
                  >
                    Listar Orgs
                  </Button>
                  <Button 
                    onClick={testGetCurrentContext} 
                    variant="outline" 
                    className="border-slate-600 text-white hover:bg-slate-700"
                    data-testid="button-test-current-context"
                  >
                    Contexto Atual
                  </Button>
                  <Button 
                    onClick={testTenantIsolation} 
                    variant="outline" 
                    className="border-slate-600 text-white hover:bg-slate-700"
                    data-testid="button-test-isolation"
                  >
                    Isolamento
                  </Button>
                  <Button 
                    onClick={clearResults} 
                    variant="outline" 
                    className="border-red-600 text-red-400 hover:bg-red-900"
                    data-testid="button-clear-results"
                  >
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700 col-span-full">
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">Nenhuma organização encontrada</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                organizations.map((userOrg) => (
                  <Card key={userOrg.organization.id} className="bg-slate-800 border-slate-700" data-testid={`card-org-${userOrg.organization.id}`}>
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        {userOrg.organization.name}
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        {userOrg.organization.slug}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {userOrg.organization.type}
                        </Badge>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {userOrg.membership.role}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-slate-300">
                          <span className="text-slate-400">Plano:</span> {userOrg.organization.subscriptionPlan}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-400">Status:</span> 
                          {userOrg.organization.isActive ? 
                            <Badge variant="outline" className="text-green-400 border-green-400 ml-2">Ativo</Badge> : 
                            <Badge variant="outline" className="text-red-400 border-red-400 ml-2">Inativo</Badge>
                          }
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSwitchContextData({ organizationId: userOrg.organization.id });
                          testSwitchContext();
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        data-testid={`button-select-org-${userOrg.organization.id}`}
                      >
                        Selecionar Contexto
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Resultados dos Testes</CardTitle>
                  <CardDescription className="text-slate-300">
                    Log detalhado de todos os testes executados
                  </CardDescription>
                </div>
                <Button 
                  onClick={clearResults}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900"
                  data-testid="button-clear-results-header"
                >
                  Limpar Resultados
                </Button>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum teste executado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="border border-slate-600 rounded-lg p-4" data-testid={`result-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                            {result.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                            {result.status === 'pending' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                            <span className="text-white font-medium">{result.test}</span>
                          </div>
                          <span className="text-slate-400 text-sm">{result.timestamp}</span>
                        </div>
                        <p className={`text-sm mb-2 ${
                          result.status === 'success' ? 'text-green-400' :
                          result.status === 'error' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-slate-300 text-sm cursor-pointer hover:text-white">
                              Ver dados da resposta
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}