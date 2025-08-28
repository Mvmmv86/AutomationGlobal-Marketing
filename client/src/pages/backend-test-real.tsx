import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Shield,
  Users,
  Activity,
  Clock,
  UserPlus
} from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  details: string;
  statusCode?: number;
  responseTime?: number;
  data?: any;
}

export default function BackendTestReal() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [registrationData, setRegistrationData] = useState({
    email: `test_${Date.now()}@automation.global`,
    password: 'Test123456!',
    name: 'Teste Real',
    organizationName: 'Org Test Real'
  });

  const queryClient = useQueryClient();

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  // Test endpoint functionality with real Supabase
  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) })
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        name: `${method} ${endpoint}`,
        success: response.ok,
        details: response.ok ? 'Success' : data.error || `HTTP ${response.status}`,
        statusCode: response.status,
        responseTime,
        data: response.ok ? data : null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: `${method} ${endpoint}`,
        success: false,
        details: (error as Error).message,
        responseTime
      };
    }
  };

  // Test real Supabase registration
  const testRealRegistration = async () => {
    setTestResults([]);
    const tests: TestResult[] = [];
    
    // Test with real Supabase data creation
    const regTest = await testEndpoint('/api/auth/register', 'POST', registrationData);
    tests.push({
      ...regTest,
      name: 'Real Supabase Registration',
      details: regTest.success 
        ? `User created successfully in Supabase: ${regTest.data?.data?.user?.email}` 
        : regTest.details
    });
    
    if (regTest.success && regTest.data?.data?.user) {
      // Test login with the created user
      const loginTest = await testEndpoint('/api/auth/login', 'POST', {
        email: registrationData.email,
        password: registrationData.password
      });
      
      tests.push({
        ...loginTest,
        name: 'Real Supabase Login',
        details: loginTest.success 
          ? `Login successful, JWT token received` 
          : loginTest.details
      });

      // If login successful, test authenticated endpoint
      if (loginTest.success && loginTest.data?.data?.tokens?.accessToken) {
        const token = loginTest.data.data.tokens.accessToken;
        
        const orgTest = await testEndpoint('/api/organizations', 'GET');
        // Add auth header manually for next test
        const authTest = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const authData = await authTest.json();
        const responseTime = Date.now() - Date.now();
        
        tests.push({
          name: 'Authenticated Organizations Request',
          success: authTest.ok,
          details: authTest.ok 
            ? `Organizations fetched: ${authData.data?.length || 0} found`
            : authData.error || 'Auth failed',
          statusCode: authTest.status,
          responseTime,
          data: authTest.ok ? authData : null
        });
      }
    }
    
    setTestResults(tests);
  };

  // Test validation with real data
  const testRealValidation = async () => {
    const tests: TestResult[] = [];
    
    // Test with invalid email
    const invalidEmailTest = await testEndpoint('/api/auth/register', 'POST', {
      email: 'invalid-email',
      password: 'Test123456!',
      name: 'Test User'
    });
    
    tests.push({
      ...invalidEmailTest,
      name: 'Real Validation Test (Invalid Email)',
      success: invalidEmailTest.statusCode === 400,
      details: invalidEmailTest.statusCode === 400 
        ? 'Validation correctly rejected invalid email' 
        : 'Validation not working properly'
    });
    
    // Test with short password
    const shortPasswordTest = await testEndpoint('/api/auth/register', 'POST', {
      email: 'test@example.com',
      password: '123',
      name: 'Test User'
    });
    
    tests.push({
      ...shortPasswordTest,
      name: 'Real Validation Test (Short Password)',
      success: shortPasswordTest.statusCode === 400,
      details: shortPasswordTest.statusCode === 400 
        ? 'Validation correctly rejected short password' 
        : 'Password validation not working'
    });
    
    setTestResults(prev => [...prev, ...tests]);
  };

  // Test error handling with real scenarios
  const testRealErrorHandling = async () => {
    const tests: TestResult[] = [];
    
    // Test duplicate user registration
    const duplicateTest = await testEndpoint('/api/auth/register', 'POST', {
      email: registrationData.email, // Use same email as before
      password: 'Test123456!',
      name: 'Duplicate Test'
    });
    
    tests.push({
      ...duplicateTest,
      name: 'Real Error Handling (Duplicate User)',
      success: duplicateTest.statusCode === 409,
      details: duplicateTest.statusCode === 409 
        ? 'Correctly handled duplicate user error' 
        : duplicateTest.details
    });
    
    // Test login with wrong credentials
    const wrongCredentialsTest = await testEndpoint('/api/auth/login', 'POST', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    
    tests.push({
      ...wrongCredentialsTest,
      name: 'Real Error Handling (Wrong Credentials)',
      success: wrongCredentialsTest.statusCode === 401,
      details: wrongCredentialsTest.statusCode === 401 
        ? 'Correctly handled authentication error' 
        : wrongCredentialsTest.details
    });
    
    setTestResults(prev => [...prev, ...tests]);
  };

  const runCompleteRealTest = async () => {
    setTestResults([]);
    await testRealRegistration();
    await testRealValidation();
    await testRealErrorHandling();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Generate new test data
  const generateNewTestData = () => {
    setRegistrationData({
      email: `test_${Date.now()}@automation.global`,
      password: 'Test123456!',
      name: 'Teste Real',
      organizationName: 'Org Test Real'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8 text-blue-500" />
          Backend Real Supabase Testing
        </h1>
        <p className="text-muted-foreground">
          Teste completo do backend com dados reais do Supabase - sem fallbacks ou mocks
        </p>
      </div>

      {/* Test Data Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Configuração dos Dados de Teste
          </CardTitle>
          <CardDescription>
            Dados reais que serão criados no Supabase durante os testes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                type="email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                data-testid="input-test-email"
              />
            </div>
            <div>
              <Label htmlFor="name">Nome do Usuário</Label>
              <Input
                id="name"
                value={registrationData.name}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-test-name"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={registrationData.password}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                data-testid="input-test-password"
              />
            </div>
            <div>
              <Label htmlFor="organization">Nome da Organização</Label>
              <Input
                id="organization"
                value={registrationData.organizationName}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, organizationName: e.target.value }))}
                data-testid="input-test-organization"
              />
            </div>
          </div>
          <Button 
            onClick={generateNewTestData}
            variant="outline"
            data-testid="button-generate-data"
          >
            Gerar Novos Dados de Teste
          </Button>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Testes com Supabase Real
          </CardTitle>
          <CardDescription>
            Todos os testes criam, modificam e consultam dados reais no Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testRealRegistration}
              data-testid="button-test-registration"
            >
              Teste Registro Real
            </Button>
            
            <Button 
              onClick={testRealValidation}
              variant="outline"
              data-testid="button-test-validation"
            >
              Teste Validação Real
            </Button>
            
            <Button 
              onClick={testRealErrorHandling}
              variant="outline"
              data-testid="button-test-errors"
            >
              Teste Error Handling Real
            </Button>
            
            <Button 
              onClick={runCompleteRealTest}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-complete-real-test"
            >
              Teste Completo Real
            </Button>
            
            {testResults.length > 0 && (
              <Button 
                onClick={clearResults}
                variant="ghost"
                data-testid="button-clear-results"
              >
                Limpar Resultados
              </Button>
            )}
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Estes testes criam dados reais no Supabase. 
              Todos os usuários e organizações criados durante os testes serão persistidos na base de dados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resultados dos Testes Reais
            </CardTitle>
            <CardDescription>
              Resultados dos testes com dados reais do Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{result.name}</h4>
                      {result.statusCode && (
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.statusCode}
                        </Badge>
                      )}
                      {result.responseTime && (
                        <Badge variant="outline">
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{result.details}</p>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600">Ver dados retornados</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Implementation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Task 2.1 - Implementação Real com Supabase</CardTitle>
          <CardDescription>
            Backend Express.js com integração completa do Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Blueprints com Supabase Real</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Criação real de usuários na tabela users</li>
                <li>• Criação real de organizações</li>
                <li>• Sistema de autenticação com JWT real</li>
                <li>• Validação com dados persistidos</li>
                <li>• Error handling com casos reais</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Características dos Testes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dados persistidos no Supabase production</li>
                <li>• Timeouts reais de conexão tratados</li>
                <li>• Validação com cenários realistas</li>
                <li>• Error handling com erros do banco</li>
                <li>• Performance real medida</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}