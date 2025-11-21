import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Brain, Share2, MessageCircle, Heart, TrendingUp, Users } from 'lucide-react';
import { SiInstagram as InstagramIcon, SiFacebook as FacebookIcon, SiYoutube as YoutubeIcon, SiX as TwitterIcon } from 'react-icons/si';

// Import new dashboard components
import { SocialNetworkTabs } from './SocialNetworkTabs';
import { ConnectSocialModal } from './ConnectSocialModal';
import { PeriodFilters } from './PeriodFilters';
import { MetricsGrid } from './MetricsGrid';
import { FollowersSection } from './FollowersSection';
import { QuickActions } from './QuickActions';
import { ConversionFunnelCard } from './ConversionFunnelCard';

interface MarketingDashboardHomeProps {
  theme?: 'dark' | 'light';
}

export function MarketingDashboardHome({ theme = 'dark' }: MarketingDashboardHomeProps) {
  // State management
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'today'>(7);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Fetch AI Insights (reusing existing endpoint)
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    queryFn: async () => {
      const response = await fetch('/api/ai/insights', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  // Fetch Social Media Analytics (reusing existing endpoint)
  const { data: socialAnalytics, isLoading: socialAnalyticsLoading } = useQuery({
    queryKey: ['/api/social/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/social/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch social analytics');
      const result = await response.json();
      return result.data || { metrics: {}, byPlatform: [] };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const socialMetrics = socialAnalytics?.metrics || {
    totalPosts: 0,
    totalEngagement: 0,
    engagementRate: 0,
    totalReach: 0
  };

  const socialByPlatform = socialAnalytics?.byPlatform || [];

  return (
    <div className="space-y-8">
      {/* ===== PRIMEIRA LINHA: SOCIAL NETWORK TABS + CONECTAR ===== */}
      <SocialNetworkTabs
        selectedNetwork={selectedNetwork}
        onNetworkSelect={setSelectedNetwork}
        onConnectClick={() => setShowConnectModal(true)}
        theme={theme}
      />

      {/* ===== SEGUNDA LINHA: PERIOD FILTERS ===== */}
      <PeriodFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        theme={theme}
      />

      {/* ===== TERCEIRA LINHA: METRICS GRID (4 COLUNAS) ===== */}
      <MetricsGrid
        selectedNetwork={selectedNetwork}
        selectedPeriod={selectedPeriod}
        theme={theme}
      />

      {/* ===== QUARTA LINHA: FOLLOWERS SECTION ===== */}
      <FollowersSection
        selectedNetwork={selectedNetwork}
        selectedPeriod={selectedPeriod}
        theme={theme}
      />

      {/* ===== QUINTA LINHA: QUICK ACTIONS + IA INSIGHTS (ESQUERDA) | FUNIL (DIREITA) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Coluna Esquerda: Quick Actions + IA Insights */}
        <div className="lg:col-span-1 space-y-8">
          {/* Quick Actions */}
          <QuickActions theme={theme} />

          {/* IA Insights */}
          <div className="glass-3d p-6 rounded-xl">
            <h3 className={cn(
              "text-lg font-bold mb-4 flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Brain className="w-5 h-5 text-cyan-400" />
              IA Insights
            </h3>

            <div className="space-y-3">
              {insightsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                </div>
              ) : insights.length === 0 ? (
                <div className={cn(
                  "text-sm text-center py-8",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Nenhum insight disponível no momento
                </div>
              ) : (
                insights.map((insight: any) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-3 rounded-lg",
                      theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn(
                        "font-medium text-sm",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {insight.title}
                      </div>
                      <div className={cn(
                        "text-xs px-2 py-0.5 rounded-md flex-shrink-0 ml-2",
                        insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      )}>
                        {insight.confidence}%
                      </div>
                    </div>

                    <div className={cn(
                      "text-xs mb-2",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {insight.description}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs",
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {insight.time}
                      </span>
                      {insight.actionable && (
                        <button className={cn(
                          "px-2 py-1 text-xs rounded transition-all duration-200",
                          "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white",
                          "hover:from-cyan-600 hover:to-cyan-700"
                        )}>
                          Aplicar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Conversion Funnel (3 colunas - ocupa todo espaço restante) */}
        <div className="lg:col-span-3">
          <ConversionFunnelCard
            selectedNetwork={selectedNetwork}
            selectedPeriod={selectedPeriod}
            theme={theme}
          />
        </div>
      </div>

      {/* ===== SEXTA LINHA: SOCIAL MEDIA ANALYTICS ===== */}
      <div>
        <h2 className={cn(
          "text-xl font-bold mb-4 flex items-center gap-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          <Share2 className="w-5 h-5 text-blue-400" />
          Social Media Analytics
        </h2>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Posts */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {socialAnalyticsLoading ? '...' : socialMetrics.totalPosts}
              </div>
              <div className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Total Posts
              </div>
            </div>
          </div>

          {/* Total Engagement */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Heart className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {socialAnalyticsLoading ? '...' : socialMetrics.totalEngagement.toLocaleString()}
              </div>
              <div className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Total Engagement
              </div>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {socialAnalyticsLoading ? '...' : socialMetrics.engagementRate.toFixed(2) + '%'}
              </div>
              <div className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Engagement Rate
              </div>
            </div>
          </div>

          {/* Total Reach */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {socialAnalyticsLoading ? '...' : (socialMetrics.totalReach / 1000).toFixed(1) + 'K'}
              </div>
              <div className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Total Reach
              </div>
            </div>
          </div>
        </div>

        {/* Performance by Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {socialAnalyticsLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
            </div>
          ) : socialByPlatform.length === 0 ? (
            <div className={cn(
              "col-span-2 text-sm text-center py-8",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Nenhuma plataforma conectada. Conecte suas redes sociais para ver as estatísticas.
            </div>
          ) : (
            socialByPlatform.map((platform: any, index: number) => (
              <div key={index} className="glass-3d p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {platform.platform === 'instagram' && <InstagramIcon className="w-5 h-5 text-pink-500" />}
                    {platform.platform === 'facebook' && <FacebookIcon className="w-5 h-5 text-blue-500" />}
                    {platform.platform === 'youtube' && <YoutubeIcon className="w-5 h-5 text-red-500" />}
                    {platform.platform === 'twitter' && <TwitterIcon className="w-5 h-5 text-gray-500" />}
                    <div>
                      <div className={cn(
                        "font-medium capitalize",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {platform.platform}
                      </div>
                      <div className={cn(
                        "text-xs",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {platform.totalPosts} posts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">
                      {platform.engagementRate.toFixed(2)}%
                    </div>
                    <div className={cn(
                      "text-xs",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Engagement
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={cn(
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Likes:
                    </span>
                    <span className={cn(
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {platform.totalLikes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cn(
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Comments:
                    </span>
                    <span className={cn(
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {platform.totalComments.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cn(
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Shares:
                    </span>
                    <span className={cn(
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {platform.totalShares.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Connect Social Modal */}
      <ConnectSocialModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        theme={theme}
      />
    </div>
  );
}
