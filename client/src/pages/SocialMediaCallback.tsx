import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

/**
 * Página de callback OAuth para redes sociais
 *
 * Após o usuário autorizar a conexão com Facebook/Instagram/YouTube,
 * o backend redireciona para esta página com parâmetros de sucesso/erro
 */
export default function SocialMediaCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Pegar parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platform = params.get('platform') || success?.replace('-connected', '');
    const accounts = params.get('accounts');

    if (success) {
      // Mostrar toast de sucesso
      toast({
        title: 'Conta conectada!',
        description: `Sua conta ${platform?.toUpperCase()} foi conectada com sucesso.`,
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
        } catch (e) {
          console.error('Erro ao parsear contas:', e);
        }
      }

      // Redirecionar para dashboard após 2 segundos
      setTimeout(() => {
        setLocation('/app/dashboard');
      }, 2000);

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
  );
}
