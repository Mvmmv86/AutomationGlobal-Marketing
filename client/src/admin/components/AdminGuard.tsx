import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard - Protege rotas que requerem acesso admin
 * Valida token JWT e role (super_admin ou org_owner)
 * Redireciona para /admin/login se não autorizado
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const [, setLocation] = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    validateAdmin();
  }, []);

  async function validateAdmin() {
    const token = localStorage.getItem('adminToken');

    // Sem token = redirect para login
    if (!token) {
      console.log('🔒 AdminGuard: Sem token, redirecionando para login');
      setLocation('/admin/login');
      setIsValidating(false);
      return;
    }

    try {
      // Validar token com backend
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AdminGuard: Usuário autorizado', data.user.email);
        setIsAuthorized(true);
      } else {
        console.log('❌ AdminGuard: Token inválido, removendo e redirecionando');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        setLocation('/admin/login');
      }
    } catch (error) {
      console.error('❌ AdminGuard: Erro ao validar:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      setLocation('/admin/login');
    } finally {
      setIsValidating(false);
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg font-medium">Validando acesso...</p>
        </div>
      </div>
    );
  }

  // Se autorizado, mostra o conteúdo
  // Se não, já redirecionou e retorna null
  return isAuthorized ? <>{children}</> : null;
}
