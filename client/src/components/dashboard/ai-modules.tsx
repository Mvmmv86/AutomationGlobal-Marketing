import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Headphones, TrendingUp } from "lucide-react";

interface ModuleMetrics {
  [key: string]: number;
}

interface ModuleData {
  status: string;
  efficiency: number;
  metrics: ModuleMetrics;
}

interface AiModulesProps {
  modules: {
    marketing: ModuleData;
    support: ModuleData;
    trading: ModuleData;
  };
}

export default function AiModules({ modules }: AiModulesProps) {
  const moduleConfigs = [
    {
      key: 'marketing',
      name: 'Marketing AI',
      description: 'Campaign Optimization',
      icon: Megaphone,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
      progressColor: 'bg-orange-500',
      metrics: [
        { label: 'Ad Copy Generated', value: modules.marketing.metrics.adCopyGenerated },
        { label: 'CTR Improvement', value: `+${modules.marketing.metrics.ctrImprovement}%`, positive: true },
        { label: 'Cost per Lead', value: `${modules.marketing.metrics.costPerLead}%`, negative: true },
      ]
    },
    {
      key: 'support',
      name: 'Support AI',
      description: 'Ticket Resolution',
      icon: Headphones,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      progressColor: 'bg-blue-500',
      metrics: [
        { label: 'Tickets Resolved', value: modules.support.metrics.ticketsResolved },
        { label: 'Avg Response Time', value: `${modules.support.metrics.avgResponseTime} min`, positive: true },
        { label: 'Customer Satisfaction', value: `${modules.support.metrics.customerSatisfaction}/5`, positive: true },
      ]
    },
    {
      key: 'trading',
      name: 'Trading AI',
      description: 'Market Analysis',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      progressColor: 'bg-green-500',
      metrics: [
        { label: 'Signals Generated', value: modules.trading.metrics.signalsGenerated },
        { label: 'Win Rate', value: `${modules.trading.metrics.winRate}%`, positive: true },
        { label: 'Portfolio Growth', value: `+${modules.trading.metrics.portfolioGrowth}%`, positive: true },
      ]
    }
  ];

  return (
    <Card data-testid="ai-modules">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Modules Performance</CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" variant="default">24h</Button>
            <Button size="sm" variant="outline">7d</Button>
            <Button size="sm" variant="outline">30d</Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {moduleConfigs.map((config) => {
            const moduleData = modules[config.key as keyof typeof modules];
            const Icon = config.icon;
            
            return (
              <div key={config.key} className="space-y-4" data-testid={`module-${config.key}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{config.name}</h3>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-accent">
                    {moduleData.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {config.metrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <span className={`text-sm font-medium ${
                        metric.positive ? 'text-accent' : 
                        metric.negative ? 'text-emerald-600 dark:text-emerald-400' : 
                        'text-foreground'
                      }`}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Progress value={moduleData.efficiency} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {moduleData.efficiency}% efficiency score
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
