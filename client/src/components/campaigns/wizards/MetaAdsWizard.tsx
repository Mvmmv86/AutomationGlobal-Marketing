import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { X, ArrowRight, ArrowLeft, Check, Info, Target, Users, DollarSign, Loader2 } from 'lucide-react';
import { SiInstagram, SiFacebook } from 'react-icons/si';

interface MetaAdsWizardProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'facebook';
  theme?: 'dark' | 'light';
}

// Passo 1: Objetivos Simplificados (baseado na Meta Ads API v24.0)
const objectives = [
  {
    id: 'OUTCOME_SALES',
    title: 'Aumentar Vendas',
    description: 'Ideal para lojas online. Vamos direcionar pessoas prontas para comprar seus produtos.',
    icon: '🛒',
    examples: 'Ex: E-commerce, Produtos Digitais, Serviços Online',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'OUTCOME_LEADS',
    title: 'Capturar Leads',
    description: 'Perfeito para coletar contatos. Vamos buscar pessoas interessadas em seu negócio.',
    icon: '📧',
    examples: 'Ex: Newsletter, Consultas, Orçamentos, Downloads',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'OUTCOME_AWARENESS',
    title: 'Divulgar Marca',
    description: 'Ótimo para começar. Vamos mostrar sua marca para mais pessoas.',
    icon: '📢',
    examples: 'Ex: Lançamentos, Eventos, Novos Negócios',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'OUTCOME_ENGAGEMENT',
    title: 'Engajamento',
    description: 'Aumente a interação. Vamos fazer mais pessoas curtirem, comentarem e compartilharem.',
    icon: '❤️',
    examples: 'Ex: Posts, Vídeos, Conteúdo Viral',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'OUTCOME_TRAFFIC',
    title: 'Tráfego para Site',
    description: 'Traga visitantes. Vamos direcionar pessoas para seu site ou landing page.',
    icon: '🌐',
    examples: 'Ex: Blog, Site Institucional, Promoções',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'OUTCOME_APP_PROMOTION',
    title: 'Promover App',
    description: 'Mais instalações. Vamos incentivar downloads do seu aplicativo.',
    icon: '📱',
    examples: 'Ex: Apps iOS/Android, Jogos, Aplicativos Mobile',
    color: 'from-teal-500 to-green-600'
  }
];

// Passo 2: Público-Alvo Simplificado
const audienceOptions = [
  {
    id: 'broad',
    title: 'Público Amplo',
    description: 'Deixe a Meta encontrar as melhores pessoas automaticamente',
    icon: '🌍',
    recommended: true
  },
  {
    id: 'local',
    title: 'Região Específica',
    description: 'Pessoas na sua cidade ou estado',
    icon: '📍',
    recommended: false
  },
  {
    id: 'interests',
    title: 'Por Interesses',
    description: 'Pessoas interessadas em temas específicos',
    icon: '🎯',
    recommended: false
  },
  {
    id: 'lookalike',
    title: 'Similares aos Clientes',
    description: 'Pessoas parecidas com quem já comprou de você',
    icon: '👥',
    recommended: false
  }
];

