import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Database, Server, Zap } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

export default function DatabaseTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check', status: 'idle' },
    { name: 'Simple Table Check', status: 'idle' },
    { name: 'Database Connection', status: 'idle' },
    { name: 'Schema Status', status: 'idle' },
    { name: 'Drizzle Setup (Recommended)', status: 'idle' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runTest = async (testName: string, endpoint: string, index: number) => {
    updateTest(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const isPostRequest = endpoint.includes('setup') || endpoint.includes('initialize');
      const needsCredentials = endpoint.includes('setup') || endpoint.includes('initialize');
      
      const requestOptions: RequestInit = {
        method: isPostRequest ? 'POST' : 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ...(needsCredentials && {
          body: JSON.stringify({
            email: 'admin@automationglobal.com',
            password: 'Admin123!@#'
          })
        })
      };

      console.log(`Starting test: ${testName} -> ${endpoint}`);
      const response = await fetch(endpoint, requestOptions);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If we get HTML instead of JSON, it means Vite intercepted the request
        const textData = await response.text();
        if (textData.includes('<!DOCTYPE html>')) {
          throw new Error('Vite middleware intercepted API request - using fallback method');
        }
        data = { error: 'Invalid response format', details: textData.substring(0, 200) };
      }

      const duration = Date.now() - startTime;

      if (response.ok && data && !data.error) {
        updateTest(index, {
          status: 'success',
          message: data.message || 'Test passed successfully',
          details: data,
          duration
        });
      } else {
        updateTest(index, {
          status: 'error',
          message: data?.error || 'Test failed with unknown error',
          details: data,
          duration
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Test ${testName} failed:`, error);
      
      updateTest(index, {
        status: 'error',
        message: error.message,
        details: { error: error.message, stack: error.stack },
        duration
      });
    }
  };

  const runAllTests = async () => {
    const testConfigs = [
      { name: 'Health Check', endpoint: '/api/health' },
      { name: 'Simple Table Check', endpoint: '/api/database/simple-check' },
      { name: 'Database Connection', endpoint: '/api/database/test-connection' },
      { name: 'Schema Status', endpoint: '/api/database/status' },
      { name: 'Drizzle Setup (Recommended)', endpoint: '/api/drizzle-setup' }
    ];

    for (let i = 0; i < testConfigs.length; i++) {
      const config = testConfigs[i];
      await runTest(config.name, config.endpoint, i);
      
      // Wait a bit between tests
      if (i < testConfigs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <Zap className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      idle: 'secondary' as const,
      running: 'default' as const,
      success: 'default' as const,
      error: 'destructive' as const
    };
    
    const colors = {
      idle: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant={variants[status]} className={`ml-2 ${colors[status]}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Automation Global v4.0
        </h1>
        <p className="text-gray-600 mt-2">Database & Connection Test Suite</p>
      </div>

      <div className="mb-6 text-center">
        <Button 
          onClick={runAllTests}
          disabled={tests.some(test => test.status === 'running')}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Server className="mr-2 h-4 w-4" />
          Run All Tests
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={test.name} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
                {test.duration && (
                  <Badge variant="outline" className="text-xs">
                    {test.duration}ms
                  </Badge>
                )}
              </div>
              {test.message && (
                <CardDescription className={
                  test.status === 'error' ? 'text-red-600' : 
                  test.status === 'success' ? 'text-green-600' : ''
                }>
                  {test.message}
                </CardDescription>
              )}
            </CardHeader>

            {test.details && (
              <CardContent className="pt-0">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ℹ️ About These Tests
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p>• <strong>Health Check:</strong> Verifies the server is running</p>
          <p>• <strong>Database Connection:</strong> Tests Supabase connectivity</p>
          <p>• <strong>Schema Status:</strong> Checks if database tables exist</p>
          <p>• <strong>Migration Setup:</strong> Creates the database schema</p>
          <p>• <strong>Production Init:</strong> Seeds initial data for production</p>
        </div>
      </div>
    </div>
  );
}