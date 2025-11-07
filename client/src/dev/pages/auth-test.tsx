// client/src/pages/auth-test.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function AuthTestPage() {
  const [email, setEmail] = useState('auth-local@automation.global');
  const [password, setPassword] = useState('123456');
  const [firstName, setFirstName] = useState('Test User');
  const [accessToken, setAccessToken] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const makeRequest = async (url: string, method: string = 'GET', body?: any, token?: string) => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));

      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
          variant: "default"
        });

        // Se for login ou registro, salvar token
        if (data.data?.accessToken) {
          setAccessToken(data.data.accessToken);
        }
      } else {
        toast({
          title: "Erro",
          description: data.message || 'Erro desconhecido',
          variant: "destructive"
        });
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Erro de conexão';
      setResponse(`Erro: ${errorMsg}`);
      toast({
        title: "Erro de Conexão",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    makeRequest('/api/auth/local/register', 'POST', {
      email,
      password,
      firstName
    });
  };

  const handleLogin = () => {
    makeRequest('/api/auth/local/login', 'POST', {
      email,
      password
    });
  };

  const handleTestAuth = () => {
    if (!accessToken) {
      toast({
        title: "Token Necessário",
        description: "Faça login primeiro para obter um token",
        variant: "destructive"
      });
      return;
    }
    makeRequest('/api/auth/local/test-auth', 'GET', undefined, accessToken);
  };

  const handleAuthStatus = () => {
    makeRequest('/api/auth/v2/status');
  };

  const handleGetMe = () => {
    if (!accessToken) {
      toast({
        title: "Token Necessário",
        description: "Faça login primeiro para obter um token",
        variant: "destructive"
      });
      return;
    }
    makeRequest('/api/auth/v2/me', 'GET', undefined, accessToken);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Sistema de Autenticação - Teste Completo
          </h1>
          <p className="text-gray-300">
            Testando Auth V2, Auth Local, JWT Tokens e Middleware
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Controle */}
          <div className="space-y-6">
            {/* Dados de Teste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">Input</Badge>
                  Dados de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="senha"
                    data-testid="input-password"
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nome"
                    data-testid="input-firstname"
                  />
                </div>
                <div>
                  <Label>Token Atual</Label>
                  <Textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Access Token (gerado após login)"
                    rows={3}
                    data-testid="textarea-token"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ações de Autenticação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">Auth Actions</Badge>
                  Ações de Autenticação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleRegister}
                    disabled={isLoading}
                    variant="outline"
                    data-testid="button-register"
                  >
                    Registrar
                  </Button>
                  <Button 
                    onClick={handleLogin}
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    Login
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={handleTestAuth}
                    disabled={isLoading || !accessToken}
                    variant="secondary"
                    data-testid="button-test-auth"
                  >
                    Testar Autenticação JWT
                  </Button>
                  <Button 
                    onClick={handleGetMe}
                    disabled={isLoading || !accessToken}
                    variant="secondary"
                    data-testid="button-get-me"
                  >
                    Obter Dados do Usuário
                  </Button>
                  <Button 
                    onClick={handleAuthStatus}
                    disabled={isLoading}
                    variant="outline"
                    data-testid="button-auth-status"
                  >
                    Status do Sistema
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Token */}
            {accessToken && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">JWT</Badge>
                    Token Ativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded break-all">
                    {accessToken.substring(0, 50)}...
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Token JWT válido por 1 hora. Use este token para acessar rotas protegidas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Painel de Resposta */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="destructive">Response</Badge>
                  Resposta da API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={response}
                  readOnly
                  placeholder="Resposta da API aparecerá aqui..."
                  className="h-96 font-mono text-sm"
                  data-testid="textarea-response"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Endpoints Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Endpoints de Autenticação Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Auth Local</h4>
                <ul className="text-sm space-y-1">
                  <li>POST /api/auth/local/register</li>
                  <li>POST /api/auth/local/login</li>
                  <li>GET /api/auth/local/test-auth</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Auth V2</h4>
                <ul className="text-sm space-y-1">
                  <li>POST /api/auth/v2/register</li>
                  <li>POST /api/auth/v2/login</li>
                  <li>GET /api/auth/v2/me</li>
                  <li>GET /api/auth/v2/status</li>
                  <li>POST /api/auth/v2/refresh</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">Database</h4>
                <ul className="text-sm space-y-1">
                  <li>POST /api/drizzle/create-user</li>
                  <li>GET /api/drizzle/health</li>
                  <li>POST /api/supabase/create-user</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}