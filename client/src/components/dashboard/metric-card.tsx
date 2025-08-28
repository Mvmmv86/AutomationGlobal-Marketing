import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  Cog, 
  DollarSign, 
  ChartLine, 
  TrendingUp, 
  LucideIcon 
} from "lucide-react";

const iconMap = {
  robot: Bot,
  cogs: Cog,
  "dollar-sign": DollarSign,
  "chart-line": ChartLine,
};

const colorMap = {
  accent: "bg-accent/10 text-accent",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
};

const changeColorMap = {
  accent: "text-accent bg-accent/10",
  blue: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900",
  emerald: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900",
  purple: "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900",
};

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  icon: keyof typeof iconMap;
  color: keyof typeof colorMap;
  subtitle?: string;
  "data-testid"?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  subtitle,
  "data-testid": testId 
}: MetricCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card className="metric-card hover:shadow-lg transition-all duration-200" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
          {change && (
            <Badge className={cn("text-xs font-medium", changeColorMap[color])}>
              {change}
            </Badge>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
        
        {subtitle && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <TrendingUp className={cn("h-3 w-3 mr-1", color === 'accent' ? 'text-accent' : 'text-current')} />
            <span>{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
