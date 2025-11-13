import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, Lock, Users, Database } from 'lucide-react';

interface SecurityTest {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface SecurityStatus {
  rls_enabled: boolean;
  policies_count: number;
  organization_isolation: boolean;
  role_based_access: boolean;
  security_functions: number;
  last_updated: string;
  status: string;
}

export default function SecurityTest() {
  const [testResults, setTestResults] = useState<SecurityTest[]>([]);
  const queryClient = useQueryClient();

  // Query security status
  const { data: securityStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/security/status'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Apply security policies mutation
  const applyPoliciesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/security/apply-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => [...prev, {
        name: 'Security Policies Applied',
        status: data.success ? 'success' : 'error',
        message: data.message,
        details: data.appliedPolicies ? `Applied: ${data.appliedPolicies.join(', ')}` : undefined
      }]);
      queryClient.invalidateQueries({ queryKey: ['/api/security/status'] });
    },
    onError: (error: any) => {
      setTestResults(prev => [...prev, {
        name: 'Apply Security Policies',
        status: 'error',
        message: error.message,
        details: 'Failed to apply RLS policies to database'
      }]);
    }
  });

  // Validate security policies mutation
  const validatePoliciesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/security/validate');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tests && data.tests.length > 0) {
        const formattedTests = data.tests.map((test: any) => ({
          name: test.name,
          status: test.status,
          message: test.message,
          details: test.details
        }));
        setTestResults(prev => [...prev, ...formattedTests]);
      } else {
        setTestResults(prev => [...prev, {
          name: 'Security Validation',
          status: data.success ? 'success' : 'error',
          message: data.message
        }]);
      }
    },
    onError: (error: any) => {
      setTestResults(prev => [...prev, {
        name: 'Security Validation',
        status: 'error',
        message: error.message,
        details: 'Failed to validate security policies'
      }]);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const runCompleteSecurityTest = async () => {
    setTestResults([]);
    
    // Apply policies first
    await applyPoliciesMutation.mutateAsync();
    
    // Then validate them
    await validatePoliciesMutation.mutateAsync();
    
    // Refresh status
    await refetchStatus();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-500" />
          Security & RLS Testing
        </h1>
        <p className="text-muted-foreground">
          Test and validate Row Level Security policies and multi-tenant isolation
        </p>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Current state of Row Level Security and access policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading security status...</span>
            </div>
          ) : securityStatus?.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm font-medium">RLS Status</span>
                  </div>
                  <Badge variant={securityStatus.security?.rls_enabled ? "default" : "destructive"}>
                    {securityStatus.security?.rls_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Policies</span>
                  </div>
                  <Badge variant="secondary">
                    {securityStatus.security?.policies_count || 0} Active
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Isolation</span>
                  </div>
                  <Badge variant={securityStatus.security?.organization_isolation ? "default" : "destructive"}>
                    {securityStatus.security?.organization_isolation ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Last updated: {securityStatus.security?.last_updated ? 
                  new Date(securityStatus.security.last_updated).toLocaleString() : 
                  'Never'
                }
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to load security status. {securityStatus?.error || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Tests
          </CardTitle>
          <CardDescription>
            Apply and validate Row Level Security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => applyPoliciesMutation.mutate()}
              disabled={applyPoliciesMutation.isPending}
              data-testid="button-apply-policies"
            >
              {applyPoliciesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Security Policies'
              )}
            </Button>
            
            <Button 
              onClick={() => validatePoliciesMutation.mutate()}
              disabled={validatePoliciesMutation.isPending}
              variant="outline"
              data-testid="button-validate-policies"
            >
              {validatePoliciesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Policies'
              )}
            </Button>
            
            <Button 
              onClick={runCompleteSecurityTest}
              disabled={applyPoliciesMutation.isPending || validatePoliciesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-complete-security-test"
            >
              {(applyPoliciesMutation.isPending || validatePoliciesMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Complete Security Test'
              )}
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
              Results from security policy tests and validation
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
                    {result.details && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {result.details}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Policy Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Security Architecture</CardTitle>
          <CardDescription>
            Overview of implemented security policies and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Organization Isolation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Users can only access data from their organizations</li>
                <li>• Cross-organization data access is blocked</li>
                <li>• AI usage logs are organization-scoped</li>
                <li>• All module data inherits organization context</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Role-Based Access</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Super Admin: Platform-wide access</li>
                <li>• Owner: Full organization control</li>
                <li>• Admin: Organization management</li>
                <li>• Manager/Editor/Viewer: Limited access</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Data Protection</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All tables have Row Level Security enabled</li>
                <li>• Policies enforce multi-tenant isolation</li>
                <li>• Security functions validate access rights</li>
                <li>• Audit trails track all data access</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">System Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• API keys are organization-scoped</li>
                <li>• Webhooks require admin permissions</li>
                <li>• Automation access is role-restricted</li>
                <li>• System notifications are globally visible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}