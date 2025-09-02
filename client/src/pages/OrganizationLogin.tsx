import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Building2, LogIn, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface OrganizationLoginResponse {
  success: boolean;
  sessionToken: string;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  credentials: {
    displayName: string;
    accessLevel: string;
  };
  expiresAt: string;
}

export default function OrganizationLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('/api/org-auth/organization/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json() as Promise<OrganizationLoginResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Store session token
        localStorage.setItem('org_session_token', data.sessionToken);
        localStorage.setItem('org_access_type', 'organization');
        localStorage.setItem('org_data', JSON.stringify({
          organization: data.organization,
          credentials: data.credentials,
          expiresAt: data.expiresAt
        }));

        // Redirect based on organization type
        if (data.organization.type === 'marketing') {
          setLocation(`/marketing/${data.organization.id}`);
        } else if (data.organization.type === 'support') {
          setLocation(`/support/${data.organization.id}`);
        } else if (data.organization.type === 'trading') {
          setLocation(`/trading/${data.organization.id}`);
        } else {
          setLocation('/dashboard');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(59, 130, 246, 0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back to Home Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors">
          <ArrowLeft size={16} />
          <span>Voltar ao início</span>
        </Link>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                <Building2 size={32} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Login da Organização
            </CardTitle>
            <CardDescription className="text-gray-300">
              Entre com suas credenciais específicas da organização
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/50 text-red-100">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email da Organização
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="marketing@empresa.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  data-testid="input-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 pr-10"
                    data-testid="input-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={16} />
                    Entrar
                  </div>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-white/10">
              <p className="text-center text-sm text-gray-400">
                É administrador?{' '}
                <Link 
                  href="/admin-login" 
                  className="text-blue-400 hover:text-blue-300 font-medium"
                  data-testid="link-admin-login"
                >
                  Acesse o painel administrativo
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Cada organização possui suas próprias credenciais de acesso.
            <br />
            Entre em contato com seu administrador para obter suas credenciais.
          </p>
        </div>
      </div>
    </div>
  );
}