import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, Users, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DatabaseStatus {
  connected: boolean;
  tablesCount: number;
  tables: string[];
  error?: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function DatabaseConnectionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Test database connection
  const { data: dbStatus, isLoading: dbLoading, refetch: refetchDB } = useQuery<DatabaseStatus>({
    queryKey: ['/api/database/status'],
    retry: 3,
    retryDelay: 2000
  });

  // Test Task 1 functionality (User & Organization Creation)
  const testTask1Mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/test/simulate-task1', {});
      return await response.json();
    },
    onSuccess: (data) => {
      addTestResult('Task 1 - Complete User & Org Creation', 'success', data.message, data);
    },
    onError: (error: any) => {
      addTestResult('Task 1 - Complete User & Org Creation', 'error', error.message || 'Failed to execute Task 1');
    }
  });

  // Test schema validation
  const validateSchemaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test/validate-schema');
      return await response.json();
    },
    onSuccess: (data) => {
      addTestResult('Schema Validation', 'success', data.message, data);
    },
    onError: (error: any) => {
      addTestResult('Schema Validation', 'error', error.message || 'Failed to validate schema');
    }
  });

  const addTestResult = (name: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { name, status, message, data }]);
  };

  const runFullTest = async () => {
    setTestResults([]);
    
    // Test 1: Database Connection
    try {
      await refetchDB();
      if (dbStatus?.connected) {
        addTestResult('Database Connection', 'success', `Connected with ${dbStatus.tablesCount} tables`);
      } else {
        addTestResult('Database Connection', 'error', dbStatus?.error || 'Connection failed - using simulation mode');
      }
    } catch (error: any) {
      addTestResult('Database Connection', 'error', error.message + ' - using simulation mode');
    }

    // Test 2: Schema Validation
    try {
      await validateSchemaMutation.mutateAsync();
    } catch (error) {
      // Error already handled in mutation
    }

    // Test 3: Task 1 Complete Test (User & Organization Creation)
    try {
      await testTask1Mutation.mutateAsync();
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-muted-foreground">
          Verify that all Supabase tables are created and functioning correctly
        </p>
      </div>

      {/* Database Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Current connection status and table verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking database connection...</span>
            </div>
          ) : dbStatus?.connected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Connected Successfully</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Found {dbStatus.tablesCount} tables in database
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {dbStatus.tables.map((table) => (
                  <Badge key={table} variant="secondary" className="text-xs">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Connection Failed</span>
              </div>
              <p className="text-sm text-red-600">
                {dbStatus?.error || 'Unable to connect to database'}
              </p>
              <Button 
                onClick={() => refetchDB()} 
                size="sm" 
                variant="outline"
                data-testid="button-retry-connection"
              >
                Retry Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Run Tests
          </CardTitle>
          <CardDescription>
            Execute comprehensive database functionality tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runFullTest}
            disabled={testTask1Mutation.isPending || validateSchemaMutation.isPending}
            data-testid="button-run-full-test"
          >
            {testTask1Mutation.isPending || validateSchemaMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Complete System Test'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Results from database functionality tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.name}</h4>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.data && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}