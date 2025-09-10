import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  Bot, 
  Mail, 
  MessageSquare, 
  Target, 
  HeadphonesIcon, 
  ShoppingCart,
  Calendar,
  Zap,
  BarChart3,
  Settings,
  Play,
  Pause,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AutomationCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'active' | 'inactive' | 'configuring' | 'draft';
  category: string;
  metrics?: {
    executions?: number;
    successRate?: number;
    lastRun?: string;
    revenue?: string;
  };
  gradient: string;
}

const automationCards: AutomationCard[] = [
  {
    id: 'content-automation',
    title: 'Automação de Conteúdo',
    description: 'Busca notícias, gera posts para blog e Instagram com IA',
    icon: Bot,
    status: 'configuring',
    category: 'Marketing',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Nunca executado'
    },
    gradient: 'from-purple-500 to-blue-500'
  },
  {
    id: 'email-marketing',
    title: 'E-mail Marketing',
    description: 'Campanhas automatizadas baseadas em comportamento',
    icon: Mail,
    status: 'draft',
    category: 'Marketing',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Não configurado'
    },
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 'social-media',
    title: 'Posts Sociais',
    description: 'Agendamento inteligente para redes sociais',
    icon: MessageSquare,
    status: 'draft',
    category: 'Marketing',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Não configurado'
    },
    gradient: 'from-pink-500 to-red-500'
  },
  {
    id: 'lead-nurturing',
    title: 'Nutrição de Leads',
    description: 'Sequências automáticas para converter prospects',
    icon: Target,
    status: 'draft',
    category: 'Vendas',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Não configurado'
    },
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    id: 'customer-support',
    title: 'Suporte ao Cliente',
    description: 'Respostas automáticas e triagem de tickets',
    icon: HeadphonesIcon,
    status: 'draft',
    category: 'Suporte',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Não configurado'
    },
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'sales-funnel',
    title: 'Funil de Vendas',
    description: 'Automação completa do processo de vendas',
    icon: ShoppingCart,
    status: 'draft',
    category: 'Vendas',
    metrics: {
      executions: 0,
      successRate: 0,
      lastRun: 'Não configurado'
    },
    gradient: 'from-violet-500 to-purple-500'
  }
];

export default function AutomationDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Marketing', 'Vendas', 'Suporte'];

  const handleSelectAutomation = (automationId: string) => {
    if (automationId === 'content-automation') {
      setLocation('/automation/content');
    } else {
      // Para outras automações, pode expandir aqui
      console.log('Automation selected:', automationId);
    }
  };
  
  const filteredCards = selectedCategory === 'all' 
    ? automationCards 
    : automationCards.filter(card => card.category === selectedCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inativo</Badge>;
      case 'configuring':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Configurando</Badge>;
      case 'draft':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Rascunho</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Status</Badge>;
    }
  };

  const glassCardClass = cn(
    "glass-3d border border-white/10 bg-white/5 backdrop-blur-[20px]",
    "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
    "rounded-[20px] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]",
    "hover:translateY-[-8px] cursor-pointer group"
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Centro de Automações
            </h1>
            <p className="text-white/60 text-lg">
              Configure e gerencie todos os seus fluxos automatizados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="glass-button-3d gradient-purple-blue"
              data-testid="button-new-automation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Automação
            </Button>
          </div>
        </div>

        {/* Estatísticas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={cn(glassCardClass, "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Automações Ativas</div>
                <div className="text-xl font-bold text-white">1</div>
              </div>
            </div>
          </div>

          <div className={cn(glassCardClass, "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Execuções Hoje</div>
                <div className="text-xl font-bold text-white">0</div>
              </div>
            </div>
          </div>

          <div className={cn(glassCardClass, "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Taxa de Sucesso</div>
                <div className="text-xl font-bold text-white">95%</div>
              </div>
            </div>
          </div>

          <div className={cn(glassCardClass, "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Tempo Economizado</div>
                <div className="text-xl font-bold text-white">0h</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros por Categoria */}
        <div className="flex items-center gap-3">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "transition-all duration-300",
                selectedCategory === category 
                  ? "glass-button-3d gradient-purple-blue text-white"
                  : "border-white/30 text-white/70 hover:text-white hover:bg-white/10"
              )}
              data-testid={`filter-${category}`}
            >
              {category === 'all' ? 'Todas' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Automação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((automation) => (
          <div 
            key={automation.id}
            className={glassCardClass}
            onClick={() => handleSelectAutomation(automation.id)}
            data-testid={`automation-card-${automation.id}`}
          >
            <div className="p-6 space-y-4">
              {/* Header do Card */}
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  automation.gradient
                )}>
                  <automation.icon className="w-6 h-6 text-white" />
                </div>
                {getStatusBadge(automation.status)}
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {automation.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {automation.description}
                </p>
                <div className="text-xs text-white/40 uppercase tracking-wide">
                  {automation.category}
                </div>
              </div>

              {/* Métricas */}
              {automation.metrics && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-white/40 mb-1">Execuções</div>
                      <div className="text-white font-medium">{automation.metrics.executions}</div>
                    </div>
                    <div>
                      <div className="text-white/40 mb-1">Taxa de Sucesso</div>
                      <div className="text-white font-medium">{automation.metrics.successRate}%</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Última Execução</div>
                    <div className="text-white/60 text-xs">{automation.metrics.lastRun}</div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {automation.status === 'active' ? (
                    <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Pause className="w-3 h-3 mr-1" />
                      Pausar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                      <Play className="w-3 h-3 mr-1" />
                      Ativar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 text-cyan-400 text-sm group-hover:translate-x-1 transition-transform">
                  <span>Configurar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card de Nova Automação */}
      <div className={cn(glassCardClass, "border-dashed border-white/20")}>
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Plus className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Criar Nova Automação
            </h3>
            <p className="text-white/60 text-sm">
              Configure um novo fluxo automatizado personalizado para suas necessidades
            </p>
          </div>
          <Button 
            className="glass-button-3d gradient-purple-blue"
            data-testid="button-create-custom-automation"
          >
            <Plus className="w-4 h-4 mr-2" />
            Começar Agora
          </Button>
        </div>
      </div>
    </div>
  );
}