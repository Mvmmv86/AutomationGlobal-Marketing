import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SiInstagram, SiFacebook, SiYoutube, SiX, SiLinkedin, SiTiktok } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';

interface SocialNetwork {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'google' | 'linkedin' | 'tiktok';
  isConnected: boolean;
  accountName?: string;
}

interface SocialNetworkTabsProps {
  selectedNetwork: string | null;
  onNetworkSelect: (network: string) => void;
  onConnectClick: () => void;
  theme?: 'dark' | 'light';
}

const networkConfig = {
  instagram: {
    icon: SiInstagram,
    label: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-r from-pink-500 to-purple-500'
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
    label: 'Twitter / X',
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

export function SocialNetworkTabs({
  selectedNetwork,
  onNetworkSelect,
  onConnectClick,
  theme = 'dark'
}: SocialNetworkTabsProps) {

  // Buscar redes sociais conectadas
  const { data: connectedNetworks, isLoading } = useQuery({
    queryKey: ['/api/social/networks/connected'],
    queryFn: async () => {
      // Tentar buscar da API
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

  // Filtrar apenas redes conectadas
  const networks: SocialNetwork[] = connectedNetworks || [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-32 bg-gray-600/20 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-600/20 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-600/20 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Tabs de Redes Sociais */}
      <div className="flex items-center gap-2">
        {networks.length === 0 ? (
          <div className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Nenhuma rede social conectada. Clique em "Conectar" para começar.
          </div>
        ) : (
          networks.map((network) => {
            const config = networkConfig[network.platform];
            const Icon = config.icon;
            const isActive = selectedNetwork === network.platform;

            return (
              <button
                key={network.id}
                onClick={() => onNetworkSelect(network.platform)}
                className={cn(
                  "glass-button-3d px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200",
                  isActive
                    ? "bg-green-500/20 border-2 border-green-500 text-white"
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-green-400" : config.color)} />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Botão Conectar */}
      <Button
        onClick={onConnectClick}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-200"
      >
        Conectar
      </Button>
    </div>
  );
}
