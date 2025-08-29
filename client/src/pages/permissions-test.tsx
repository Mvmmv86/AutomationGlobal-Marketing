// client/src/pages/permissions-test.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, Users, Settings, Brain, Cog, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

interface Permission {
  action: string;
  resource: string;
  allowed: boolean;
  reason?: string;
}

export default function PermissionsTest() {
  const [token, setToken] = useState(() => 
    localStorage.getItem('auth_token') || ''
  );
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState('org_user');

  // Login form
  const [loginData, setLoginData] = useState({
    email: 'auth-local@automation.global',
    password: '123456'
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
    setPermissionMatrix([]);
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
      throw new Error(data.message || `HTTP ${response.status}`);
    }

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
      
      addTestResult('Login', 'success', `Login realizado com sucesso para ${loginData.email}`);
      
      // Load user context after login
      await getCurrentUser();
      await getUserOrganizations();
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      addTestResult('Login', 'error', error.message);
    }
  };

  const getCurrentUser = async () => {
    try {
      addTestResult('User Context', 'pending', 'Carregando contexto do usuário...');
      
      const result = await makeRequest('/api/auth/local/me');
      setCurrentUser(result.data);
      
      addTestResult('User Context', 'success', `Usuário carregado: ${result.data.email} (ID: ${result.data.id})`);
    } catch (error: any) {
      addTestResult('User Context', 'error', error.message);
    }
  };

  const getUserOrganizations = async () => {
    try {
      addTestResult('Organizations', 'pending', 'Carregando organizações do usuário...');
      
      const result = await makeRequest('/api/organizations');
      
      if (result.data.organizations.length > 0) {
        const firstOrg = result.data.organizations[0];
        setCurrentOrganization(firstOrg);
        
        addTestResult(
          'Organizations', 
          'success', 
          `${result.data.organizations.length} organizações carregadas. Primeira: ${firstOrg.organization.name} (Role: ${firstOrg.membership.role})`,
          result.data
        );
      } else {
        addTestResult('Organizations', 'error', 'Usuário não tem organizações');
      }
    } catch (error: any) {
      addTestResult('Organizations', 'error', error.message);
    }
  };

  const testSpecificPermission = async (action: string, resource: string): Promise<boolean> => {
    try {
      const testName = `Permission: ${action}:${resource}`;
      addTestResult(testName, 'pending', `Testando permissão ${action} em ${resource}...`);
      
      // Always use the permission check API for consistency
      const permissionCheck = await makeRequest(`/api/permissions/check?action=${action}&resource=${resource}`);
      const hasPermission = permissionCheck.data.hasPermission;
      
      addTestResult(testName, hasPermission ? 'success' : 'error', 
        hasPermission ? 
        `Permissão CONCEDIDA: ${permissionCheck.data.role} pode ${action} em ${resource}` : 
        `Permissão NEGADA: ${permissionCheck.data.role} não pode ${action} em ${resource}`
      );
      
      return hasPermission;
    } catch (error: any) {
      addTestResult(
        `Permission: ${action}:${resource}`, 
        'error',
        `Erro no teste: ${error.message}`
      );
      return false;
    }
  };

  const testAllPermissions = async () => {
    if (!currentOrganization) {
      addTestResult('Permission Matrix', 'error', 'Carregue uma organização primeiro');
      return;
    }

    setLoading(true);
    addTestResult('Permission Matrix', 'pending', 'Testando matriz completa de permissões...');

    const permissions = [
      { action: 'read', resource: 'organization' },
      { action: 'update', resource: 'organization' },
      { action: 'read', resource: 'users' },
      { action: 'create', resource: 'users' },
      { action: 'update', resource: 'users' },
      { action: 'delete', resource: 'users' },
      { action: 'read', resource: 'settings' },
      { action: 'update', resource: 'settings' },
      { action: 'use', resource: 'ai' },
      { action: 'read', resource: 'modules' },
      { action: 'create', resource: 'automations' },
      { action: 'read', resource: 'automations' },
    ];

    const results: Permission[] = [];
    
    for (const perm of permissions) {
      try {
        // Use the actual permission check API for all tests
        const permissionCheck = await makeRequest(`/api/permissions/check?action=${perm.action}&resource=${perm.resource}`);
        const allowed = permissionCheck.data.hasPermission;
        
        results.push({ ...perm, allowed });
        
        addTestResult(
          `Permission: ${perm.action}:${perm.resource}`, 
          allowed ? 'success' : 'error', 
          allowed ? 
            `Permissão CONCEDIDA: ${permissionCheck.data.role} pode ${perm.action} em ${perm.resource}` : 
            `Permissão NEGADA: ${permissionCheck.data.role} não pode ${perm.action} em ${perm.resource}`
        );
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({ ...perm, allowed: false, reason: 'Test failed' });
      }
    }

    setPermissionMatrix(results);
    
    const allowedCount = results.filter(p => p.allowed).length;
    addTestResult(
      'Permission Matrix', 
      'success', 
      `Teste completo: ${allowedCount}/${results.length} permissões permitidas para role ${currentOrganization.membership.role}`
    );
    
    setLoading(false);
  };

  const roleDefinitions = {
    'super_admin': 'Super Admin - Acesso total ao sistema',
    'org_owner': 'Organization Owner - Dono da organização',
    'org_admin': 'Organization Admin - Administrador da organização', 
    'org_manager': 'Organization Manager - Gerente da organização',
    'org_user': 'Organization User - Usuário comum',
    'org_viewer': 'Organization Viewer - Apenas visualização'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            🛡️ Sistema de Permissões Granulares - Teste Completo
          </h1>
          <p className="text-slate-300">
            Interface de teste para validação do sistema de permissões hierárquicas e controle de acesso
          </p>
        </div>

        {/* User Context & Login */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Login & Contexto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-200 text-sm">Email</label>
                <input
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded"
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="text-slate-200 text-sm">Senha</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded"
                  data-testid="input-password"
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
                <Users className="w-5 h-5" />
                Contexto Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser ? (
                <>
                  <div>
                    <span className="text-slate-400 text-sm">Usuário:</span>
                    <p className="text-white font-medium">{currentUser.email}</p>
                  </div>
                  {currentOrganization && (
                    <>
                      <div>
                        <span className="text-slate-400 text-sm">Organização:</span>
                        <p className="text-white font-medium">{currentOrganization.organization.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Role:</span>
                        <Badge className="bg-purple-600 ml-2">
                          {currentOrganization.membership.role}
                        </Badge>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-center py-4">Faça login para ver o contexto</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Testes de Permissão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testAllPermissions} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !currentOrganization}
                data-testid="button-test-permissions"
              >
                {loading ? 'Testando...' : 'Testar Todas as Permissões'}
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline" 
                className="w-full border-red-600 text-red-400 hover:bg-red-900"
                data-testid="button-clear-results"
              >
                Limpar Resultados
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matrix" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="matrix" className="data-[state=active]:bg-slate-700 text-white">
              Matriz de Permissões
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-slate-700 text-white">
              Hierarquia de Roles
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 text-white">
              Resultados dos Testes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Matriz de Permissões por Ação/Recurso</CardTitle>
                <CardDescription className="text-slate-300">
                  Resultado dos testes de permissão para o role atual: {currentOrganization?.membership.role || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionMatrix.length > 0 ? (
                  <div className="space-y-2">
                    {permissionMatrix.map((perm, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          {perm.allowed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-white font-medium">
                            {perm.action}:{perm.resource}
                          </span>
                        </div>
                        <Badge className={perm.allowed ? 'bg-green-600' : 'bg-red-600'}>
                          {perm.allowed ? 'PERMITIDO' : 'NEGADO'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">Execute os testes para ver a matriz</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Hierarquia de Roles</CardTitle>
                <CardDescription className="text-slate-300">
                  Sistema de roles hierárquico com permissões crescentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleDefinitions).map(([role, description]) => (
                    <div key={role} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          role === 'super_admin' ? 'bg-red-600' :
                          role.includes('owner') ? 'bg-yellow-600' :
                          role.includes('admin') ? 'bg-blue-600' :
                          role.includes('manager') ? 'bg-green-600' :
                          role.includes('user') ? 'bg-purple-600' : 'bg-slate-600'
                        }>
                          {role}
                        </Badge>
                        {currentOrganization?.membership.role === role && (
                          <Badge className="bg-orange-600">ATUAL</Badge>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm">{description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resultados dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Nenhum teste executado ainda</p>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className="bg-slate-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                            {result.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                            {result.status === 'pending' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                            <span className="text-white font-medium">{result.test}</span>
                          </div>
                          <span className="text-slate-400 text-sm">{result.timestamp}</span>
                        </div>
                        <p className="text-slate-300 text-sm">{result.message}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-slate-400 text-xs cursor-pointer">Ver dados</summary>
                            <pre className="text-slate-300 text-xs mt-1 p-2 bg-slate-900 rounded overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}