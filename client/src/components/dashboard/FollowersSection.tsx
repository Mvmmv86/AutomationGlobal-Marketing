import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserMinus,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Award
} from 'lucide-react';

interface FollowersSectionProps {
  selectedNetwork: string | null;
  selectedPeriod: number | 'today';
  theme?: 'dark' | 'light';
}

type TabType = 'followers' | 'unfollowers';

interface ActionCard {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  change?: number;
}

export function FollowersSection({
  selectedNetwork,
  selectedPeriod,
  theme = 'dark'
}: FollowersSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('followers');

  // Fetch followers data
  const { data: followersData, isLoading } = useQuery({
    queryKey: ['/api/social/followers', selectedNetwork, selectedPeriod, activeTab],
    queryFn: async () => {
      if (!selectedNetwork) return null;

      try {
        const response = await fetch(
          `/api/social/followers?platform=${selectedNetwork}&period=${selectedPeriod}&type=${activeTab}`,
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
        const { getFollowersDataByPlatform } = await import('@/lib/mockSocialData');
        return getFollowersDataByPlatform(selectedNetwork as any);
      }
    },
    enabled: !!selectedNetwork,
    refetchInterval: 30000
  });

  // Action cards configuration
  const getActionCards = (): ActionCard[] => {
    const formatNum = (num: number) => {
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    if (activeTab === 'followers') {
      return [
        {
          title: 'Novos Seguidores',
          value: followersData?.newFollowers ? formatNum(followersData.newFollowers) : '--',
          icon: UserPlus,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Seguidores Totais',
          value: followersData?.currentFollowers ? formatNum(followersData.currentFollowers) : '--',
          icon: Users,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Net Growth',
          value: followersData?.netGrowth ? `+${formatNum(followersData.netGrowth)}` : '--',
          icon: TrendingUp,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Taxa de Crescimento',
          value: followersData?.growthRate ? `${followersData.growthRate.toFixed(1)}%` : '--',
          icon: Award,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Top Followers',
          value: followersData?.topFollowers?.length?.toString() || '0',
          icon: Heart,
          color: 'text-pink-400',
          bgColor: 'bg-pink-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Engajamento',
          value: followersData?.viralPotential ? `${followersData.viralPotential.toFixed(1)}/10` : 'Alto',
          icon: MessageCircle,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          change: followersData?.growthRate || 0
        }
      ];
    } else {
      // Unfollowers tab
      return [
        {
          title: 'Seguidores Perdidos',
          value: followersData?.unfollowers ? formatNum(followersData.unfollowers) : '--',
          icon: UserMinus,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          change: -(followersData?.growthRate || 0)
        },
        {
          title: 'Taxa de Retenção',
          value: followersData?.currentFollowers && followersData?.unfollowers
            ? `${((1 - followersData.unfollowers / followersData.currentFollowers) * 100).toFixed(1)}%`
            : '--',
          icon: Users,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          change: 2.1
        },
        {
          title: 'Net Growth',
          value: followersData?.netGrowth ? `+${formatNum(followersData.netGrowth)}` : '--',
          icon: TrendingUp,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Unfollows Recentes',
          value: followersData?.recentUnfollowers?.length?.toString() || '0',
          icon: UserMinus,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          change: -3.5
        },
        {
          title: 'Novos Seguidores',
          value: followersData?.newFollowers ? formatNum(followersData.newFollowers) : '--',
          icon: UserPlus,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          change: followersData?.growthRate || 0
        },
        {
          title: 'Taxa de Crescimento',
          value: followersData?.growthRate ? `${followersData.growthRate.toFixed(1)}%` : '--',
          icon: Award,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          change: followersData?.growthRate || 0
        }
      ];
    }
  };

  const actionCards = getActionCards();

  if (!selectedNetwork) {
    return (
      <div className="glass-3d p-8 rounded-xl text-center">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Selecione uma rede social para visualizar seguidores
        </p>
      </div>
    );
  }

  return (
    <div className="glass-3d p-6 rounded-xl">
      {/* Tabs Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('followers')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'followers'
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
              : theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Seguidores</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('unfollowers')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'unfollowers'
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
              : theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-2">
            <UserMinus className="w-4 h-4" />
            <span>Unfollowers</span>
          </div>
        </button>
      </div>

      {/* Action Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={cn(
                "p-4 rounded-lg animate-pulse",
                theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
              )}
            >
              <div className="h-10 bg-gray-600/20 rounded mb-3"></div>
              <div className="h-6 bg-gray-600/20 rounded mb-2"></div>
              <div className="h-4 bg-gray-600/20 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actionCards.map((card) => {
            const Icon = card.icon;
            const hasChange = card.change !== undefined;
            const isPositive = hasChange && card.change! >= 0;

            return (
              <div
                key={card.title}
                className={cn(
                  "p-4 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer",
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                  card.bgColor
                )}>
                  <Icon className={cn("w-5 h-5", card.color)} />
                </div>

                {/* Value */}
                <div className={cn(
                  "text-xl font-bold mb-1",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {card.value}
                </div>

                {/* Title */}
                <div className={cn(
                  "text-xs mb-2",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {card.title}
                </div>

                {/* Change */}
                {hasChange && (
                  <div className={cn(
                    "text-xs font-medium",
                    isPositive ? 'text-green-400' : 'text-red-400'
                  )}>
                    {isPositive ? '+' : ''}{card.change}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
