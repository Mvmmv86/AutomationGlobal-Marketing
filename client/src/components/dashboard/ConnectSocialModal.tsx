import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SiInstagram, SiFacebook, SiYoutube, SiX, SiLinkedin, SiTiktok } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConnectSocialModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const socialNetworks = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: SiInstagram,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-purple-500',
    authEndpoint: '/api/social/auth/facebook/connect', // Instagram usa mesmo fluxo do Facebook
    needsOrgId: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: SiFacebook,
    color: 'text-blue-500',
    gradient: 'from-blue-600 to-blue-700',
    authEndpoint: '/api/social/auth/facebook/connect',
    needsOrgId: true
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: SiYoutube,
    color: 'text-red-500',
    gradient: 'from-red-600 to-red-700',
    authEndpoint: '/api/social/auth/youtube/connect',
    needsOrgId: true
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: SiX,
    color: 'text-gray-700',
    gradient: 'from-gray-700 to-gray-900',
    authEndpoint: '/api/social/auth/twitter/connect',
    needsOrgId: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: SiLinkedin,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-800',
    authEndpoint: '/api/social/auth/linkedin/connect',
    needsOrgId: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: SiTiktok,
    color: 'text-gray-900',
    gradient: 'from-gray-900 via-pink-500 to-cyan-500',
    authEndpoint: '/api/social/auth/tiktok/connect',
    needsOrgId: true
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: FcGoogle,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-green-500',
    authEndpoint: '/api/social/auth/google/connect',
    needsOrgId: true
  }
];

export function ConnectSocialModal({ open, onClose, theme = 'dark' }: ConnectSocialModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar organizationId do usuário logado
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token não encontrado');
          return;
        }

        // Buscar organizações do usuário
        const response = await fetch('/api/organizations/my-organizations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar organizações');
        }

        const result = await response.json();
        const orgs = result.data || [];

        if (orgs.length > 0) {
          // Usar primeira organização por padrão
          setOrganizationId(orgs[0].id);
        } else {
          console.error('Nenhuma organização encontrada');
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      }
    };

    if (open) {
      fetchOrganization();
    }
  }, [open]);

  const handleConnect = async (network: typeof socialNetworks[0]) => {
    if (!organizationId) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada. Por favor, recarregue a página.',
        variant: 'destructive'
      });
      return;
    }

    setConnecting(network.id);

    try {
      // Construir URL com organizationId
      const authUrl = `${network.authEndpoint}?organizationId=${organizationId}`;

      // Buscar authUrl do backend
      const response = await fetch(authUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar autenticação');
      }

      const result = await response.json();

      // Redirecionar para URL de autorização da rede social
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com a rede social. Tente novamente.',
        variant: 'destructive'
      });
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[600px]",
        theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white'
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          )}>
            Conectar Rede Social
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Selecione a rede social que deseja conectar. Você será redirecionado para fazer login e autorizar a conexão.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialNetworks.map((network) => {
              const Icon = network.icon;
              const isConnecting = connecting === network.id;

              return (
                <button
                  key={network.id}
                  onClick={() => handleConnect(network)}
                  disabled={isConnecting}
                  className={cn(
                    "glass-3d p-6 rounded-xl transition-all duration-200 hover:scale-105",
                    "flex flex-col items-center gap-3 group",
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    `bg-gradient-to-r ${network.gradient}`
                  )}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <span className={cn(
                    "font-medium",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {network.name}
                  </span>

                  {isConnecting ? (
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Conectando...
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                      Clique para conectar
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
