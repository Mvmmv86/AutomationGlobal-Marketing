import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Clock } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  module: string;
  status: 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  processed: number;
}

interface RecentAutomationsProps {
  automations: Automation[];
}

export default function RecentAutomations({ automations }: RecentAutomationsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-accent" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="text-accent bg-accent/10">Running</Badge>;
      case 'completed':
        return <Badge className="text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900">Complete</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    }
    
    return `${diffHours} hours ago`;
  };

  return (
    <Card data-testid="recent-automations">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Automations</CardTitle>
          <Button variant="link" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {automations.map((automation) => (
            <div 
              key={automation.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              data-testid={`automation-${automation.id}`}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                {getStatusIcon(automation.status)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{automation.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {automation.module} • {
                    automation.status === 'completed' && automation.completedAt
                      ? `Completed ${formatTime(automation.completedAt)}`
                      : automation.startedAt
                      ? `Started ${formatTime(automation.startedAt)}`
                      : 'Recently created'
                  }
                </p>
              </div>
              
              <div className="text-right">
                {getStatusBadge(automation.status)}
                <p className="text-xs text-muted-foreground mt-1">
                  {automation.processed} {automation.status === 'completed' ? 'processed' : 'items processed'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
