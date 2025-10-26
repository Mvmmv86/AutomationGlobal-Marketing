import { useState, useEffect } from 'react';
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
import { apiRequest } from '@/lib/queryClient';
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
  Settings,
  Sparkles,
  BarChart3,
  Zap,
  Check,
  ExternalLink,
  Youtube,
  Hash,
  Newspaper,
  MessageSquare,
  Activity,
  Info
} from 'lucide-react';
import { SiReddit, SiGooglenews } from 'react-icons/si';
import { formatDistanceToNow } from 'date-fns';

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
}

interface AutomationRun {
  id: string;
  nicheId: string;
  status: 'running' | 'completed' | 'failed';
  phase: string;
  startedAt: string;
  completedAt?: string;
  results?: {
    trendsCount: number;
    articlesCount: number;
    generatedPostId: string;
  };
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
  author?: string;
  relevanceScore: number;
  sentiment?: string;
  language: string;
  region: string;
  createdAt: string;
}

export default function BlogAutomation() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trends');
  const [isCreateNicheOpen, setIsCreateNicheOpen] = useState(false);
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

  // Fetch automation runs for selected niche
  const { data: runsData, isLoading: isLoadingRuns } = useQuery({
    queryKey: ['/api/blog/automation-runs', selectedNiche],
    enabled: !!selectedNiche,
  });
  const automationRuns = (runsData as any)?.data || [];

  // Fetch trending topics for selected niche (Phase 1)
  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['/api/blog/niches', selectedNiche, 'trends'],
    enabled: !!selectedNiche,
  });
  const trends: TrendingTopic[] = (trendsData as any)?.data || [];

  // Fetch news articles for selected niche (Phase 1)
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Run automation mutation
  const runAutomationMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/run-automation/${nicheId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run automation');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/automation-runs', selectedNiche] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', selectedNiche] });
      toast({
        title: "Automação Concluída",
        description: `Blog post gerado com sucesso! ${data.data.stats.trends} trends e ${data.data.stats.articles} artigos analisados.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha na automação do blog",
        variant: "destructive",
      });
    },
  });

  // Collect trends mutation (Phase 1)
  const collectTrendsMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/niches/${nicheId}/collect-trends`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to collect trends');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'news'] });
      toast({
        title: "Fase 1 Concluída",
        description: `${data.data.trendsCollected} tendências e ${data.data.newsArticlesCollected} notícias coletadas com sucesso!`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha na coleta de tendências (Fase 1)",
        variant: "destructive",
      });
    },
  });

  // Test mutation to add sample data
  const addTestTrendsMutation = useMutation({
    mutationFn: async (nicheId: string) => {
      const response = await fetch(`/api/blog/niches/${nicheId}/test-trends`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to add test trends');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/niches', selectedNiche, 'trends'] });
      toast({
        title: "Dados de Teste Adicionados",
        description: `${data.data.trendsAdded} tendências de exemplo foram adicionadas!`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar dados de teste",
        variant: "destructive",
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
                {/* Automation Controls */}
                <Card className="glass-3d border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl text-purple-400">
                        <Zap className="w-5 h-5 mr-2" />
                        Automação Inteligente
                      </CardTitle>
                      <div className="flex space-x-3">
                        {/* Temporary test button */}
                        <Button
                          onClick={() => addTestTrendsMutation.mutate(selectedNiche)}
                          disabled={addTestTrendsMutation.isPending}
                          className="glass-button-3d bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                          data-testid="button-test-trends"
                        >
                          {addTestTrendsMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Adicionar Dados Teste
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => collectTrendsMutation.mutate(selectedNiche)}
                          disabled={collectTrendsMutation.isPending}
                          className="glass-button-3d bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                          data-testid="button-run-phase1"
                        >
                          {collectTrendsMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Coletando...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Executar Fase 1
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => runAutomationMutation.mutate(selectedNiche)}
                          disabled={runAutomationMutation.isPending}
                          className="glass-button-3d bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                          data-testid="button-run-automation"
                        >
                          {runAutomationMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Executando...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Automação Completa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="glass-3d-light rounded-xl p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <h4 className="font-semibold text-white">Fase 1</h4>
                        <p className="text-sm text-gray-300">Coleta de Trends</p>
                        <p className="text-xs text-gray-400 mt-1">Google, YouTube, Reddit</p>
                      </div>
                      <div className="glass-3d-light rounded-xl p-4 text-center">
                        <Search className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <h4 className="font-semibold text-white">Fase 2</h4>
                        <p className="text-sm text-gray-300">Busca de Notícias</p>
                        <p className="text-xs text-gray-400 mt-1">Fontes verificadas</p>
                      </div>
                      <div className="glass-3d-light rounded-xl p-4 text-center">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <h4 className="font-semibold text-white">Fase 3</h4>
                        <p className="text-sm text-gray-300">Geração de Conteúdo</p>
                        <p className="text-xs text-gray-400 mt-1">IA com citações</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for Posts and Runs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="glass-3d border-white/10 w-full grid grid-cols-5">
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
                      value="runs"
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-runs"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Histórico
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

                  <TabsContent value="trends" className="space-y-4">
                    {isLoadingTrends ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      </div>
                    ) : trends.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Nenhuma tendência coletada ainda
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Execute a Fase 1 para coletar tendências atuais
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Resumo das Tendências */}
                        <div className="glass-3d rounded-2xl p-6 border border-white/10 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-purple-400">Análise de Tendências</h3>
                            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                              {trends.length} tendências identificadas
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">
                                {trends.filter(t => t.source === 'google_trends').length}
                              </div>
                              <div className="text-sm text-gray-300">Google Trends</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-400">
                                {trends.filter(t => t.source === 'youtube').length}
                              </div>
                              <div className="text-sm text-gray-300">YouTube</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-400">
                                {trends.filter(t => t.source === 'reddit').length}
                              </div>
                              <div className="text-sm text-gray-300">Reddit</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">
                                {trends.filter(t => t.source === 'gdelt' || t.source === 'keyword_based').length}
                              </div>
                              <div className="text-sm text-gray-300">Outras Fontes</div>
                            </div>
                          </div>
                        </div>

                        {/* Lista de Tendências Ordenadas */}
                        {[...trends]
                          .sort((a, b) => {
                            // Ordenar por prioridade: Google Trends primeiro
                            const priorityOrder = ['google_trends', 'youtube', 'reddit', 'gdelt', 'keyword_based'];
                            const aPriority = priorityOrder.indexOf(a.source) !== -1 ? priorityOrder.indexOf(a.source) : 999;
                            const bPriority = priorityOrder.indexOf(b.source) !== -1 ? priorityOrder.indexOf(b.source) : 999;
                            if (aPriority !== bPriority) return aPriority - bPriority;
                            // Se mesma fonte, ordenar por score
                            return b.score - a.score;
                          })
                          .map((trend: TrendingTopic) => {
                            // Determinar ícone e cor baseado na fonte
                            const getSourceIcon = () => {
                              switch(trend.source) {
                                case 'google_trends':
                                  return <SiGooglenews className="w-5 h-5 text-green-400" />;
                                case 'youtube':
                                  return <Youtube className="w-5 h-5 text-red-400" />;
                                case 'reddit':
                                  return <SiReddit className="w-5 h-5 text-orange-400" />;
                                case 'gdelt':
                                  return <Newspaper className="w-5 h-5 text-blue-400" />;
                                case 'keyword_based':
                                  return <Hash className="w-5 h-5 text-purple-400" />;
                                default:
                                  return <Activity className="w-5 h-5 text-gray-400" />;
                              }
                            };

                            const getSourceColor = () => {
                              switch(trend.source) {
                                case 'google_trends': return 'from-green-500/20 to-green-400/10 border-green-500/30';
                                case 'youtube': return 'from-red-500/20 to-red-400/10 border-red-500/30';
                                case 'reddit': return 'from-orange-500/20 to-orange-400/10 border-orange-500/30';
                                case 'gdelt': return 'from-blue-500/20 to-blue-400/10 border-blue-500/30';
                                case 'keyword_based': return 'from-purple-500/20 to-purple-400/10 border-purple-500/30';
                                default: return 'from-gray-500/20 to-gray-400/10 border-gray-500/30';
                              }
                            };

                            // Extrair links e informações do metadata
                            const extractLinks = () => {
                              const links = [];
                              if (trend.metadata?.articles?.length > 0) {
                                links.push(...trend.metadata.articles.slice(0, 2).map((article: any) => ({
                                  title: article.title || 'Artigo relacionado',
                                  url: article.url
                                })));
                              }
                              if (trend.metadata?.url) {
                                links.push({ title: 'Fonte original', url: trend.metadata.url });
                              }
                              if (trend.metadata?.relatedQueries?.length > 0) {
                                // Adicionar apenas pesquisas relacionadas como texto, não links
                              }
                              return links;
                            };

                            const links = extractLinks();
                            
                            // Gerar links de pesquisa diretos
                            const searchTerm = encodeURIComponent(trend.term);
                            const googleSearchUrl = `https://www.google.com/search?q=${searchTerm}`;
                            const googleTrendsUrl = `https://trends.google.com/trends/explore?q=${searchTerm}&geo=BR`;
                            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchTerm}`;

                            return (
                              <Card 
                                key={trend.id} 
                                className={`glass-3d-light border-white/10 bg-gradient-to-r ${getSourceColor()} hover:scale-[1.02] transition-all duration-300`} 
                                data-testid={`trend-card-${trend.id}`}
                              >
                                <CardHeader>
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 glass-3d rounded-xl flex items-center justify-center">
                                          {getSourceIcon()}
                                        </div>
                                        <CardTitle className="text-lg text-white flex-1">
                                          {trend.term}
                                        </CardTitle>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                        Score: {trend.score}
                                      </Badge>
                                      <Badge className="glass-3d-light border-white/20 text-gray-200">
                                        {trend.source.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {/* Detalhes da Coleta */}
                                  <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                                      <Info className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm text-gray-200">Método:</span>
                                      <span className="text-sm text-blue-300">
                                        {trend.sourceType.replace('_', ' ')}
                                      </span>
                                    </div>
                                    {trend.metadata?.traffic && (
                                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                                        <Activity className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-gray-200">Tráfego:</span>
                                        <span className="text-sm text-green-300">{trend.metadata.traffic}</span>
                                      </div>
                                    )}
                                    {trend.metadata?.nicheContext && (
                                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                                        <Target className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-200">Contexto:</span>
                                        <span className="text-sm text-purple-300">{trend.metadata.nicheContext}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Links de Pesquisa Diretos */}
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-300 font-medium mb-2">🔍 Pesquisar Tendência:</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      {/* Google Search */}
                                      <a
                                        href={googleSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-white hover:text-green-200 transition-all bg-gradient-to-r from-green-500/20 to-green-400/10 border border-green-500/30 rounded-lg px-3 py-2 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                                        data-testid={`google-search-${trend.id}`}
                                      >
                                        <SiGooglenews className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-medium">Google Search</span>
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                      </a>
                                      
                                      {/* Google Trends */}
                                      <a
                                        href={googleTrendsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-white hover:text-blue-200 transition-all bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-500/30 rounded-lg px-3 py-2 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                                        data-testid={`google-trends-${trend.id}`}
                                      >
                                        <TrendingUp className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-medium">Google Trends</span>
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                      </a>
                                      
                                      {/* YouTube Search (se relevante) */}
                                      <a
                                        href={youtubeSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-white hover:text-red-200 transition-all bg-gradient-to-r from-red-500/20 to-red-400/10 border border-red-500/30 rounded-lg px-3 py-2 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                                        data-testid={`youtube-search-${trend.id}`}
                                      >
                                        <Youtube className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-medium">YouTube</span>
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                      </a>
                                    </div>
                                  </div>

                                  {/* Links de Referência (se existirem) */}
                                  {links.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-sm text-gray-300 font-medium">📰 Artigos Relacionados:</div>
                                      <div className="space-y-1">
                                        {links.map((link, idx) => (
                                          <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30"
                                          >
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            <span className="line-clamp-1">{link.title}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Pesquisas Relacionadas */}
                                  {trend.metadata?.relatedQueries?.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-sm text-gray-300 font-medium">Pesquisas Relacionadas:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {trend.metadata.relatedQueries.slice(0, 5).map((query: any, idx: number) => (
                                          <span
                                            key={idx}
                                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg"
                                          >
                                            {query.query || query}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Timestamp */}
                                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-400">
                                        {formatDistanceToNow(new Date(trend.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    {trend.metadata?.generated && (
                                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                        Auto-gerado
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        }
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="news" className="space-y-4">
                    {isLoadingNews ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      </div>
                    ) : newsArticles.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Nenhuma notícia coletada ainda
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Execute a Fase 1 para coletar notícias relevantes
                        </p>
                      </div>
                    ) : (
                      newsArticles.map((article: NewsArticle) => (
                        <Card key={article.id} className="glass-3d-light border-white/10" data-testid={`news-card-${article.id}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-white line-clamp-2">
                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition-colors">
                                  {article.title}
                                </a>
                              </CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                  {article.relevanceScore}/10
                                </Badge>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                  {article.source}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {article.description && (
                              <p className="text-gray-300 mb-4 line-clamp-3">{article.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {article.author && (
                                  <span className="text-sm text-gray-400">Por: {article.author}</span>
                                )}
                                {article.sentiment && (
                                  <span className={`text-xs px-2 py-1 rounded-lg ${
                                    article.sentiment === 'positive' 
                                      ? 'bg-green-500/20 text-green-300' 
                                      : article.sentiment === 'negative'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {article.sentiment}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-400">
                                {article.publishedAt 
                                  ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                                  : formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4">
                    {isLoadingPosts ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Nenhum template ainda
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Execute a automação para gerar templates de blog posts
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {posts.map((post: BlogPost) => (
                          <Card key={post.id} className="glass-3d-light border-white/10 hover:scale-[1.01] transition-all duration-300" data-testid={`template-card-${post.id}`}>
                            {post.featuredImageUrl && (
                              <div className="w-full h-48 overflow-hidden rounded-t-xl">
                                <img
                                  src={post.featuredImageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-lg text-white line-clamp-2 flex-1">
                                  {post.title}
                                </CardTitle>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge
                                    className={`${
                                      post.status === 'published'
                                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                        : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                    }`}
                                  >
                                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                                  </Badge>
                                  <div className="flex items-center text-sm text-gray-400">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {post.readingTime} min
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-300 mb-4 line-clamp-3">{post.summary}</p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.slice(0, 5).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
                                <span className="text-sm text-gray-400">
                                  Gerado {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </span>
                                {post.status === 'published' && post.publishedAt && (
                                  <span className="text-sm text-green-400">
                                    Publicado {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {post.status === 'draft' && (
                                  <Button
                                    className="glass-button-3d bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex-1"
                                    size="sm"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Publicar
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  className="glass-3d-light border-white/20 text-gray-300 hover:bg-white/5"
                                  size="sm"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Ver Post
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="runs" className="space-y-4">
                    {isLoadingRuns ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      </div>
                    ) : automationRuns.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Nenhuma execução registrada
                        </h3>
                        <p className="text-gray-400">
                          Execute uma automação para ver o histórico aqui
                        </p>
                      </div>
                    ) : (
                      automationRuns.map((run: AutomationRun) => (
                        <Card key={run.id} className="glass-3d-light border-white/10" data-testid={`run-card-${run.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  run.status === 'completed' ? 'bg-green-400' :
                                  run.status === 'running' ? 'bg-blue-400 animate-pulse' :
                                  'bg-red-400'
                                }`} />
                                <span className="font-semibold text-white capitalize">
                                  {run.status === 'completed' ? 'Concluída' :
                                   run.status === 'running' ? 'Em Execução' :
                                   'Falhou'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-purple-400">
                                  {run.results?.trendsCount || 0}
                                </p>
                                <p className="text-sm text-gray-300">Trends</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-blue-400">
                                  {run.results?.articlesCount || 0}
                                </p>
                                <p className="text-sm text-gray-300">Artigos</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-400">
                                  {run.results?.generatedPostId ? 1 : 0}
                                </p>
                                <p className="text-sm text-gray-300">Posts</p>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center text-sm text-gray-400">
                                <span className="capitalize">Fase atual: {run.phase.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="schedule" className="space-y-4">
                    <Card className="glass-3d border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl text-purple-400">
                          <Clock className="w-5 h-5 mr-2" />
                          Agendamento Automático
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-6">
                          Configure a automação para rodar automaticamente nos dias e horários especificados.
                          O sistema irá gerar novos posts automaticamente com base nas tendências mais recentes.
                        </p>

                        <div className="glass-3d-light rounded-xl p-6 space-y-6">
                          {/* Time Picker */}
                          <div>
                            <Label htmlFor="execution-time" className="text-gray-200 mb-2 block">
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
                            <Label className="text-gray-200 mb-3 block">Dias da Semana</Label>
                            <div className="grid grid-cols-7 gap-2">
                              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="glass-3d-light border-white/20 text-gray-300 hover:bg-purple-500/30 hover:text-purple-300 hover:border-purple-500/50"
                                  size="sm"
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Active Toggle */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div>
                              <h4 className="text-white font-semibold">Ativar Agendamento</h4>
                              <p className="text-sm text-gray-400">
                                A automação rodará automaticamente nos horários configurados
                              </p>
                            </div>
                            <Button
                              className="glass-button-3d bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Ativar
                            </Button>
                          </div>
                        </div>

                        {/* Existing Schedules */}
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Agendamentos Ativos</h3>
                          <div className="text-center py-8 text-gray-400">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum agendamento configurado ainda</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="glass-3d border-white/10">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      Selecione um Nicho
                    </h3>
                    <p className="text-gray-400">
                      Escolha um nicho na barra lateral para ver os posts e executar automações
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}