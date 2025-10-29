import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  FileText,
  TrendingUp,
  Search,
  Play,
  Plus,
  Loader2,
  Globe,
  Clock,
  Target,
  Sparkles,
  BarChart3,
  Zap,
  Check,
  ExternalLink,
  Youtube,
  Hash,
  Newspaper,
  Activity,
  Info,
  Copy,
  Eye,
  CheckCircle,
  CircleX
} from 'lucide-react';
import { SiReddit, SiGooglenews } from 'react-icons/si';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogNiche {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  language: string;
  targetAudience: string;
  contentStyle: string;
  isActive: boolean;
  createdAt: string;
}

interface BlogPost {
  id: string;
  nicheId: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  featuredImageUrl?: string;
  readingTime: number;
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt?: string;
}

interface TrendingTopic {
  id: string;
  nicheId: string;
  term: string;
  source: string;
  sourceType: string;
  score: number;
  metadata: any;
  createdAt: string;
}

interface NewsArticle {
  id: string;
  nicheId: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  source: string;
  sourceName?: string;
  author?: string;
  relevanceScore: number;
  sentiment?: string;
  language: string;
  region: string;
  createdAt: string;
}

interface AutomationState {
  isRunning: boolean;
  currentPhase: 'idle' | 'phase1' | 'phase2' | 'phase3' | 'completed';
  progress: number;
  phase1Data?: { trendsCount: number; newsCount: number };
  phase2Data?: { articlesCount: number; sources: number };
  phase3Data?: { post: BlogPost; stats: any };
  error?: string;
}

