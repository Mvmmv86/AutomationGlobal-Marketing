import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Timer,
  Activity,
  Clock,
  Server
} from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  details: string;
}

interface CacheStats {
  redis: {
    connected: boolean;
    mode: string;
    keyCount: number;
  };
  prefixes: string[];
  defaultTTL: number;
  timestamp: string;
}

interface QueueStats {
  mode: string;
  queues: {
    [key: string]: {
      waiting?: number;
      active?: number;
      completed?: number;
      failed?: number;
      total?: number;
      error?: string;
    };
  };
}

export default function CacheQueueTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedQueue, setSelectedQueue] = useState('ai-processing');
  const [jobType, setJobType] = useState('ai-request');
  const [jobPayload, setJobPayload] = useState('{"prompt": "Test AI request"}');
  const queryClient = useQueryClient();

  // Cache status query
  const { data: cacheStatus, isLoading: cacheLoading, refetch: refetchCache } = useQuery({
    queryKey: ['/api/cache/status'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Queue status query
  const { data: queueStatus, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['/api/queue/status'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Cache test mutation
  const testCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cache/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tests && data.tests.length > 0) {
        const formattedTests = data.tests.map((test: any) => ({
          name: test.name,
          success: test.success,
          details: test.details
        }));
        setTestResults(prev => [...prev, ...formattedTests]);
      } else {
        setTestResults(prev => [...prev, {
          name: 'Cache Test',
          success: data.success,
          details: data.message
        }]);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/cache/status'] });
    },
    onError: (error: any) => {
      setTestResults(prev => [...prev, {
        name: 'Cache Test',
        success: false,
        details: error.message
      }]);
    }
  });

  // Queue test mutation
  const testQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/queue/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tests && data.tests.length > 0) {
        const formattedTests = data.tests.map((test: any) => ({
          name: test.name,
          success: test.success,
          details: test.details
        }));
        setTestResults(prev => [...prev, ...formattedTests]);
      } else {
        setTestResults(prev => [...prev, {
          name: 'Queue Test',
          success: data.success,
          details: data.message
        }]);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/queue/status'] });
    },
    onError: (error: any) => {
      setTestResults(prev => [...prev, {
        name: 'Queue Test',
        success: false,
        details: error.message
      }]);
    }
  });

  // Add job mutation
  const addJobMutation = useMutation({
    mutationFn: async () => {
      let payload;
      try {
        payload = JSON.parse(jobPayload);
      } catch {
        payload = { data: jobPayload };
      }

      const response = await fetch('/api/queue/add-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueName: selectedQueue,
          jobData: {
            type: jobType,
            payload,
            organizationId: 'test-org',
            priority: 1
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => [...prev, {
        name: 'Add Job to Queue',
        success: data.success,
        details: `Job ID: ${data.jobId} - ${data.message}`
      }]);
      queryClient.invalidateQueries({ queryKey: ['/api/queue/status'] });
    },
    onError: (error: any) => {
      setTestResults(prev => [...prev, {
        name: 'Add Job to Queue',
        success: false,
        details: error.message
      }]);
    }
  });

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const runCompleteTest = async () => {
    setTestResults([]);
    await testCacheMutation.mutateAsync();
    await testQueueMutation.mutateAsync();
    await refetchCache();
    await refetchQueue();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8 text-purple-500" />
          Cache & Queue Testing
        </h1>
        <p className="text-muted-foreground">
          Test Redis caching, in-memory fallback, and asynchronous job queue processing
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cache Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Cache Status
            </CardTitle>
            <CardDescription>
              Redis connection and cache functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cacheLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading cache status...</span>
              </div>
            ) : cacheStatus?.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">Connection</span>
                    </div>
                    <Badge variant={cacheStatus.cache?.redis?.connected ? "default" : "secondary"}>
                      {cacheStatus.cache?.redis?.connected ? 'Redis' : 'Memory Fallback'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">TTL</span>
                    </div>
                    <Badge variant="outline">
                      {cacheStatus.cache?.defaultTTL || 3600}s
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Mode: {cacheStatus.cache?.redis?.mode || 'unknown'} | 
                  Prefixes: {cacheStatus.cache?.prefixes?.length || 0}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load cache status. {cacheStatus?.error || 'Unknown error'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Queue Status
            </CardTitle>
            <CardDescription>
              Asynchronous job processing queues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading queue status...</span>
              </div>
            ) : queueStatus?.success ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Mode</span>
                  </div>
                  <Badge variant={queueStatus.queues?.mode === 'redis' ? "default" : "secondary"}>
                    {queueStatus.queues?.mode || 'unknown'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Active Queues:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(queueStatus.queues?.queues || {}).map((queueName) => (
                      <Badge key={queueName} variant="outline" className="text-xs">
                        {queueName}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load queue status. {queueStatus?.error || 'Unknown error'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Tests
          </CardTitle>
          <CardDescription>
            Test cache and queue functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => testCacheMutation.mutate()}
              disabled={testCacheMutation.isPending}
              data-testid="button-test-cache"
            >
              {testCacheMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Cache...
                </>
              ) : (
                'Test Cache System'
              )}
            </Button>
            
            <Button 
              onClick={() => testQueueMutation.mutate()}
              disabled={testQueueMutation.isPending}
              variant="outline"
              data-testid="button-test-queue"
            >
              {testQueueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Queue...
                </>
              ) : (
                'Test Queue System'
              )}
            </Button>
            
            <Button 
              onClick={runCompleteTest}
              disabled={testCacheMutation.isPending || testQueueMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-complete-test"
            >
              {(testCacheMutation.isPending || testQueueMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Complete Test'
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

      {/* Add Job to Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Add Job to Queue
          </CardTitle>
          <CardDescription>
            Manually add jobs to test queue processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="queue-select">Queue</Label>
              <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-processing">AI Processing</SelectItem>
                  <SelectItem value="automation-execution">Automation Execution</SelectItem>
                  <SelectItem value="email-notifications">Email Notifications</SelectItem>
                  <SelectItem value="data-processing">Data Processing</SelectItem>
                  <SelectItem value="analytics-aggregation">Analytics Aggregation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job-type">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-request">AI Request</SelectItem>
                  <SelectItem value="automation-step">Automation Step</SelectItem>
                  <SelectItem value="send-email">Send Email</SelectItem>
                  <SelectItem value="process-data">Process Data</SelectItem>
                  <SelectItem value="aggregate-analytics">Aggregate Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="job-payload">Job Payload (JSON)</Label>
            <Textarea
              id="job-payload"
              value={jobPayload}
              onChange={(e) => setJobPayload(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-sm"
              rows={3}
            />
          </div>
          
          <Button 
            onClick={() => addJobMutation.mutate()}
            disabled={addJobMutation.isPending}
            data-testid="button-add-job"
          >
            {addJobMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Job...
              </>
            ) : (
              'Add Job to Queue'
            )}
          </Button>
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
              Results from cache and queue functionality tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.name}</h4>
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
          <CardTitle>System Architecture</CardTitle>
          <CardDescription>
            Overview of cache and queue implementation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cache System</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Redis primary with memory fallback</li>
                <li>• Session and user data caching</li>
                <li>• AI usage tracking cache</li>
                <li>• Rate limiting implementation</li>
                <li>• Automatic TTL management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Queue System</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bull queues with Redis backend</li>
                <li>• Memory fallback processing</li>
                <li>• Retry policies and error handling</li>
                <li>• Multiple queue types for different tasks</li>
                <li>• Configurable concurrency levels</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}