export function MetaAdsWizard({
  isOpen,
  onClose,
  platform,
  theme = 'dark'
}: MetaAdsWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('broad');
  const [budget, setBudget] = useState<number>(20);
  const [duration, setDuration] = useState<number>(7);

  const platformConfig = {
    instagram: {
      icon: SiInstagram,
      name: 'Instagram',
      color: 'from-purple-500 via-pink-500 to-orange-500'
    },
    facebook: {
      icon: SiFacebook,
      name: 'Facebook',
      color: 'from-blue-600 to-blue-700'
    }
  };

  const config = platformConfig[platform];
  const PlatformIcon = config.icon;

  // Cálculos estimados
  const totalBudget = budget * duration;
  const estimatedReach = Math.floor((totalBudget / 0.50) * 1000); // Estimativa: $0.50 CPM
  const estimatedClicks = Math.floor(totalBudget * 50); // Estimativa: 50 clicks por $1

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Mutation para criar campanha via Meta Ads API
  const createCampaignMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await fetch('/api/meta-ads/campaigns/create-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar campanha');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Campanha criada com sucesso!',
        description: `Sua campanha foi criada no Meta Ads Manager e está pausada. Você pode ativá-la a qualquer momento.`,
      });
      console.log('✅ Campaign created:', data.data);
      onClose();
      // TODO: Redirecionar para a página de detalhes da campanha ou recarregar lista
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCreate = () => {
    // Validar dados necessários
    if (!selectedObjective) {
      toast({
        title: 'Objetivo obrigatório',
        description: 'Por favor, selecione um objetivo para sua campanha.',
        variant: 'destructive'
      });
      return;
    }

    // Preparar targeting baseado no tipo de público
    let targeting: any = {
      geo_locations: { countries: ['BR'] },
      age_min: 18,
      age_max: 65
    };

    // Ajustar targeting conforme opção selecionada
    // (Por enquanto, vamos usar targeting amplo. Targeting avançado seria implementado aqui)

    // Preparar parâmetros da campanha
    const campaignParams = {
      socialAccountId: 1, // TODO: Pegar do contexto/usuário logado
      campaignName: `Campanha ${platform.toUpperCase()} - ${new Date().toLocaleDateString()}`,
      objective: selectedObjective,
      optimization_goal: selectedObjective === 'OUTCOME_SALES' ? 'OFFSITE_CONVERSIONS' : 'LINK_CLICKS',
      daily_budget: budget,
      targeting,
      pageId: 'YOUR_PAGE_ID', // TODO: Buscar do social account
      instagramActorId: platform === 'instagram' ? 'YOUR_IG_ACCOUNT_ID' : undefined, // TODO: Buscar do social account
      message: `Confira nossa oferta especial!`, // TODO: Permitir personalizar
      link: 'https://example.com', // TODO: Permitir usuário informar
      callToAction: 'LEARN_MORE', // TODO: Mapear baseado no objetivo
      imageUrl: undefined // TODO: Permitir upload de imagem
    };

    console.log('Creating campaign with params:', campaignParams);
    createCampaignMutation.mutate(campaignParams);
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedObjective !== '';
    if (currentStep === 2) return selectedAudience !== '';
    if (currentStep === 3) return budget > 0 && duration > 0;
    return false;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Wizard Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass-3d rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto animate-scaleIn shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com Plataforma */}
          <div className={cn(
            "relative p-6 border-b border-white/10",
            `bg-gradient-to-r ${config.color}`
          )}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PlatformIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Nova Campanha {config.name}
                </h2>
                <p className="text-white/80 text-sm">
                  Siga os 3 passos simples para criar sua campanha
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "flex-1 h-2 rounded-full transition-all duration-300",
                    currentStep >= step
                      ? "bg-white"
                      : "bg-white/20"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
            {/* PASSO 1: Objetivo */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className={cn(
                    "text-2xl font-bold mb-2",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Qual é o seu objetivo?
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Escolha o que você quer alcançar com esta campanha
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setSelectedObjective(obj.id)}
                      className={cn(
                        "relative p-6 rounded-xl border-2 transition-all duration-300 text-left",
                        "hover:scale-105 hover:shadow-xl",
                        selectedObjective === obj.id
                          ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                          : theme === 'dark'
                            ? "border-white/10 bg-white/5 hover:border-white/20"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      {/* Selected Check */}
                      {selectedObjective === obj.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="text-4xl mb-3">{obj.icon}</div>
                      <h4 className={cn(
                        "font-bold text-lg mb-2",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {obj.title}
                      </h4>
                      <p className={cn(
                        "text-sm mb-3",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {obj.description}
                      </p>
                      <div className={cn(
                        "text-xs px-3 py-1 rounded-lg inline-block",
                        theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'
                      )}>
                        {obj.examples}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PASSO 2: Público */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className={cn(
                    "text-2xl font-bold mb-2",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Quem você quer alcançar?
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Defina seu público-alvo de forma simples
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audienceOptions.map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => setSelectedAudience(aud.id)}
                      className={cn(
                        "relative p-6 rounded-xl border-2 transition-all duration-300 text-left",
                        "hover:scale-105 hover:shadow-xl",
                        selectedAudience === aud.id
                          ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : theme === 'dark'
                            ? "border-white/10 bg-white/5 hover:border-white/20"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      {/* Recommended Badge */}
                      {aud.recommended && (
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                            Recomendado
                          </div>
                        </div>
                      )}

                      {/* Selected Check */}
                      {selectedAudience === aud.id && !aud.recommended && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="text-4xl mb-3">{aud.icon}</div>
                      <h4 className={cn(
                        "font-bold text-lg mb-2",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {aud.title}
                      </h4>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {aud.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Info Box */}
                <div className={cn(
                  "p-4 rounded-lg flex gap-3",
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'
                )}>
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <strong>Dica:</strong> Se é sua primeira campanha, recomendamos começar com "Público Amplo".
                      O algoritmo da Meta vai aprender automaticamente quem se interessa pelo seu conteúdo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PASSO 3: Orçamento */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className={cn(
                    "text-2xl font-bold mb-2",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Quanto você quer investir?
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Defina seu orçamento diário e duração da campanha
                  </p>
                </div>

                {/* Budget Slider */}
                <div className={cn(
                  "p-6 rounded-xl",
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                )}>
                  <label className={cn(
                    "block text-sm font-medium mb-4",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Orçamento Diário: <span className="text-green-400 font-bold">R$ {budget.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-green"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>R$ 5/dia</span>
                    <span>R$ 500/dia</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className={cn(
                  "p-6 rounded-xl",
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                )}>
                  <label className={cn(
                    "block text-sm font-medium mb-4",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Duração: <span className="text-blue-400 font-bold">{duration} dias</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-blue"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 dia</span>
                    <span>30 dias</span>
                  </div>
                </div>

                {/* Summary Card */}
                <div className={cn(
                  "p-6 rounded-xl border-2",
                  "bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-400/30"
                )}>
                  <h4 className={cn(
                    "font-bold text-lg mb-4 flex items-center gap-2",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    📊 Resumo do Investimento
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={cn(
                        "text-sm mb-1",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Investimento Total
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        R$ {totalBudget.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className={cn(
                        "text-sm mb-1",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Alcance Estimado
                      </p>
                      <p className="text-2xl font-bold text-blue-400">
                        {estimatedReach.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className={cn(
                        "text-sm mb-1",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Cliques Estimados
                      </p>
                      <p className="text-xl font-bold text-purple-400">
                        {estimatedClicks.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className={cn(
                        "text-sm mb-1",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Custo por Clique
                      </p>
                      <p className="text-xl font-bold text-orange-400">
                        R$ {(totalBudget / estimatedClicks).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className={cn(
                  "p-4 rounded-lg flex gap-3",
                  theme === 'dark' ? 'bg-green-500/10 border border-green-400/30' : 'bg-green-50 border border-green-200'
                )}>
                  <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <strong>Valores estimados:</strong> Os resultados reais podem variar dependendo da competição,
                      qualidade do anúncio e segmentação. A Meta otimiza automaticamente para melhores resultados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className={cn(
            "p-6 border-t flex justify-between items-center",
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          )}>
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(
                "px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all",
                currentStep === 1
                  ? "opacity-50 cursor-not-allowed"
                  : theme === 'dark'
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors",
                  theme === 'dark'
                    ? "bg-white/5 hover:bg-white/10 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Cancelar
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={cn(
                    "px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all",
                    canProceed()
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!canProceed() || createCampaignMutation.isPending}
                  className={cn(
                    "px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all",
                    canProceed() && !createCampaignMutation.isPending
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Criar Campanha
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
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
            transform: scale(0.95);
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

        .slider-green::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
        }

        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}
