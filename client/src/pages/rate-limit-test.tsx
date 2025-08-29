import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Server
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface HealthMetric {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    message?: string;
    lastChecked: string;
  }>;
}

interface RateLimitStatus {
  endpoint: string;
  role: string;
  limit: number;
  remaining: number;
  resetTime: number;
  windowMs: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata: Record<string, any>;
  userId?: string;
  organizationId?: string;
  requestId?: string;
}

export default function RateLimitTestPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    data?: any;
    timestamp: string;
  }>>([]);
  
  const queryClient = useQueryClient();

  // Fetch system health
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/health'],
    retry: false
  });

  // Fetch system metrics (protected)
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/health/metrics'],
    retry: false
  });

  // Fetch rate limit status
  const { data: rateLimitData, refetch: refetchRateLimit } = useQuery({
    queryKey: ['/api/health/rate-limit'],
    retry: false
  });

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Test rate limiting
  const testRateLimit = async () => {
    addTestResult('Rate Limit Test', 'pending', 'Starting rate limit test...');
    
    try {
      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          fetch('/api/health', { method: 'GET' })
            .then(res => ({ status: res.status, headers: Object.fromEntries(res.headers.entries()) }))
        );
      }
      
      const results = await Promise.all(promises);
      const rateLimited = results.filter(r => r.status === 429);
      const successful = results.filter(r => r.status === 200);
      
      addTestResult(
        'Rate Limit Test',
        rateLimited.length > 0 ? 'success' : 'error',
        `Made 15 requests: ${successful.length} successful, ${rateLimited.length} rate limited`,
        { successful: successful.length, rateLimited: rateLimited.length, results }
      );
      
      // Refresh rate limit status
      refetchRateLimit();
      
    } catch (error) {
      addTestResult('Rate Limit Test', 'error', `Rate limit test failed: ${(error as Error).message}`);
    }
  };

  // Test API endpoints performance
  const testEndpoints = async () => {
    const endpoints = ['/api/health', '/api/health/ready', '/api/health/live'];
    
    for (const endpoint of endpoints) {
      addTestResult(`Endpoint Test: ${endpoint}`, 'pending', 'Testing endpoint...');
      
      try {
        const start = performance.now();
        const response = await fetch(endpoint);
        const duration = performance.now() - start;
        const data = await response.json();
        
        addTestResult(
          `Endpoint Test: ${endpoint}`,
          response.ok ? 'success' : 'error',
          `Response ${response.status} in ${duration.toFixed(2)}ms`,
          { status: response.status, duration, data }
        );
      } catch (error) {
        addTestResult(
          `Endpoint Test: ${endpoint}`,
          'error',
          `Failed: ${(error as Error).message}`
        );
      }
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-600';
      case 'degraded': return 'bg-yellow-600';
      case 'unhealthy': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Rate Limiting & Monitoring Test
          </h1>
          <p className="text-slate-300 mt-2">
            Task 2.5 & 2.6 Implementation - Advanced API Rate Limiting and System Monitoring
          </p>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="ratelimit" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rate Limiting
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance Tests
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Test Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System Health Overview */}
              <Card className="bg-slate-800 border-slate-700 col-span-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      System Health Overview
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Real-time system status and performance metrics
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => refetchHealth()}
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                    data-testid="button-refresh-health"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {healthLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading health data...</div>
                  ) : healthData?.success ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(healthData.data.status)}>
                          {healthData.data.status.toUpperCase()}
                        </Badge>
                        <span className="text-slate-300 text-sm">
                          Uptime: {formatUptime(healthData.data.uptime)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {healthData.data.services?.map((service: any, index: number) => (
                          <div key={index} className="bg-slate-700 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium capitalize">{service.name}</span>
                              {service.status === 'healthy' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                              {service.status === 'degraded' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                              {service.status === 'unhealthy' && <XCircle className="w-4 h-4 text-red-400" />}
                            </div>
                            <p className="text-slate-300 text-xs">{service.message}</p>
                            {service.responseTime && (
                              <p className="text-slate-400 text-xs mt-1">
                                {service.responseTime.toFixed(2)}ms
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-slate-400">Failed to load health data</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Metrics */}
              {metricsData?.success && (
                <Card className="bg-slate-800 border-slate-700 col-span-full">
                  <CardHeader>
                    <CardTitle className="text-white">System Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-400">
                          {Math.round(metricsData.data.logging.memory.heapUsed / 1024 / 1024)}MB
                        </div>
                        <div className="text-slate-300 text-sm">Memory Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {metricsData.data.logging.activeRequests}
                        </div>
                        <div className="text-slate-300 text-sm">Active Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {metricsData.data.logging.totalLogs}
                        </div>
                        <div className="text-slate-300 text-sm">Total Logs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {metricsData.data.logging.errorRate?.toFixed(1) || '0'}%
                        </div>
                        <div className="text-slate-300 text-sm">Error Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ratelimit" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Rate Limiting Status
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Current rate limit status and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rateLimitData?.success && rateLimitData.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-slate-400 text-sm">Endpoint</div>
                        <div className="text-white font-mono">{rateLimitData.data.endpoint}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">User Role</div>
                        <Badge className="bg-blue-600">{rateLimitData.data.role}</Badge>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Limit</div>
                        <div className="text-white">{rateLimitData.data.limit} requests</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Window</div>
                        <div className="text-white">{rateLimitData.data.windowMs / 1000}s</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-300">Remaining Requests</span>
                        <span className="text-white">{rateLimitData.data.remaining}/{rateLimitData.data.limit}</span>
                      </div>
                      <Progress 
                        value={(rateLimitData.data.remaining / rateLimitData.data.limit) * 100}
                        className="bg-slate-700"
                      />
                    </div>
                    
                    <div>
                      <div className="text-slate-400 text-sm">Resets At</div>
                      <div className="text-white">{new Date(rateLimitData.data.resetTime).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No rate limit data available (user not authenticated or endpoint not rate limited)
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Rate Limit Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={testRateLimit}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                  data-testid="button-test-rate-limit"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Test Rate Limiting (15 requests)
                </Button>
                
                <div className="text-slate-300 text-sm">
                  This will make 15 rapid requests to test the rate limiting system.
                  You should see some requests succeed and others get rate limited (429 status).
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={testEndpoints}
                    variant="outline"
                    className="border-slate-600"
                    data-testid="button-test-endpoints"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Test All Endpoints
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setTestResults([])}
                    variant="outline"
                    className="border-slate-600"
                    data-testid="button-clear-results"
                  >
                    Clear Test Results
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Test Results</CardTitle>
                <CardDescription className="text-slate-300">
                  Live results from rate limiting and performance tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No tests executed yet</p>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className="bg-slate-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                            {result.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                            {result.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                            <span className="text-white font-medium">{result.test}</span>
                          </div>
                          <span className="text-slate-400 text-sm">{result.timestamp}</span>
                        </div>
                        <p className="text-slate-300 text-sm">{result.message}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-slate-400 text-xs cursor-pointer">View Details</summary>
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