export default function BlogAutomation() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trends');
  const [isCreateNicheOpen, setIsCreateNicheOpen] = useState(false);
  const [automationState, setAutomationState] = useState<AutomationState>({
    isRunning: false,
    currentPhase: 'idle',
    progress: 0
  });
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blog niches
  const { data: nichesData, isLoading: isLoadingNiches } = useQuery({
    queryKey: ['/api/blog/niches'],
  });
  const niches = (nichesData as any)?.data || [];

  // Fetch blog posts for selected niche
  const { data: postsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/blog/posts', selectedNiche],
    enabled: !!selectedNiche,
  });
  const posts = (postsData as any)?.data || [];

  // Fetch trending topics for selected niche (Phase 1)
  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['/api/blog/niches', selectedNiche, 'trends'],
    enabled: !!selectedNiche,
  });
  const trends: TrendingTopic[] = (trendsData as any)?.data || [];

  // Fetch news articles for selected niche (Phase 2)
  const { data: newsData, isLoading: isLoadingNews } = useQuery({
    queryKey: ['/api/blog/niches', selectedNiche, 'news'],
    enabled: !!selectedNiche,
  });
  const newsArticles: NewsArticle[] = (newsData as any)?.data || [];

  // Create niche mutation
  const createNicheMutation = useMutation({
    mutationFn: async (data: Partial<BlogNiche>) => {
      const response = await fetch('/api/blog/niches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create niche');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches'] });
      setIsCreateNicheOpen(false);
      toast({
        title: "Sucesso",
        description: "Nicho criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar nicho",
        variant: "destructive",
      });
    },
  });

  // Phase 1: Collect trends mutation
  const collectTrendsMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/niches/${nicheId}/collect-trends`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to collect trends');
      return response.json();
    },
    onSuccess: (data: any) => {
      setAutomationState(prev => ({
        ...prev,
        phase1Data: {
          trendsCount: data.data.trendsCollected || 0,
          newsCount: data.data.newsArticlesCollected || 0
        }
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'news'] });
      toast({
        title: "Fase 1 Concluída",
        description: `${data.data.trendsCollected} tendências coletadas!`,
      });
    },
  });

  // Phase 2: Enhanced News Search mutation
  const searchNewsMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/niches/${nicheId}/search-enhanced-news`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to search news');
      return response.json();
    },
    onSuccess: (data: any) => {
      setAutomationState(prev => ({
        ...prev,
        phase2Data: {
          articlesCount: data.data.articlesCollected || 0,
          sources: data.data.uniqueSources || 0
        }
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'news'] });
      toast({
        title: "Fase 2 Concluída",
        description: `${data.data.articlesCollected} artigos encontrados!`,
      });
    },
  });

  // Phase 3: Generate Blog Post mutation
  const generatePostMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/niches/${nicheId}/generate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useMode: 'news' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to generate post');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      setAutomationState(prev => ({
        ...prev,
        phase3Data: {
          post: data.data.post,
          stats: data.data.stats
        }
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', selectedNiche] });
      toast({
        title: "Fase 3 Concluída",
        description: "Blog post gerado com sucesso!",
      });
      setShowPreview(true);
    },
  });

  // Progressive automation flow - EXECUTA TODAS AS FASES AUTOMATICAMENTE
  const runProgressiveAutomation = async () => {
    if (!selectedNiche) return;

    setAutomationState({
      isRunning: true,
      currentPhase: 'phase1',
      progress: 0,
      error: undefined
    });

    try {
      // Phase 1: Collect Trends
      setAutomationState(prev => ({ ...prev, progress: 10 }));
      await collectTrendsMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({ ...prev, currentPhase: 'phase2', progress: 33 }));

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2: Search Enhanced News
      setAutomationState(prev => ({ ...prev, progress: 45 }));
      await searchNewsMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({ ...prev, currentPhase: 'phase3', progress: 66 }));

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 3: Generate Blog Post
      setAutomationState(prev => ({ ...prev, progress: 80 }));
      await generatePostMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({
        ...prev,
        currentPhase: 'completed',
        progress: 100,
        isRunning: false
      }));

    } catch (error) {
      setAutomationState(prev => ({
        ...prev,
        isRunning: false,
        error: 'Erro na automação. Tente novamente.',
        currentPhase: 'idle',
        progress: 0
      }));
      toast({
        title: "Erro na Automação",
        description: "Ocorreu um erro durante o processo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Individual phase runners
  const runPhase1 = async () => {
    if (!selectedNiche || automationState.isRunning) return;

    setAutomationState({
      isRunning: true,
      currentPhase: 'phase1',
      progress: 10,
      error: undefined
    });

    try {
      await collectTrendsMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({
        ...prev,
        currentPhase: 'idle',
        progress: 33,
        isRunning: false
      }));
    } catch (error) {
      setAutomationState(prev => ({
        ...prev,
        isRunning: false,
        error: 'Erro na Fase 1. Tente novamente.',
        currentPhase: 'idle',
        progress: 0
      }));
    }
  };

  const runPhase2 = async () => {
    if (!selectedNiche || automationState.isRunning) return;

    setAutomationState({
      isRunning: true,
      currentPhase: 'phase2',
      progress: 45,
      error: undefined
    });

    try {
      await searchNewsMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({
        ...prev,
        currentPhase: 'idle',
        progress: 66,
        isRunning: false
      }));
    } catch (error) {
      setAutomationState(prev => ({
        ...prev,
        isRunning: false,
        error: 'Erro na Fase 2. Tente novamente.',
        currentPhase: 'idle',
        progress: 33
      }));
    }
  };

  const runPhase3 = async () => {
    if (!selectedNiche || automationState.isRunning) return;

    setAutomationState({
      isRunning: true,
      currentPhase: 'phase3',
      progress: 80,
      error: undefined
    });

    try {
      await generatePostMutation.mutateAsync(selectedNiche);
      setAutomationState(prev => ({
        ...prev,
        currentPhase: 'completed',
        progress: 100,
        isRunning: false
      }));
    } catch (error) {
      setAutomationState(prev => ({
        ...prev,
        isRunning: false,
        error: 'Erro na Fase 3. Tente novamente.',
        currentPhase: 'idle',
        progress: 66
      }));
    }
  };

  // Publish template mutation
  const publishTemplateMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/blog/templates/${postId}/publish`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to publish template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', selectedNiche] });
      toast({
        title: "Post Publicado",
        description: "O template foi publicado com sucesso!",
      });
    },
  });

  const handleCreateNiche = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nicheData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      keywords: (formData.get('keywords') as string).split(',').map(k => k.trim()),
      language: formData.get('language') as string,
      targetAudience: formData.get('targetAudience') as string,
      contentStyle: formData.get('contentStyle') as string,
    };
    createNicheMutation.mutate(nicheData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen p-6 marketing-gradient-bg">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass-3d rounded-3xl p-8 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 glass-3d rounded-2xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Automação de Blog
                </h1>
                <p className="text-gray-300 mt-1">
                  Sistema inteligente de geração de conteúdo baseado em trends reais
                </p>
              </div>
            </div>
            <Dialog open={isCreateNicheOpen} onOpenChange={setIsCreateNicheOpen}>
              <DialogTrigger asChild>
                <Button
                  className="glass-button-3d bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                  data-testid="button-create-niche"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Nicho
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-3d border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto" style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                margin: 0
              }}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-purple-400">
                    Criar Novo Nicho
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateNiche} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-200">Nome do Nicho</Label>
                    <Input
                      id="name"
                      name="name"
                      className="glass-3d-light border-white/20 text-white placeholder-gray-400"
                      placeholder="ex: Tecnologia, Saúde, Finanças"
                      data-testid="input-niche-name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      className="glass-3d-light border-white/20 text-white placeholder-gray-400"
                      placeholder="Descreva o foco e objetivos do nicho"
                      data-testid="input-niche-description"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords" className="text-gray-200">Palavras-chave (separadas por vírgula)</Label>
                    <Input
                      id="keywords"
                      name="keywords"
                      className="glass-3d-light border-white/20 text-white placeholder-gray-400"
                      placeholder="palavra1, palavra2, palavra3"
                      data-testid="input-niche-keywords"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language" className="text-gray-200">Idioma</Label>
                      <Select name="language" defaultValue="pt-BR">
                        <SelectTrigger className="glass-3d-light border-white/20 text-white" data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-3d border-white/10">
                          <SelectItem value="pt-BR">Português (BR)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contentStyle" className="text-gray-200">Estilo de Conteúdo</Label>
                      <Select name="contentStyle" defaultValue="informativo">
                        <SelectTrigger className="glass-3d-light border-white/20 text-white" data-testid="select-content-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-3d border-white/10">
                          <SelectItem value="informativo">Informativo</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="persuasivo">Persuasivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="targetAudience" className="text-gray-200">Público-alvo</Label>
                    <Input
                      id="targetAudience"
                      name="targetAudience"
                      className="glass-3d-light border-white/20 text-white placeholder-gray-400"
                      placeholder="ex: Profissionais de TI, Estudantes, Empreendedores"
                      data-testid="input-target-audience"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full glass-button-3d bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                    disabled={createNicheMutation.isPending}
                    data-testid="button-submit-niche"
                  >
                    {createNicheMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Nicho'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Niches */}
          <div className="lg:col-span-1">
            <Card className="glass-3d border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-purple-400">
                  <Target className="w-5 h-5 mr-2" />
                  Nichos de Blog
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingNiches ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : niches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum nicho criado ainda</p>
                    <p className="text-sm">Clique em "Novo Nicho" para começar</p>
                  </div>
                ) : (
                  niches.map((niche: BlogNiche) => (
                    <div
                      key={niche.id}
                      className={`glass-3d-light rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedNiche === niche.id
                          ? 'ring-2 ring-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/30 border border-purple-400/50'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedNiche(niche.id)}
                      data-testid={`niche-card-${niche.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{niche.name}</h3>
                          {selectedNiche === niche.id && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {niche.keywords.length} keywords
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{niche.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {niche.keywords.slice(0, 3).map((keyword, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg"
                          >
                            {keyword}
                          </span>
                        ))}
                        {niche.keywords.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{niche.keywords.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {selectedNiche ? (
              <div className="space-y-6">
                {/* Automation Controls with Progress */}
                <Card className="glass-3d border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl text-purple-400">
                        <Zap className="w-5 h-5 mr-2" />
                        Automação Inteligente
                      </CardTitle>
                      <Button
                        onClick={runProgressiveAutomation}
                        disabled={automationState.isRunning}
                        className="glass-button-3d bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                        data-testid="button-start-automation"
                      >
                        {automationState.isRunning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Executando Automação...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Automação Completa
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    {automationState.isRunning && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Progresso Total</span>
                          <span className="text-white font-semibold">{automationState.progress}%</span>
                        </div>
                        <Progress value={automationState.progress} className="h-2" />
                      </div>
                    )}

                    {/* Phases Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Phase 1 Card */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase1' ? 'ring-2 ring-green-400 scale-105' : ''
                      }`}>
                        <div className="mx-auto mb-2 text-green-400">
                          {automationState.currentPhase === 'phase1' ? (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          ) : automationState.progress >= 33 ? (
                            <CheckCircle className="w-8 h-8 mx-auto" />
                          ) : (
                            <TrendingUp className="w-8 h-8 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-semibold text-white">Fase 1</h4>
                        <p className="text-sm text-gray-300">Coleta de Trends</p>
                        <p className="text-xs text-gray-400 mt-1">Google, YouTube, Reddit</p>
                        {automationState.phase1Data && (
                          <Badge className="bg-green-500/20 text-green-300 mt-2">
                            {automationState.phase1Data.trendsCount} trends
                          </Badge>
                        )}
                        <Button
                          onClick={runPhase1}
                          disabled={automationState.isRunning}
                          size="sm"
                          className="mt-3 w-full glass-button-3d bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                          data-testid="button-run-phase1"
                        >
                          {automationState.currentPhase === 'phase1' ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Executando...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Executar Fase 1
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Phase 2 Card */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase2' ? 'ring-2 ring-blue-400 scale-105' : ''
                      }`}>
                        <div className="mx-auto mb-2 text-blue-400">
                          {automationState.currentPhase === 'phase2' ? (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          ) : automationState.progress >= 66 ? (
                            <CheckCircle className="w-8 h-8 mx-auto" />
                          ) : (
                            <Search className="w-8 h-8 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-semibold text-white">Fase 2</h4>
                        <p className="text-sm text-gray-300">Busca de Notícias</p>
                        <p className="text-xs text-gray-400 mt-1">Fontes verificadas</p>
                        {automationState.phase2Data && (
                          <Badge className="bg-blue-500/20 text-blue-300 mt-2">
                            {automationState.phase2Data.articlesCount} artigos
                          </Badge>
                        )}
                        <Button
                          onClick={runPhase2}
                          disabled={automationState.isRunning}
                          size="sm"
                          className="mt-3 w-full glass-button-3d bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
                          data-testid="button-run-phase2"
                        >
                          {automationState.currentPhase === 'phase2' ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Executando...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Executar Fase 2
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Phase 3 Card */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase3' ? 'ring-2 ring-purple-400 scale-105' : ''
                      }`}>
                        <div className="mx-auto mb-2 text-purple-400">
                          {automationState.currentPhase === 'phase3' ? (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          ) : automationState.progress >= 100 ? (
                            <CheckCircle className="w-8 h-8 mx-auto" />
                          ) : (
                            <Sparkles className="w-8 h-8 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-semibold text-white">Fase 3</h4>
                        <p className="text-sm text-gray-300">Geração de Conteúdo</p>
                        <p className="text-xs text-gray-400 mt-1">IA com citações</p>
                        {automationState.phase3Data && (
                          <Badge className="bg-purple-500/20 text-purple-300 mt-2">
                            Post Gerado
                          </Badge>
                        )}
                        {newsArticles.length === 0 && (
                          <p className="mt-2 text-xs text-yellow-400">
                            <Info className="w-3 h-3 inline mr-1" />
                            Execute a Fase 2 primeiro
                          </p>
                        )}
                        <Button
                          onClick={runPhase3}
                          disabled={automationState.isRunning || newsArticles.length === 0}
                          size="sm"
                          className="mt-3 w-full glass-button-3d bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="button-run-phase3"
                        >
                          {automationState.currentPhase === 'phase3' ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Executando...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Executar Fase 3
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {automationState.error && (
                      <div className="glass-3d-light rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                        <div className="flex items-center gap-2 text-red-400">
                          <CircleX className="w-5 h-5" />
                          <span>{automationState.error}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blog Post Preview */}
                {showPreview && automationState.phase3Data?.post && (
                  <Card className="glass-3d border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-xl text-purple-400">
                          <Eye className="w-5 h-5 mr-2" />
                          Preview do Blog Gerado
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button-3d border-white/20"
                            onClick={() => copyToClipboard(automationState.phase3Data?.post.content || '')}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button-3d border-white/20"
                            onClick={() => setShowPreview(false)}
                          >
                            Fechar Preview
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] w-full">
                        <div className="space-y-6 pr-4">
                          {/* Title */}
                          <h2 className="text-2xl font-bold text-white">
                            {automationState.phase3Data.post.title}
                          </h2>

                          {/* Featured Image */}
                          {automationState.phase3Data.post.featuredImageUrl && (
                            <div className="w-full h-64 overflow-hidden rounded-xl">
                              <img
                                src={automationState.phase3Data.post.featuredImageUrl}
                                alt={automationState.phase3Data.post.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {automationState.phase3Data.post.readingTime} min de leitura
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {automationState.phase3Data.stats?.wordCount || 0} palavras
                            </span>
                          </div>

                          {/* Summary */}
                          {automationState.phase3Data.post.summary && (
                            <div className="glass-3d-light rounded-xl p-4">
                              <h3 className="font-semibold text-purple-400 mb-2">Resumo</h3>
                              <p className="text-gray-300">
                                {automationState.phase3Data.post.summary}
                              </p>
                            </div>
                          )}

                          {/* Tags */}
                          {automationState.phase3Data.post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {automationState.phase3Data.post.tags.map((tag, idx) => (
                                <Badge key={idx} className="bg-blue-500/20 text-blue-300">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Content */}
                          <div className="prose prose-invert max-w-none">
                            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {automationState.phase3Data.post.content}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="glass-3d-light rounded-xl p-4 mt-6">
                            <h3 className="font-semibold text-purple-400 mb-3">Estatísticas de Geração</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Trends utilizadas:</span>
                                <span className="ml-2 text-white font-semibold">
                                  {automationState.phase3Data.stats?.trendsUsed || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Artigos analisados:</span>
                                <span className="ml-2 text-white font-semibold">
                                  {automationState.phase3Data.stats?.articlesUsed || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Tabs for Trends, News, Posts, Schedule */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="glass-3d border-white/10 w-full grid grid-cols-4">
                    <TabsTrigger
                      value="trends"
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-trends"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Tendências ({trends.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="news"
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-news"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Notícias ({newsArticles.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="templates"
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-templates"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Templates ({posts.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedule"
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-schedule"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Agendamento
                    </TabsTrigger>
                  </TabsList>

                  {/* TENDÊNCIAS TAB */}
                  <TabsContent value="trends" className="mt-6">
                    <Card className="glass-3d border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-xl text-purple-400">
                          <div className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Tendências Coletadas
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                            {trends.length} tendências
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingTrends ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                          </div>
                        ) : trends.length === 0 ? (
                          <div className="text-center py-12">
                            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                              Nenhuma tendência coletada
                            </h3>
                            <p className="text-gray-400 mb-4">
                              Execute a Fase 1 para coletar tendências do Google, YouTube e Reddit
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[600px] w-full pr-4">
                            <div className="grid grid-cols-1 gap-4">
                              {trends.map((trend) => (
                                <div
                                  key={trend.id}
                                  className="glass-3d-light rounded-xl p-4 hover:scale-[1.02] transition-all"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-white text-lg">{trend.term}</h4>
                                        <Badge className="bg-purple-500/20 text-purple-300">
                                          Score: {trend.score}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-400">
                                        {trend.source === 'google_trends' && <Globe className="w-4 h-4" />}
                                        {trend.source === 'gdelt' && <SiGooglenews className="w-4 h-4" />}
                                        {trend.source === 'news_analysis' && <Newspaper className="w-4 h-4" />}
                                        {trend.source === 'keyword_based' && <Hash className="w-4 h-4" />}
                                        <span className="capitalize">{trend.source.replace('_', ' ')}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Search Links */}
                                  <div className="grid grid-cols-3 gap-2 mt-3">
                                    <a
                                      href={`https://www.google.com/search?q=${encodeURIComponent(trend.term)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="glass-button-3d flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                                    >
                                      <Search className="w-4 h-4" />
                                      Google
                                    </a>
                                    <a
                                      href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.term)}&geo=BR`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="glass-button-3d flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      Trends
                                    </a>
                                    <a
                                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.term)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="glass-button-3d flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <Youtube className="w-4 h-4" />
                                      YouTube
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* NOTÍCIAS TAB */}
                  <TabsContent value="news" className="mt-6">
                    <Card className="glass-3d border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-xl text-blue-400">
                          <div className="flex items-center">
                            <Newspaper className="w-5 h-5 mr-2" />
                            Artigos de Notícias
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            {newsArticles.length} artigos
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingNews ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                          </div>
                        ) : newsArticles.length === 0 ? (
                          <div className="text-center py-12">
                            <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                              Nenhum artigo coletado
                            </h3>
                            <p className="text-gray-400 mb-4">
                              Execute a Fase 2 para buscar artigos baseados nas tendências
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[600px] w-full pr-4">
                            <div className="grid grid-cols-1 gap-4">
                              {newsArticles.map((article) => (
                                <div
                                  key={article.id}
                                  className="glass-3d-light rounded-xl p-4 hover:scale-[1.02] transition-all"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group"
                                      >
                                        <h4 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                          {article.title}
                                        </h4>
                                      </a>

                                      {article.description && (
                                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                          {article.description}
                                        </p>
                                      )}

                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Globe className="w-3 h-3" />
                                          {article.sourceName || 'Unknown'}
                                        </span>
                                        {article.publishedAt && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                        <Badge className="bg-green-500/20 text-green-300 text-xs">
                                          Relevância: {article.relevanceScore || 50}%
                                        </Badge>
                                      </div>
                                    </div>

                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="glass-button-3d p-2 text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TEMPLATES TAB */}
                  <TabsContent value="templates" className="mt-6">
                    <Card className="glass-3d border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-xl text-purple-400">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Templates de Blog
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                            {posts.length} templates
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPosts ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                          </div>
                        ) : posts.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                              Nenhum template criado
                            </h3>
                            <p className="text-gray-400 mb-4">
                              Execute a Fase 3 para gerar templates de blog posts com IA
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map((post: any) => (
                              <Card
                                key={post.id}
                                className="glass-3d-light border-white/10 hover:scale-[1.01] transition-all duration-300"
                              >
                                {post.featuredImageUrl && (
                                  <div className="w-full h-32 overflow-hidden rounded-t-xl">
                                    <img
                                      src={post.featuredImageUrl}
                                      alt={post.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base text-white line-clamp-2 flex-1">
                                      {post.title}
                                    </CardTitle>
                                    <Badge
                                      className={`${
                                        post.status === 'published'
                                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                          : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                      } text-xs`}
                                    >
                                      {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                                    {post.summary}
                                  </p>

                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {post.tags.slice(0, 3).map((tag: any, index: number) => (
                                      <span
                                        key={index}
                                        className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Metadata */}
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3 pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {post.readingTime} min
                                      </span>
                                      <span>
                                        {formatDistanceToNow(new Date(post.createdAt), {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    {post.status === 'draft' && (
                                      <Button
                                        onClick={() => publishTemplateMutation.mutate(post.id)}
                                        disabled={publishTemplateMutation.isPending}
                                        className="glass-button-3d bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex-1 text-xs h-8"
                                        size="sm"
                                      >
                                        {publishTemplateMutation.isPending ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                          <Check className="w-3 h-3 mr-1" />
                                        )}
                                        Publicar
                                      </Button>
                                    )}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="glass-3d-light border-white/20 text-gray-300 hover:bg-white/5 flex-1 text-xs h-8"
                                          size="sm"
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          Ver Post
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="glass-3d border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle className="text-2xl font-bold text-purple-400">
                                            {post.title}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          {post.featuredImageUrl && (
                                            <img
                                              src={post.featuredImageUrl}
                                              alt={post.title}
                                              className="w-full h-64 object-cover rounded-xl"
                                            />
                                          )}
                                          <div className="prose prose-invert max-w-none">
                                            <div className="text-gray-300 whitespace-pre-wrap">
                                              {post.content}
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                                            {post.tags.map((tag: any, idx: number) => (
                                              <Badge
                                                key={idx}
                                                className="bg-purple-500/20 text-purple-300"
                                              >
                                                #{tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AGENDAMENTO TAB */}
                  <TabsContent value="schedule" className="mt-6">
                    <Card className="glass-3d border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl text-purple-400">
                          <Clock className="w-5 h-5 mr-2" />
                          Agendamento Automático Completo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="glass-3d-light rounded-xl p-6 mb-6">
                          <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Sistema de Automação Completa
                              </h3>
                              <p className="text-gray-300 text-sm">
                                Configure a automação para executar TODAS as fases automaticamente (Fase 1 → Fase 2 → Fase 3)
                                nos dias e horários especificados. O sistema irá:
                              </p>
                              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                                <li className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                  <span>Coletar tendências do Google, YouTube e Reddit</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                  <span>Buscar artigos de notícias baseados nas tendências</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                  <span>Gerar blog post completo com IA usando os dados coletados</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* Time Picker */}
                            <div>
                              <Label htmlFor="execution-time" className="text-gray-200 mb-2 block text-sm">
                                Horário de Execução
                              </Label>
                              <Input
                                id="execution-time"
                                type="time"
                                className="glass-3d-light border-white/20 text-white"
                                defaultValue="09:00"
                              />
                            </div>

                            {/* Days of Week */}
                            <div>
                              <Label className="text-gray-200 mb-3 block text-sm">
                                Dias da Semana
                              </Label>
                              <div className="grid grid-cols-7 gap-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                                  (day, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      className="glass-3d-light border-white/20 text-gray-300 hover:bg-purple-500/30 hover:text-purple-300 hover:border-purple-500/50 text-xs h-8"
                                      size="sm"
                                    >
                                      {day}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div>
                                <h4 className="text-white font-semibold text-sm">
                                  Ativar Automação Completa
                                </h4>
                                <p className="text-xs text-gray-400">
                                  O sistema executará TODAS as 3 fases automaticamente
                                </p>
                              </div>
                              <Button
                                className="glass-button-3d bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs"
                                size="sm"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Ativar Agendamento
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Existing Schedules */}
                        <div className="mt-6">
                          <h3 className="text-base font-semibold text-white mb-4">
                            Agendamentos Ativos
                          </h3>
                          <div className="text-center py-8 text-gray-400">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Nenhum agendamento configurado ainda</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Configure acima para criar seu primeiro agendamento automático
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="glass-3d border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="w-16 h-16 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Selecione um Nicho</h3>
                  <p className="text-gray-400 text-center">
                    Escolha um nicho na barra lateral para começar a automação
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
