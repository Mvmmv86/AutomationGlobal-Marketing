import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Building2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business?: {
    id: string;
    name: string;
  };
}

interface SelectAdAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialAccountId: number;
  platform: 'facebook' | 'instagram';
  theme?: 'dark' | 'light';
}

const getAccountStatusInfo = (status: number) => {
  switch (status) {
    case 1:
      return { label: 'Ativa', color: 'text-green-500', icon: CheckCircle };
    case 2:
      return { label: 'Desativada', color: 'text-red-500', icon: AlertCircle };
    case 3:
      return { label: 'Não Liquidada', color: 'text-yellow-500', icon: AlertCircle };
    case 7:
      return { label: 'Em Revisão', color: 'text-orange-500', icon: AlertCircle };
    default:
      return { label: 'Desconhecida', color: 'text-gray-500', icon: AlertCircle };
  }
};

export function SelectAdAccountModal({
  isOpen,
  onClose,
  socialAccountId,
  platform,
  theme = 'dark'
}: SelectAdAccountModalProps) {
  const { toast } = useToast();
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(null);

  // Buscar Ad Accounts disponíveis
  const { data: adAccounts, isLoading, error } = useQuery({
    queryKey: [`/api/social/auth/facebook/ad-accounts`, socialAccountId],
    queryFn: async () => {
      const response = await fetch(
        `/api/social/auth/facebook/ad-accounts?socialAccountId=${socialAccountId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar Ad Accounts');
      }

      const result = await response.json();
      return result.data as AdAccount[];
    },
    enabled: isOpen && !!socialAccountId
  });

  // Mutation para salvar Ad Account selecionada
  const saveAdAccountMutation = useMutation({
    mutationFn: async (adAccount: AdAccount) => {
      const response = await fetch('/api/social/auth/facebook/select-ad-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          socialAccountId,
          adAccountId: adAccount.id,
          adAccountName: adAccount.name,
          currency: adAccount.currency,
          timezone: adAccount.timezone_name,
          businessId: adAccount.business?.id,
          businessName: adAccount.business?.name
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar Ad Account');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Ad Account configurada!',
        description: 'Sua conta de anúncios foi configurada com sucesso.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao configurar Ad Account',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSelectAdAccount = () => {
    if (selectedAdAccount) {
      saveAdAccountMutation.mutate(selectedAdAccount);
    }
  };

  // Auto-selecionar se houver apenas uma Ad Account ativa
  useEffect(() => {
    if (adAccounts && adAccounts.length === 1 && adAccounts[0].account_status === 1) {
      setSelectedAdAccount(adAccounts[0]);
    }
  }, [adAccounts]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass-3d rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden pointer-events-auto animate-scaleIn shadow-2xl"
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
              Configurar Conta de Anúncios
            </h2>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Selecione a conta de anúncios do Meta que deseja usar para criar campanhas
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Erro ao carregar Ad Accounts
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {(error as Error).message}
                </p>
              </div>
            ) : !adAccounts || adAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Nenhuma Ad Account Encontrada
                </h3>
                <p className={cn(
                  "text-sm mb-6",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Você precisa criar uma conta de anúncios no Meta Business Manager primeiro
                </p>
                <a
                  href="https://business.facebook.com/settings/ad-accounts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button-3d px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Criar Ad Account
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {adAccounts.map((account) => {
                    const statusInfo = getAccountStatusInfo(account.account_status);
                    const StatusIcon = statusInfo.icon;
                    const isSelected = selectedAdAccount?.id === account.id;

                    return (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAdAccount(account)}
                        className={cn(
                          "w-full p-6 rounded-xl border-2 transition-all duration-200 text-left",
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 scale-102"
                            : theme === 'dark'
                              ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                              : "border-gray-200 bg-gray-50 hover:bg-gray-100",
                          account.account_status !== 1 && "opacity-50"
                        )}
                        disabled={account.account_status !== 1}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className={cn(
                              "font-bold text-lg mb-1",
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                              {account.name}
                            </h4>
                            <p className={cn(
                              "text-sm",
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              ID: {account.account_id}
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Business Info */}
                        {account.business && (
                          <div className={cn(
                            "text-sm mb-3 flex items-center gap-2",
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            <Building2 className="w-4 h-4" />
                            {account.business.name}
                          </div>
                        )}

                        {/* Status + Currency + Timezone */}
                        <div className="flex flex-wrap gap-2">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                            theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                          )}>
                            <StatusIcon className={cn("w-3 h-3", statusInfo.color)} />
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </div>

                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
                          )}>
                            {account.currency}
                          </div>

                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
                          )}>
                            {account.timezone_name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Info Box */}
                <div className={cn(
                  "p-4 rounded-lg border",
                  theme === 'dark'
                    ? 'bg-blue-500/10 border-blue-400/30'
                    : 'bg-blue-50 border-blue-200'
                )}>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  )}>
                    💡 <strong>Dica:</strong> Você pode alterar a Ad Account selecionada a qualquer momento
                    nas configurações da sua conta {platform === 'facebook' ? 'Facebook' : 'Instagram'}.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {adAccounts && adAccounts.length > 0 && (
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors",
                  theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                )}
              >
                Pular por Agora
              </button>

              <button
                onClick={handleSelectAdAccount}
                disabled={!selectedAdAccount || saveAdAccountMutation.isPending}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-all",
                  "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                  "hover:from-blue-600 hover:to-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg hover:shadow-xl"
                )}
              >
                {saveAdAccountMutation.isPending ? 'Salvando...' : 'Confirmar Seleção'}
              </button>
            </div>
          )}
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

        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}
