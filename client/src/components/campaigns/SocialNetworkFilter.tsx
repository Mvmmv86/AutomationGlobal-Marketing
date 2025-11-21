import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { SiInstagram, SiFacebook, SiYoutube, SiX, SiLinkedin, SiTiktok } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { Filter } from 'lucide-react';

interface SocialNetwork {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'google' | 'linkedin' | 'tiktok';
  isConnected: boolean;
  accountName?: string;
}

interface SocialNetworkFilterProps {
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string | null) => void;
  theme?: 'dark' | 'light';
}

const networkConfig = {
  all: {
    icon: Filter,
    label: 'Todas',
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-purple-500 to-blue-500'
  },
  instagram: {
    icon: SiInstagram,
    label: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
  },
  facebook: {
    icon: SiFacebook,
    label: 'Facebook',
    color: 'text-blue-500',
    bgColor: 'bg-blue-600'
  },
  youtube: {
    icon: SiYoutube,
    label: 'YouTube',
    color: 'text-red-500',
    bgColor: 'bg-red-600'
  },
  twitter: {
    icon: SiX,
    label: 'X',
    color: 'text-gray-700',
    bgColor: 'bg-gray-800'
  },
  linkedin: {
    icon: SiLinkedin,
    label: 'LinkedIn',
    color: 'text-blue-600',
    bgColor: 'bg-blue-700'
  },
  tiktok: {
    icon: SiTiktok,
    label: 'TikTok',
    color: 'text-gray-900',
    bgColor: 'bg-gradient-to-r from-gray-900 via-pink-500 to-cyan-500'
  },
  google: {
    icon: FcGoogle,
    label: 'Google Ads',
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-r from-blue-500 to-green-500'
  }
};

export function SocialNetworkFilter({
  selectedPlatform,
  onPlatformSelect,
  theme = 'dark'
}: SocialNetworkFilterProps) {
  // Buscar redes sociais conectadas (reutilizando query da Home)
  const { data: connectedNetworks, isLoading } = useQuery({
    queryKey: ['/api/social/networks/connected'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/social/networks/connected', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('API not available');
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        // Fallback para dados mock se API não estiver disponível
        const { getConnectedNetworks } = await import('@/lib/mockSocialData');
        return getConnectedNetworks();
      }
    }
  });

  const networks: SocialNetwork[] = connectedNetworks || [];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 px-6 py-3 rounded-lg bg-white/5 animate-pulse"
            style={{ width: '120px', height: '44px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Tab "Todas" */}
      <button
        onClick={() => onPlatformSelect(null)}
        className={cn(
          "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
          "border shadow-lg",
          selectedPlatform === null
            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-400/50 scale-105"
            : theme === 'dark'
              ? "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:scale-102"
              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
        )}
      >
        <Filter className="w-4 h-4" />
        <span>Todas</span>
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
          selectedPlatform === null
            ? "bg-white/20"
            : "bg-white/10"
        )}>
          {networks.length}
        </span>
      </button>

      {/* Tabs das redes conectadas */}
      {networks.map((network) => {
        const config = networkConfig[network.platform];
        if (!config) return null;

        const Icon = config.icon;
        const isSelected = selectedPlatform === network.platform;

        return (
          <button
            key={network.id}
            onClick={() => onPlatformSelect(network.platform)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              "border shadow-lg",
              isSelected
                ? `${config.bgColor} text-white border-white/20 scale-105`
                : theme === 'dark'
                  ? "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:scale-102"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            )}
          >
            <Icon className={cn("w-4 h-4", isSelected ? "text-white" : config.color)} />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
