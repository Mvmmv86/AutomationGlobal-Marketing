import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { SiInstagram, SiFacebook, SiYoutube, SiX, SiLinkedin, SiTiktok } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { X, Plus, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { MetaAdsWizard } from './wizards/MetaAdsWizard';

interface SocialNetwork {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'google' | 'linkedin' | 'tiktok';
  isConnected: boolean;
  accountName?: string;
}

interface SelectNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNetwork: (platform: string) => void;
  theme?: 'dark' | 'light';
}

const networkConfig = {
  instagram: {
    icon: SiInstagram,
    label: 'Instagram',
    description: 'Stories, Reels e Feed',
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    borderColor: 'border-pink-400/50',
    hoverGlow: 'hover:shadow-pink-500/50'
  },
  facebook: {
    icon: SiFacebook,
    label: 'Facebook',
    description: 'Posts, Stories e Marketplace',
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
    borderColor: 'border-blue-400/50',
    hoverGlow: 'hover:shadow-blue-500/50'
  },
  youtube: {
    icon: SiYoutube,
    label: 'YouTube',
    description: 'Vídeos e Shorts',
    color: 'text-red-500',
    bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
    borderColor: 'border-red-400/50',
    hoverGlow: 'hover:shadow-red-500/50'
  },
  twitter: {
    icon: SiX,
    label: 'X (Twitter)',
    description: 'Tweets e Threads',
    color: 'text-gray-700',
    bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
    borderColor: 'border-gray-400/50',
    hoverGlow: 'hover:shadow-gray-500/50'
  },
  linkedin: {
    icon: SiLinkedin,
    label: 'LinkedIn',
    description: 'Posts Profissionais e Anúncios B2B',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-700 to-blue-800',
    borderColor: 'border-blue-400/50',
    hoverGlow: 'hover:shadow-blue-600/50'
  },
  tiktok: {
    icon: SiTiktok,
    label: 'TikTok',
    description: 'Vídeos Curtos Virais',
    color: 'text-gray-900',
    bgColor: 'bg-gradient-to-br from-gray-900 via-pink-500 to-cyan-500',
    borderColor: 'border-pink-400/50',
    hoverGlow: 'hover:shadow-pink-500/50'
  },
  google: {
    icon: FcGoogle,
    label: 'Google Ads',
    description: 'Pesquisa, Display e Shopping',
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500',
    borderColor: 'border-blue-400/50',
    hoverGlow: 'hover:shadow-blue-500/50'
  }
};

export function SelectNetworkModal({
  isOpen,
  onClose,
  onSelectNetwork,
  theme = 'dark'
}: SelectNetworkModalProps) {
  const [, setLocation] = useLocation();
  const [showMetaWizard, setShowMetaWizard] = useState(false);
  const [selectedMetaPlatform, setSelectedMetaPlatform] = useState<'instagram' | 'facebook' | null>(null);

  // Buscar redes sociais conectadas
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
        // Fallback para dados mock
        const { getConnectedNetworks } = await import('@/lib/mockSocialData');
        return getConnectedNetworks();
      }
    },
    enabled: isOpen
  });

  const networks: SocialNetwork[] = connectedNetworks || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass-3d rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden pointer-events-auto animate-scaleIn shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <h2 className={cn(
              "text-2xl font-bold mb-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Selecione a Rede Social
            </h2>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Escolha onde você deseja criar sua nova campanha
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-40 rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : networks.length === 0 ? (
              <div className="text-center py-12">
                <div className={cn(
                  "text-6xl mb-4",
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                )}>
                  📱
                </div>
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Nenhuma Rede Social Conectada
                </h3>
                <p className={cn(
                  "text-sm mb-6",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Conecte suas redes sociais para começar a criar campanhas
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setLocation('/dashboard');
                  }}
                  className="glass-button-3d px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Conectar Redes Sociais
                </button>
              </div>
            ) : (
              <>
                {/* Grid de Redes Conectadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {networks.map((network) => {
                    const config = networkConfig[network.platform];
                    if (!config) return null;

                    const Icon = config.icon;

                    return (
                      <button
                        key={network.id}
                        onClick={() => {
                          // Instagram e Facebook usam Meta Ads API
                          if (network.platform === 'instagram' || network.platform === 'facebook') {
                            setSelectedMetaPlatform(network.platform);
                            setShowMetaWizard(true);
                          } else {
                            // Outras plataformas usam fluxo antigo (por enquanto)
                            onSelectNetwork(network.platform);
                            onClose();
                          }
                        }}
                        className={cn(
                          "group relative overflow-hidden rounded-xl p-6",
                          "border-2 transition-all duration-300",
                          "hover:scale-105 hover:shadow-2xl",
                          config.borderColor,
                          config.hoverGlow,
                          theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                        )}
                      >
                        {/* Background Gradient on Hover */}
                        <div
                          className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                            config.bgColor
                          )}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon */}
                          <div className={cn(
                            "w-16 h-16 rounded-xl mb-4 flex items-center justify-center",
                            "shadow-lg transition-transform duration-300 group-hover:scale-110",
                            config.bgColor
                          )}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>

                          {/* Network Info */}
                          <h4 className={cn(
                            "font-bold text-lg mb-1",
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {config.label}
                          </h4>
                          <p className={cn(
                            "text-xs mb-3",
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {config.description}
                          </p>

                          {/* Account Name */}
                          {network.accountName && (
                            <div className={cn(
                              "text-xs px-3 py-1 rounded-full inline-flex items-center gap-1",
                              theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
                            )}>
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              {network.accountName}
                            </div>
                          )}

                          {/* Arrow Icon on Hover */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Botão Conectar Nova Rede */}
                <div className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center",
                  theme === 'dark' ? 'border-white/10' : 'border-gray-300'
                )}>
                  <div className={cn(
                    "text-4xl mb-3",
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  )}>
                    ➕
                  </div>
                  <h4 className={cn(
                    "font-bold mb-2",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Conectar Nova Rede Social
                  </h4>
                  <p className={cn(
                    "text-sm mb-4",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Expanda seu alcance conectando mais redes sociais
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      setLocation('/dashboard');
                    }}
                    className={cn(
                      "px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2",
                      theme === 'dark'
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Ir para Integrações
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>

      {/* Meta Ads Wizard (Instagram/Facebook) */}
      {selectedMetaPlatform && (
        <MetaAdsWizard
          isOpen={showMetaWizard}
          onClose={() => {
            setShowMetaWizard(false);
            setSelectedMetaPlatform(null);
            onClose();
          }}
          platform={selectedMetaPlatform}
        />
      )}
    </>
  );
}
