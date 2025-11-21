import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Eye, MousePointerClick, Target, DollarSign } from 'lucide-react';

interface MetricsGridProps {
  selectedNetwork: string | null;
  selectedPeriod: number | 'today';
  theme?: 'dark' | 'light';
}

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
  bgColor: string;
}

export function MetricsGrid({
  selectedNetwork,
  selectedPeriod,
  theme = 'dark'
}: MetricsGridProps) {
  // Fetch metrics based on network and period
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['/api/social/metrics', selectedNetwork, selectedPeriod],
    queryFn: async () => {
      if (!selectedNetwork) return null;

      try {
        // Para Meta (Facebook/Instagram), usar Meta Insights API
        const isMetaPlatform = selectedNetwork === 'facebook' || selectedNetwork === 'instagram';

        if (isMetaPlatform) {
          // Mapear período para datePreset do Meta
          const datePresetMap: Record<string, string> = {
            'today': 'today',
            '7': 'last_7d',
            '30': 'last_30d',
            '90': 'last_90d'
          };
          const datePreset = datePresetMap[String(selectedPeriod)] || 'last_30d';

          // Buscar socialAccountId da rede social conectada
          const accountsResponse = await fetch('/api/social/accounts', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const accountsResult = await accountsResponse.json();
          const socialAccount = accountsResult.data?.find((acc: any) =>
            acc.platform.toLowerCase() === selectedNetwork.toLowerCase()
          );

          if (!socialAccount) {
            throw new Error('Social account not found');
          }

          // Buscar insights agregados do Meta
          const response = await fetch(
            `/api/meta-ads/insights/aggregated?socialAccountId=${socialAccount.id}&datePreset=${datePreset}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          );

          if (!response.ok) throw new Error('Meta API not available');
          const result = await response.json();

          // Mapear resposta do Meta para formato esperado
          const metaData = result.data;
          return {
            impressions: metaData.impressions || 0,
            clicks: metaData.clicks || 0,
            conversions: metaData.conversions || 0,
            roi: metaData.roas ? (metaData.roas * 100).toFixed(1) : '0.0',
            impressionsChange: 0, // Meta não retorna % change por padrão
            clicksChange: 0,
            conversionsChange: 0,
            roiChange: 0
          };
        }

        // Para outras redes, usar endpoint genérico
        const response = await fetch(
          `/api/social/metrics?platform=${selectedNetwork}&period=${selectedPeriod}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) throw new Error('API not available');
        const result = await response.json();
        return result.data;
      } catch (error) {
        // Fallback para dados mock
        const { getMetricsByPlatform } = await import('@/lib/mockSocialData');
        return getMetricsByPlatform(selectedNetwork as any, selectedPeriod);
      }
    },
    enabled: !!selectedNetwork,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Default metrics structure (with mock data for now)
  const getMetrics = (): Metric[] => {
    if (!selectedNetwork || !metricsData) {
      return [
        {
          label: 'Impressões',
          value: '--',
          change: 0,
          icon: Eye,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20'
        },
        {
          label: 'Cliques',
          value: '--',
          change: 0,
          icon: MousePointerClick,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20'
        },
        {
          label: 'Conversões',
          value: '--',
          change: 0,
          icon: Target,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20'
        },
        {
          label: 'ROI',
          value: '--',
          change: 0,
          icon: DollarSign,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20'
        }
      ];
    }

    // Dados da API ou mock
    return [
      {
        label: 'Impressões',
        value: formatNumber(metricsData.impressions || 0),
        change: metricsData.impressionsChange || 0,
        icon: Eye,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20'
      },
      {
        label: metricsData.clicks ? 'Cliques' : 'Engagement',
        value: formatNumber(metricsData.clicks || metricsData.engagement || 0),
        change: metricsData.clicksChange || metricsData.engagementChange || 0,
        icon: MousePointerClick,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20'
      },
      {
        label: 'Conversões',
        value: formatNumber(metricsData.conversions || Math.floor((metricsData.engagement || 0) * 0.1)),
        change: metricsData.conversionsChange || metricsData.engagementChange || 0,
        icon: Target,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20'
      },
      {
        label: 'ROI',
        value: metricsData.roi ? `${metricsData.roi}%` : `${metricsData.engagementRate?.toFixed(1) || 0}%`,
        change: metricsData.roiChange || metricsData.engagementRateChange || 0,
        icon: DollarSign,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20'
      }
    ];
  };

  const metrics = getMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-3d p-6 rounded-xl animate-pulse"
          >
            <div className="h-12 bg-gray-600/20 rounded mb-4"></div>
            <div className="h-8 bg-gray-600/20 rounded mb-2"></div>
            <div className="h-4 bg-gray-600/20 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedNetwork) {
    return (
      <div className="glass-3d p-8 rounded-xl text-center">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Selecione uma rede social para visualizar as métricas
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;

        return (
          <div
            key={metric.label}
            className={cn(
              "glass-3d p-6 rounded-xl transition-all duration-200 hover:scale-105",
              theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
            )}
          >
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
              metric.bgColor
            )}>
              <Icon className={cn("w-6 h-6", metric.color)} />
            </div>

            {/* Value */}
            <div className={cn(
              "text-2xl font-bold mb-1",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {metric.value}
            </div>

            {/* Label */}
            <div className={cn(
              "text-sm mb-3",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {metric.label}
            </div>

            {/* Change indicator */}
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(metric.change)}%</span>
              <span className={cn(
                "ml-1",
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                vs período anterior
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}
