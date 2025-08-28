import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Brain, 
  Plug, 
  BarChart3, 
  Zap,
  Settings,
  TrendingUp,
  Users
} from "lucide-react";

interface QuickActionsProps {
  aiCredits: {
    current: number;
    limit: number;
  };
  automations: {
    current: number;
    limit: number;
  };
}

export default function QuickActions({ aiCredits, automations }: QuickActionsProps) {
  const quickActionButtons = [
    {
      icon: Plus,
      title: "New Automation",
      subtitle: "Create workflow",
      color: "hover:border-primary hover:bg-primary/5 group-hover:bg-primary/20",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      testId: "action-new-automation"
    },
    {
      icon: Brain,
      title: "Train AI Model",
      subtitle: "Custom training",
      color: "hover:border-accent hover:bg-accent/5 group-hover:bg-accent/20",
      iconColor: "text-accent",
      iconBg: "bg-accent/10",
      testId: "action-train-ai"
    },
    {
      icon: Plug,
      title: "Add Integration",
      subtitle: "Connect service",
      color: "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      testId: "action-add-integration"
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      subtitle: "Deep insights",
      color: "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      testId: "action-view-analytics"
    }
  ];

  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickActionButtons.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`group p-4 h-auto flex-col space-y-3 border-2 border-dashed transition-all ${action.color}`}
                data-testid={action.testId}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${action.iconBg}`}>
                  <Icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-foreground text-sm">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Resource Usage Section */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Current Usage</h3>
          </div>
          
          <div className="space-y-4">
            {/* AI Credits Usage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">AI Credits</span>
                </div>
                <span className="text-foreground font-medium">
                  {aiCredits.current.toLocaleString()} / {aiCredits.limit.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={(aiCredits.current / aiCredits.limit) * 100} 
                className="h-2"
                data-testid="ai-credits-progress"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(((aiCredits.limit - aiCredits.current) / aiCredits.limit) * 100)}% remaining this month
              </p>
            </div>

            {/* Automations Usage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-muted-foreground">Automations</span>
                </div>
                <span className="text-foreground font-medium">
                  {automations.current} / {automations.limit === -1 ? '∞' : automations.limit}
                </span>
              </div>
              <Progress 
                value={automations.limit === -1 ? 37 : (automations.current / automations.limit) * 100} 
                className="h-2"
                data-testid="automations-progress"
              />
              <p className="text-xs text-muted-foreground">
                {automations.limit === -1 
                  ? 'Unlimited automations available'
                  : `${automations.limit - automations.current} slots remaining`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-2xl font-bold text-foreground">5</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold text-foreground">98.7%</span>
            </div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
