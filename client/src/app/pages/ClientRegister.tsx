import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Sparkles, Lock, Mail, Loader2, AlertCircle, ArrowRight, User, Building2 } from 'lucide-react';

// Validation Schema
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().optional(),
  organizationName: z.string().min(2, 'Nome da organização deve ter no mínimo 2 caracteres'),
  plan: z.enum(['starter', 'professional', 'enterprise']).default('starter')
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function ClientRegister() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      plan: 'starter'
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...registerData } = data;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar conta');
      }

      // Salvar token, dados do usuário e organização
      const data = result.data || result; // Suporta ambos os formatos
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('organizationId', data.organization?.id || '');
      localStorage.setItem('organization', JSON.stringify(data.organization || {}));

      // Redirect para dashboard
      setLocation('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation('/login');
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal para começar',
      features: ['5 campanhas', 'Analytics básico', 'Suporte por email']
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Para equipes crescentes',
      features: ['Campanhas ilimitadas', 'Analytics completo', 'IA integrada', 'Suporte prioritário']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Recursos avançados',
      features: ['Tudo do Professional', 'Multi-usuários', 'API access', 'Suporte dedicado']
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Register Container */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-500 rounded-3xl shadow-2xl shadow-purple-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            AutomationGlobal
          </h1>
          <p className="text-slate-600 text-sm">
            Crie sua conta gratuita e comece agora
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Plan Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl shadow-2xl shadow-black/5">
              <CardHeader>
                <CardTitle className="text-lg">Escolha seu Plano</CardTitle>
                <CardDescription className="text-sm">
                  Comece grátis e faça upgrade quando precisar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.id as any);
                      setValue('plan', plan.id as any);
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? 'border-indigo-500 bg-indigo-50/80 shadow-md'
                        : 'border-slate-200 bg-white/50 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                        <p className="text-xs text-slate-600">{plan.description}</p>
                      </div>
                      {selectedPlan === plan.id && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                          <span className="text-green-500">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Registration Form */}
          <div className="lg:col-span-2">
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl shadow-2xl shadow-black/5">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Crie sua conta
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Preencha os dados abaixo para começar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-700 font-medium">
                        Nome *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="João"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-900 h-11"
                          {...register('firstName')}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-700 font-medium">
                        Sobrenome
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Silva"
                        className="bg-white/80 border-slate-200 text-slate-900 h-11"
                        {...register('lastName')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 bg-white/80 border-slate-200 text-slate-900 h-11"
                        {...register('email')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Organization Name */}
                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="text-slate-700 font-medium">
                      Nome da Organização *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="Minha Empresa"
                        className="pl-10 bg-white/80 border-slate-200 text-slate-900 h-11"
                        {...register('organizationName')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.organizationName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.organizationName.message}
                      </p>
                    )}
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700 font-medium">
                        Senha *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-900 h-11"
                          {...register('password')}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                        Confirmar Senha *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-900 h-11"
                          {...register('confirmPassword')}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Hidden Plan Field */}
                  <input type="hidden" {...register('plan')} value={selectedPlan} />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-700 hover:via-indigo-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Criar Conta Gratuita
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/70 px-2 text-slate-500">
                        Já tem uma conta?
                      </span>
                    </div>
                  </div>

                  {/* Back to Login Link */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    className="w-full h-11 border-slate-200 bg-white/50 hover:bg-white text-slate-700 font-medium transition-all duration-200"
                  >
                    Fazer Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Ao criar uma conta, você concorda com nossos{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
