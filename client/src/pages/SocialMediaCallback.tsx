import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { SelectAdAccountModal } from '@/components/social/SelectAdAccountModal';

/**
 * Página de callback OAuth para redes sociais
 *
 * Após o usuário autorizar a conexão com Facebook/Instagram/YouTube,
 * o backend redireciona para esta página com parâmetros de sucesso/erro
 */
export default function SocialMediaCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAdAccountModal, setShowAdAccountModal] = useState(false);
  const [socialAccountId, setSocialAccountId] = useState<number | null>(null);
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | null>(null);

  useEffect(() => {
    // Pegar parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platformParam = params.get('platform') || success?.replace('-connected', '');
    const accounts = params.get('accounts');
    const accountIdParam = params.get('accountId');

    if (success) {
      // Mostrar toast de sucesso
      toast({
        title: 'Conta conectada!',
        description: `Sua conta ${platformParam?.toUpperCase()} foi conectada com sucesso.`,
      });

      // Se houver múltiplas contas (Facebook + Instagram), mostrar detalhes
      if (accounts) {
        try {
          const accountsList = JSON.parse(decodeURIComponent(accounts));
          console.log('✅ Contas conectadas:', accountsList);

          // Mostrar um toast adicional se houver Instagram + Facebook
          if (accountsList.length > 1) {
            toast({
              title: `${accountsList.length} contas conectadas`,
              description: accountsList.map((acc: any) =>
                acc.type === 'facebook' ? `Facebook: ${acc.pageName}` : `Instagram: @${acc.igUsername}`
              ).join(', '),
            });
          }

          // Para Facebook/Instagram, mostrar modal de seleção de Ad Account
          if (platformParam === 'facebook' || platformParam === 'instagram') {
            // Salvar primeiro a conta antes de mostrar o modal de Ad Account
            // (isso já foi feito pelo backend, agora precisamos do accountId)

            // IMPORTANTE: Por enquanto vamos usar um timeout para dar tempo do backend salvar
            // Em produção, o backend deveria retornar o accountId na URL
            setTimeout(() => {
              // Aqui precisaríamos buscar o socialAccountId do backend
              // Por enquanto, vamos mostrar o modal após salvar manualmente
              if (accountIdParam) {
                setSocialAccountId(parseInt(accountIdParam));
                setPlatform(platformParam as 'facebook' | 'instagram');
                setShowAdAccountModal(true);
              } else {
                // Se não tiver accountId, redirecionar normalmente
                setLocation('/app/dashboard');
              }
            }, 1500);
            return; // Não redirecionar ainda
          }
        } catch (e) {
          console.error('Erro ao parsear contas:', e);
        }
      }

      // Para outras plataformas ou se não houver accounts, redirecionar normalmente
      if (platformParam !== 'facebook' && platformParam !== 'instagram') {
        setTimeout(() => {
          setLocation('/app/dashboard');
        }, 2000);
      }

    } else if (error) {
      // Mostrar toast de erro
      toast({
        title: 'Erro ao conectar',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });

      // Redirecionar para dashboard após 3 segundos
      setTimeout(() => {
        setLocation('/app/dashboard');
      }, 3000);
    } else {
      // Sem parâmetros, redirecionar imediatamente
      setLocation('/app/dashboard');
    }
  }, [setLocation, toast]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Processando autenticação...
          </h2>
          <p className="text-gray-600">
            Por favor, aguarde enquanto conectamos sua conta.
          </p>
        </div>
      </div>

      {/* Modal de seleção de Ad Account (Facebook/Instagram) */}
      {showAdAccountModal && socialAccountId && platform && (
        <SelectAdAccountModal
          isOpen={showAdAccountModal}
          onClose={() => {
            setShowAdAccountModal(false);
            setLocation('/app/dashboard');
          }}
          socialAccountId={socialAccountId}
          platform={platform}
        />
      )}
    </>
  );
}
