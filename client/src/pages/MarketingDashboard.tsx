import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  TrendingUp, 
  MousePointer, 
  Target, 
  DollarSign,
  Instagram,
  Facebook,
  Brain,
  Calendar,
  Users,
  Video,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Theme Context
import { MarketingThemeProvider, useMarketingTheme } from "@/context/MarketingThemeContext";

interface MarketingMetric {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  impressionsChange: number;
  clicksChange: number;
  conversionsChange: number;
  roiChange: number;
}

interface MarketingChannel {
  id: string;
  channelName: string;
  trafficPercentage: number;
  performanceData: {
    impressions: number;
    engagement: number;
  };
}

interface MarketingAiInsight {
  id: string;
  insightText: string;
  category: string;
  confidenceScore: number;
}

function MarketingDashboardInner() {
  const { id } = useParams<{ id: string }>();
  const { theme, toggleTheme } = useMarketingTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');
  
  // Use um ID padrão para demonstração se não fornecido
  const organizationId = id || '123e4567-e89b-12d3-a456-426614174000';

  const { data: metrics, isLoading: metricsLoading } = useQuery<MarketingMetric[]>({
    queryKey: [`/api/organizations/${organizationId}/marketing/metrics`, selectedPeriod],
    enabled: !!organizationId
  });

  const { data: channels, isLoading: channelsLoading } = useQuery<MarketingChannel[]>({
    queryKey: [`/api/organizations/${organizationId}/marketing/channels`],
    enabled: !!organizationId
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<MarketingAiInsight[]>({
    queryKey: [`/api/organizations/${organizationId}/marketing/ai-insights`],
    enabled: !!organizationId
  });

  const currentMetric = metrics?.[0];

  if (metricsLoading || channelsLoading || insightsLoading) {
    return (
      <div className={cn(
        "min-h-screen p-6 transition-colors duration-300",
        theme === 'dark' ? "bg-[#0f0f0f]" : "bg-[#ffffff]"
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-3d animate-pulse">
                <div className="h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen p-6 transition-colors duration-300",
      theme === 'dark' ? "bg-[#0f0f0f]" : "bg-[#ffffff]"
    )}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn(
              "text-3xl font-bold mb-2 transition-colors",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Dashboard Marketing
            </h1>
            <p className={cn(
              "transition-colors",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Visão geral completa das suas campanhas de marketing
            </p>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-circle-3d"
            data-testid="button-toggle-theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-3">
          {[
            { key: 'today', label: '7 dias' },
            { key: 'week', label: '30 dias' }, 
            { key: 'month', label: '90 dias' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key as typeof selectedPeriod)}
              className={cn(
                "btn-3d text-sm",
                selectedPeriod === key && "bg-gradient-to-r from-purple-500 to-blue-500"
              )}
              data-testid={`filter-period-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard3D
            title="Total Impressões"
            value={currentMetric?.impressions || 125000}
            change={currentMetric?.impressionsChange || 15}
            icon={<TrendingUp className="w-8 h-8" />}
            color="from-green-500 to-emerald-500"
            theme={theme}
          />
          
          <MetricCard3D
            title="Cliques"
            value={currentMetric?.clicks || 3200}
            change={currentMetric?.clicksChange || 8}
            icon={<MousePointer className="w-8 h-8" />}
            color="from-blue-500 to-cyan-500"
            theme={theme}
          />
          
          <MetricCard3D
            title="Conversões"
            value={currentMetric?.conversions || 45}
            change={currentMetric?.conversionsChange || 12}
            icon={<Target className="w-8 h-8" />}
            color="from-purple-500 to-pink-500"
            theme={theme}
          />
          
          <MetricCard3D
            title="ROI"
            value={`${currentMetric?.roi || 240}%`}
            change={currentMetric?.roiChange || 25}
            icon={<DollarSign className="w-8 h-8" />}
            color="from-orange-500 to-red-500"
            theme={theme}
          />
        </div>

        {/* Channels Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-3d">
            <h3 className={cn(
              "text-xl font-semibold mb-6 transition-colors",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Performance por Canal
            </h3>
            
            <div className="space-y-4">
              {channels?.map((channel) => (
                <ChannelCard3D
                  key={channel.id}
                  name={channel.channelName}
                  percentage={channel.trafficPercentage}
                  impressions={channel.performanceData.impressions}
                  engagement={channel.performanceData.engagement}
                  theme={theme}
                />
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="card-3d">
            <h3 className={cn(
              "text-xl font-semibold mb-6 flex items-center gap-2 transition-colors",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              <Brain className="w-6 h-6 text-purple-500" />
              Insights da IA
            </h3>
            
            <div className="space-y-4">
              {insights?.map((insight, index) => (
                <InsightCard3D
                  key={insight.id}
                  text={insight.insightText}
                  category={insight.category}
                  confidence={insight.confidenceScore}
                  theme={theme}
                  icon={getInsightIcon(insight.category)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="card-3d">
          <h3 className={cn(
            "text-xl font-semibold mb-6 transition-colors",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Gráfico de Performance (30 dias)
          </h3>
          
          <div className="bar-chart-3d">
            {[65, 45, 80, 55, 70, 85, 60].map((height, index) => (
              <div
                key={index}
                className="bar-3d"
                style={{ height: `${height}%` }}
                data-testid={`bar-chart-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card 3D Component
function MetricCard3D({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  theme 
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  theme: 'dark' | 'light';
}) {
  return (
    <div className="card-3d card-metric" data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl bg-gradient-to-br", color)}>
          {icon}
        </div>
        <div className={cn(
          "text-sm font-medium px-2 py-1 rounded-full",
          change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      
      <div>
        <h3 className={cn(
          "text-sm font-medium mb-1 transition-colors",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-2xl font-bold transition-colors",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

// Channel Card 3D Component
function ChannelCard3D({ 
  name, 
  percentage, 
  impressions, 
  engagement, 
  theme 
}: {
  name: string;
  percentage: number;
  impressions: number;
  engagement: number;
  theme: 'dark' | 'light';
}) {
  const getChannelIcon = (channelName: string) => {
    switch (channelName.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      default: return <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/10">
          {getChannelIcon(name)}
        </div>
        <div>
          <h4 className={cn(
            "font-semibold transition-colors",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {name}
          </h4>
          <p className={cn(
            "text-sm transition-colors",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {impressions.toLocaleString()} impressões
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className={cn(
          "text-xl font-bold transition-colors",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {percentage}%
        </p>
        <p className={cn(
          "text-sm transition-colors",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          {engagement}% eng.
        </p>
      </div>
    </div>
  );
}

// Insight Card 3D Component
function InsightCard3D({ 
  text, 
  category, 
  confidence, 
  theme, 
  icon 
}: {
  text: string;
  category: string;
  confidence: number;
  theme: 'dark' | 'light';
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          {icon}
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-sm mb-2 transition-colors",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {text}
          </p>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full bg-purple-500/20 transition-colors",
              theme === 'dark' ? "text-purple-300" : "text-purple-700"
            )}>
              {category}
            </span>
            <span className={cn(
              "text-xs transition-colors",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {Math.round(confidence * 100)}% confiança
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInsightIcon(category: string) {
  switch (category) {
    case 'timing': return <Calendar className="w-4 h-4" />;
    case 'audience': return <Users className="w-4 h-4" />;
    case 'content': return <Video className="w-4 h-4" />;
    default: return <Brain className="w-4 h-4" />;
  }
}

// Main component with theme provider
export default function MarketingDashboard() {
  return (
    <MarketingThemeProvider>
      <MarketingDashboardInner />
    </MarketingThemeProvider>
  );
}