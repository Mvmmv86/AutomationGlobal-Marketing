import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { PieChart, TrendingDown } from 'lucide-react';

interface ConversionFunnelCardProps {
  selectedNetwork: string | null;
  selectedPeriod: number | 'today';
  theme?: 'dark' | 'light';
}

interface FunnelStage {
  name: string;
  description: string;
  count: number;
  percentage: number;
  dropOff: number;
  color: { from: string; to: string };
}

export function ConversionFunnelCard({
  selectedNetwork,
  selectedPeriod,
  theme = 'dark'
}: ConversionFunnelCardProps) {
  // Fetch funnel data and stages configuration
  const { data: funnelConfig, isLoading } = useQuery({
    queryKey: ['/api/social/funnel', selectedNetwork, selectedPeriod],
    queryFn: async () => {
      if (!selectedNetwork) return null;

      try {
        const response = await fetch(
          `/api/social/funnel?platform=${selectedNetwork}&period=${selectedPeriod}`,
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
        const { getFunnelStagesByPlatform, getConversionFunnelByPlatform } = await import('@/lib/mockSocialData');
        const stages = getFunnelStagesByPlatform(selectedNetwork as any);
        const data = getConversionFunnelByPlatform(selectedNetwork as any);

        // Combinar stages com dados
        const stagesArray = Object.values(data);
        return stages.map((stage: any, index: number) => ({
          ...stage,
          ...(stagesArray[index] as any)
        }));
      }
    },
    enabled: !!selectedNetwork,
    refetchInterval: 30000
  });

  const stages: FunnelStage[] = funnelConfig || [];

  if (!selectedNetwork) {
    return (
      <div className="glass-3d p-8 rounded-xl text-center">
        <div className={cn(
          "text-sm",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Selecione uma rede social para visualizar o funil de conversão
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-3d p-8 rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-600/20 rounded w-1/3"></div>
          <div className="h-64 bg-gray-600/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-3d p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(
          "text-xl font-bold flex items-center gap-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          <PieChart className="w-5 h-5 text-orange-400" />
          Funil de Conversão
        </h3>

        <div className={cn(
          "text-xs px-3 py-1 rounded-full",
          "bg-gradient-to-r from-orange-500/20 to-orange-600/20",
          "border border-orange-400/30 text-orange-400"
        )}>
          {selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}
        </div>
      </div>

      {/* Funnel 3D Visualization */}
      <div className="relative">
        <div className="flex flex-col items-center gap-2 py-8">
          {stages.map((stage, index) => {
            const width = 100 - (index * 15); // Decrease width progressively
            const nextStage = stages[index + 1];
            const dropOff = nextStage ? stage.percentage - nextStage.percentage : 0;

            return (
              <div key={index} className="w-full flex flex-col items-center">
                {/* Funnel Stage */}
                <div
                  className="relative group transition-all duration-300 hover:scale-105"
                  style={{ width: `${width}%` }}
                >
                  {/* 3D Funnel Layer */}
                  <div
                    className={cn(
                      "relative rounded-lg overflow-hidden shadow-2xl",
                      "transform transition-all duration-300",
                      "hover:shadow-orange-500/20"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${stage.color.from}, ${stage.color.to})`,
                      height: '80px',
                      boxShadow: `0 10px 30px -10px ${stage.color.from}40, inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)`
                    }}
                  >
                    {/* Top Highlight (3D effect) */}
                    <div
                      className="absolute inset-x-0 top-0 h-1 opacity-50"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
                      }}
                    />

                    {/* Content */}
                    <div className="relative h-full flex items-center justify-between px-6 py-4">
                      {/* Left Side: Stage Info */}
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg mb-1">
                          {stage.name}
                        </div>
                        <div className="text-white/80 text-xs">
                          {stage.description}
                        </div>
                      </div>

                      {/* Right Side: Numbers */}
                      <div className="text-right ml-4">
                        <div className="font-bold text-white text-2xl mb-1">
                          {stage.count.toLocaleString()}
                        </div>
                        <div className="text-white/90 text-sm font-medium">
                          {stage.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Bottom Shadow (3D depth) */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-2 opacity-30"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${stage.color.to})`
                      }}
                    />
                  </div>

                  {/* Hover Tooltip */}
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 -top-12 z-10",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    "glass-3d px-4 py-2 rounded-lg shadow-xl whitespace-nowrap",
                    "pointer-events-none"
                  )}>
                    <div className={cn(
                      "text-xs font-medium",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      Taxa de conversão: {stage.percentage.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Drop-off Indicator */}
                {nextStage && dropOff > 0 && (
                  <div className="flex items-center gap-2 my-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className={cn(
                      "text-xs",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      -{dropOff.toFixed(1)}% drop-off
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Droplets Effect (bottom of funnel) */}
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className={cn(
            "p-4 rounded-lg text-center",
            theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
          )}>
            <div className={cn(
              "text-2xl font-bold mb-1",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {stages[0]?.count.toLocaleString() || 0}
            </div>
            <div className={cn(
              "text-xs",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Total Entrada
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg text-center",
            theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
          )}>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stages[stages.length - 1]?.count.toLocaleString() || 0}
            </div>
            <div className={cn(
              "text-xs",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Conversões
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg text-center",
            theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
          )}>
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {stages[stages.length - 1]?.percentage.toFixed(1) || 0}%
            </div>
            <div className={cn(
              "text-xs",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Taxa Final
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
