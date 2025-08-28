import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Database, 
  Brain, 
  RotateCcw,
  Wifi,
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface SystemStatusProps {
  status: {
    api: { status: string; uptime?: number };
    database: { status: string };
    ai: { status: string };
    queue: { status: string };
  };
}

export default function SystemStatus({ status }: SystemStatusProps) {
  const getStatusIcon = (statusValue: string) => {
    switch (statusValue.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'error':
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-accent" />;
    }
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'operational':
        return (
          <Badge className="text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30">
            <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full mr-2 animate-pulse" />
            {statusValue}
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="text-accent bg-accent/10">
            <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" />
            {statusValue}
          </Badge>
        );
      case 'warning':
      case 'degraded':
        return (
          <Badge className="text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30">
            <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full mr-2 animate-pulse" />
            {statusValue}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {statusValue}
          </Badge>
        );
    }
  };

  const systemComponents = [
    {
      name: "API Status",
      status: status.api.status,
      icon: Server,
      detail: status.api.uptime ? `${status.api.uptime}% Uptime` : "Operational",
      testId: "status-api"
    },
    {
      name: "Database",
      status: status.database.status,
      icon: Database,
      detail: "PostgreSQL",
      testId: "status-database"
    },
    {
      name: "AI Services",
      status: status.ai.status,
      icon: Brain,
      detail: "OpenAI + Anthropic",
      testId: "status-ai"
    },
    {
      name: "Queue System",
      status: status.queue.status,
      icon: RotateCcw,
      detail: "Background Tasks",
      testId: "status-queue"
    }
  ];

  // Determine overall system status
  const allStatuses = Object.values(status).map(s => s.status.toLowerCase());
  const overallStatus = allStatuses.every(s => ['healthy', 'active', 'operational', 'processing'].includes(s))
    ? 'operational'
    : allStatuses.some(s => ['error', 'down'].includes(s))
    ? 'degraded'
    : 'warning';

  return (
    <Card data-testid="system-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            System Status
          </CardTitle>
          {getStatusBadge(overallStatus === 'operational' ? 'All Systems Operational' : 'System Issues Detected')}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <div 
                key={index}
                className="text-center space-y-3"
                data-testid={component.testId}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-muted/50 dark:bg-muted/20 rounded-full flex items-center justify-center border-2 border-border">
                    {getStatusIcon(component.status)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground text-sm">{component.name}</h3>
                    <p className="text-xs text-muted-foreground">{component.detail}</p>
                  </div>
                </div>
                {getStatusBadge(component.status)}
              </div>
            );
          })}
        </div>

        {/* Additional System Metrics */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Wifi className="h-4 w-4 text-accent" />
                <span className="text-lg font-semibold text-foreground">24ms</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg Response Time</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-semibold text-foreground">99.98%</span>
              </div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-semibold text-foreground">0</span>
              </div>
              <p className="text-xs text-muted-foreground">Active Incidents</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
