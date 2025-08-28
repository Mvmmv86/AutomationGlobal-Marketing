import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Database, User, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RealDataTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    email: 'test@automation.global',
    password: 'Test123456!',
    name: 'Usuario Teste',
    organizationName: 'Organizacao Teste'
  });

  const runRealDataTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const results = {
        persistence: null,
        supabaseAttempt: null,
        userCreation: null,
        organizationCreation: null,
        timestamp: new Date().toISOString()
      };

      // Test real data persistence system
      try {
        console.log('🧪 Testing Real Data Persistence System...');
        
        // Create unique test data
        const uniqueId = Date.now();
        const testUser = {
          ...testData,
          email: `test-${uniqueId}@automation.global`
        };

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(testUser)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 201) {
          const data = await response.json();
          results.userCreation = {
            success: true,
            user: data.data?.user,
            organization: data.data?.organization,
            message: 'Usuario e organização criados com sucesso!'
          };
        } else {
          const errorText = await response.text();
          results.userCreation = {
            success: false,
            error: errorText,
            message: 'Falha na criação do usuário'
          };
        }
      } catch (error) {
        results.userCreation = {
          success: false,
          error: error.message,
          message: 'Erro na requisição de criação'
        };
      }

      // Test health endpoint
      try {
        const healthResponse = await fetch('/api/auth/health', {
          headers: { 'Accept': 'application/json' }
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          results.persistence = healthData.realDataPersistence;
        }
      } catch (error) {
        console.warn('Health check failed:', error);
      }

      // Test debug endpoint
      try {
        const debugResponse = await fetch('/api/auth/debug-data', {
          headers: { 'Accept': 'application/json' }
        });
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          results.supabaseAttempt = debugData.stats;
        }
      } catch (error) {
        console.warn('Debug check failed:', error);
      }

      setTestResults(results);
    } catch (error) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (success === false) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === true) return <Badge variant="default" className="bg-green-500">Sucesso</Badge>;
    if (success === false) return <Badge variant="destructive">Falha</Badge>;
    return <Badge variant="secondary">Desconhecido</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        <Card className="border-blue-500/20 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Database className="h-6 w-6" />
              Sistema de Persistência de Dados Reais v4.0
            </CardTitle>
            <CardDescription className="text-slate-300">
              Teste o sistema de criação e persistência de dados reais no Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sistema Real:</strong> Este teste cria dados reais que são persistidos 
                localmente e tentam sincronizar com o Supabase quando possível.
              </AlertDescription>
            </Alert>

            {/* Configuração do Teste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData({...testData, email: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Usuário</Label>
                <Input
                  id="name"
                  value={testData.name}
                  onChange={(e) => setTestData({...testData, name: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={testData.password}
                  onChange={(e) => setTestData({...testData, password: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Nome da Organização</Label>
                <Input
                  id="organization"
                  value={testData.organizationName}
                  onChange={(e) => setTestData({...testData, organizationName: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>

            <Button 
              onClick={runRealDataTest} 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-run-test"
            >
              {isLoading ? 'Executando Teste...' : 'Executar Teste de Dados Reais'}
            </Button>

            {/* Resultados do Teste */}
            {testResults && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-400">Resultados do Teste</h3>
                
                {/* Status de Criação do Usuário */}
                <Card className="border-slate-600 bg-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getStatusIcon(testResults.userCreation?.success)}
                      <User className="h-5 w-5" />
                      Criação de Usuário
                      {getStatusBadge(testResults.userCreation?.success)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {testResults.userCreation?.success ? (
                      <div className="space-y-2">
                        <p className="text-green-400">✅ {testResults.userCreation.message}</p>
                        {testResults.userCreation.user && (
                          <div className="bg-slate-800 p-3 rounded text-sm">
                            <p><strong>ID:</strong> {testResults.userCreation.user.id}</p>
                            <p><strong>Email:</strong> {testResults.userCreation.user.email}</p>
                            <p><strong>Nome:</strong> {testResults.userCreation.user.name}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-red-400">❌ {testResults.userCreation?.message}</p>
                        <div className="bg-slate-800 p-3 rounded text-sm text-red-300">
                          {testResults.userCreation?.error}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status de Criação da Organização */}
                {testResults.userCreation?.organization && (
                  <Card className="border-slate-600 bg-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Building className="h-5 w-5" />
                        Criação de Organização
                        <Badge variant="default" className="bg-green-500">Sucesso</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-slate-800 p-3 rounded text-sm">
                        <p><strong>ID:</strong> {testResults.userCreation.organization.id}</p>
                        <p><strong>Nome:</strong> {testResults.userCreation.organization.name}</p>
                        <p><strong>Slug:</strong> {testResults.userCreation.organization.slug}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Estatísticas de Persistência */}
                {testResults.persistence && (
                  <Card className="border-slate-600 bg-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Database className="h-5 w-5" />
                        Estatísticas de Persistência
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-2xl font-bold text-blue-400">{testResults.persistence.localUsers}</div>
                          <div className="text-sm text-slate-400">Usuários Locais</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-2xl font-bold text-green-400">{testResults.persistence.localOrganizations}</div>
                          <div className="text-sm text-slate-400">Organizações Locais</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-2xl font-bold text-green-400">{testResults.persistence.supabaseStatus?.success || 0}</div>
                          <div className="text-sm text-slate-400">Supabase Sucesso</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-2xl font-bold text-red-400">{testResults.persistence.supabaseStatus?.failed || 0}</div>
                          <div className="text-sm text-slate-400">Supabase Falha</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-sm text-slate-400">
                  Teste executado em: {new Date(testResults.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}