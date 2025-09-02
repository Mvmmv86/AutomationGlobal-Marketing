import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Building2, Users, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function AccessHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(59, 130, 246, 0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
              <Shield size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Automation Global v4.0
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Plataforma de automação multi-tenant com ambientes isolados por organização
          </p>
        </div>

        {/* Access Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Organization Access */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform duration-300">
                  <Building2 size={32} className="text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Acesso da Organização
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Faça login com suas credenciais específicas da organização
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Ambiente isolado e personalizado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Design 3D Glass Morphism</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Dados e configurações exclusivas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Temas claro/escuro configuráveis</span>
                </div>
              </div>

              <Link href="/org-login">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 group"
                  data-testid="button-org-login"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Entrar como Organização</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              </Link>

              <div className="text-center text-sm text-gray-400">
                Entre em contato com seu administrador para<br />
                obter suas credenciais de acesso
              </div>
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:scale-110 transition-transform duration-300">
                  <Shield size={32} className="text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Painel Administrativo
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Gerencie organizações e tenha acesso master completo
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Criar e gerenciar organizações</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Acesso a qualquer organização</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Design futurístico neon</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Controle total do sistema</span>
                </div>
              </div>

              <Link href="/admin">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 group"
                  data-testid="button-admin-panel"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Acessar Admin</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              </Link>

              <div className="text-center text-sm text-gray-400">
                Apenas usuários com privilégios de<br />
                administrador podem acessar
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            Recursos da Plataforma
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-md bg-white/5 border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Tenant</h3>
              <p className="text-gray-400 text-sm">
                Isolamento completo entre organizações com dados e configurações independentes
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/5 border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Segurança</h3>
              <p className="text-gray-400 text-sm">
                Autenticação robusta com sessões independentes e controle de acesso granular
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/5 border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Personalização</h3>
              <p className="text-gray-400 text-sm">
                Design systems únicos para cada tipo de organização com temas configuráveis
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Automation Global v4.0 - Plataforma Multi-Tenant de Automação Inteligente</p>
        </div>
      </div>
    </div>
  );
}