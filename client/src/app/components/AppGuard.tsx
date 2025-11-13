import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface AppGuardProps {
  children: React.ReactNode;
}

/**
 * AppGuard - Protege rotas de client (Marketing Platform)
 * Valida token JWT e organizationId
 * Redireciona para /login se não autorizado
 */
export function AppGuard({ children }: AppGuardProps) {
  const [, setLocation] = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    validateClient();
  }, []);

  async function validateClient() {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organizationId');

    // Sem token ou organizationId = redirect para login
    if (!token || !orgId) {
      console.log('🔒 AppGuard: Sem token/orgId, redirecionando para login');
      setLocation('/login');
      setIsValidating(false);
      return;
    }

    try {
      // Validar token com backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AppGuard: Usuário autorizado', data.user.email);
        setIsAuthorized(true);
      } else {
        console.log('❌ AppGuard: Token inválido, removendo e redirecionando');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('organizationId');
        localStorage.removeItem('organization');
        setLocation('/login');
      }
    } catch (error) {
      console.error('❌ AppGuard: Erro ao validar:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationId');
      localStorage.removeItem('organization');
      setLocation('/login');
    } finally {
      setIsValidating(false);
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 text-lg font-medium">Validando acesso...</p>
        </div>
      </div>
    );
  }

  // Se autorizado, mostra o conteúdo
  // Se não, já redirecionou e retorna null
  return isAuthorized ? <>{children}</> : null;
}
