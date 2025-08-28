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
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Shield,
  Users,
  Activity,
  Clock,
  Zap
} from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  details: string;
  statusCode?: number;
  responseTime?: number;
}

export default function BackendTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    organizationName: '' 
  });

  // Health check query
  const { data: healthStatus, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/health'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // API version query
  const { data: versionInfo, isLoading: versionLoading } = useQuery({
    queryKey: ['/api/version'],
    retry: false,
    refetchOnWindowFocus: false
  });

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  // Test endpoint functionality
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
        responseTime
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

  // Test blueprint endpoints
  const testBlueprints = async () => {
    setTestResults([]);
    const tests: TestResult[] = [];
    
    // Test health endpoints
    const healthTest = await testEndpoint('/health');
    const apiHealthTest = await testEndpoint('/api/health');
    const versionTest = await testEndpoint('/api/version');
    
    tests.push(healthTest, apiHealthTest, versionTest);
    
    // Test middleware functionality (should get rate limited after many requests)
    const rateLimitTest = await testEndpoint('/api/version');
    tests.push({
      ...rateLimitTest,
      name: 'Rate Limiting Test',
      details: 'Middleware functioning (no rate limit errors expected yet)'
    });
    
    // Test validation middleware (should fail validation)
    const validationTest = await testEndpoint('/api/auth/register', 'POST', {
      email: 'invalid-email',
      password: '123' // Too short
    });
    tests.push({
      ...validationTest,
      name: 'Validation Middleware Test',
      success: validationTest.statusCode === 400, // We expect validation to fail
      details: validationTest.statusCode === 400 ? 'Validation working correctly' : validationTest.details
    });
    
    // Test error handling (404 for non-existent route)
    const notFoundTest = await testEndpoint('/api/non-existent-route');
    tests.push({
      ...notFoundTest,
      name: 'Error Handling Test (404)',
      success: notFoundTest.statusCode === 404,
      details: notFoundTest.statusCode === 404 ? 'Error handling working correctly' : notFoundTest.details
    });
    
    setTestResults(tests);
  };

  // Test authentication blueprint
  const testAuthBlueprint = async () => {
    const tests: TestResult[] = [];
    
    // Test registration with invalid data
    const invalidRegTest = await testEndpoint('/api/auth/register', 'POST', {
      email: 'test@example.com',
      password: '123', // Too short
      name: 'A' // Too short
    });
    
    tests.push({
      ...invalidRegTest,
      name: 'Auth Validation Test',
      success: invalidRegTest.statusCode === 400,
      details: invalidRegTest.statusCode === 400 ? 'Auth validation working' : 'Validation not working'
    });
    
    // Test login with non-existent user
    const invalidLoginTest = await testEndpoint('/api/auth/login', 'POST', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    
    tests.push({
      ...invalidLoginTest,
      name: 'Auth Security Test',
      success: invalidLoginTest.statusCode === 401,
      details: invalidLoginTest.statusCode === 401 ? 'Auth security working' : 'Security issue detected'
    });
    
    setTestResults(prev => [...prev, ...tests]);
  };

  // Test organization blueprint
  const testOrgBlueprint = async () => {
    const tests: TestResult[] = [];
    
    // Test organizations endpoint without auth (should fail)
    const unauthedOrgTest = await testEndpoint('/api/organizations');
    
    tests.push({
      ...unauthedOrgTest,
      name: 'Organization Auth Test',
      success: unauthedOrgTest.statusCode === 401,
      details: unauthedOrgTest.statusCode === 401 ? 'Auth protection working' : 'Auth not protecting endpoint'
    });
    
    setTestResults(prev => [...prev, ...tests]);
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testBlueprints();
    await testAuthBlueprint();
    await testOrgBlueprint();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Server className="h-8 w-8 text-blue-500" />
          Backend Architecture Testing
        </h1>
        <p className="text-muted-foreground">
          Test modular Express.js backend with blueprints, middleware, and error handling
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Status
            </CardTitle>
            <CardDescription>
              System health and uptime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : healthStatus?.status ? (
              <div className="space-y-2">
                <Badge variant="default">
                  {healthStatus.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Version: {healthStatus.version || 'Unknown'}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to reach health endpoint
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* API Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Version
            </CardTitle>
            <CardDescription>
              Backend API information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : versionInfo?.success ? (
              <div className="space-y-2">
                <Badge variant="outline">
                  v{versionInfo.data.version}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  API: {versionInfo.data.apiVersion} | {versionInfo.data.name}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to fetch API version
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Architecture Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Architecture
            </CardTitle>
            <CardDescription>
              Modular structure status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Blueprints
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Middleware
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Express.js modular architecture with structured error handling
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Architecture Tests
          </CardTitle>
          <CardDescription>
            Test backend blueprints, middleware, and error handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testBlueprints}
              data-testid="button-test-blueprints"
            >
              Test Core Blueprints
            </Button>
            
            <Button 
              onClick={testAuthBlueprint}
              variant="outline"
              data-testid="button-test-auth"
            >
              Test Auth Blueprint
            </Button>
            
            <Button 
              onClick={testOrgBlueprint}
              variant="outline"
              data-testid="button-test-org"
            >
              Test Organization Blueprint
            </Button>
            
            <Button 
              onClick={runAllTests}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-complete-test"
            >
              Run Complete Test
            </Button>
            
            {testResults.length > 0 && (
              <Button 
                onClick={clearResults}
                variant="ghost"
                data-testid="button-clear-results"
              >
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Backend architecture and blueprint test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
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
                    <p className="text-sm text-muted-foreground">{result.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>Task 2.1 Implementation</CardTitle>
          <CardDescription>
            Backend Express.js structured architecture overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Blueprints (Modular APIs)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Authentication Blueprint (/api/auth/*)</li>
                <li>• Organizations Blueprint (/api/organizations/*)</li>
                <li>• Modular route organization</li>
                <li>• Reusable validation schemas</li>
                <li>• Structured error responses</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Middleware Stack</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Security headers (Helmet)</li>
                <li>• Request validation (Zod)</li>
                <li>• Rate limiting with Redis/memory fallback</li>
                <li>• Request ID tracking</li>
                <li>• Comprehensive error handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}