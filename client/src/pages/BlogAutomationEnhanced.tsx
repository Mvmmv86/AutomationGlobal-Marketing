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
  Info,
  Copy,
  Eye,
  Share2,
  Download,
  RefreshCw,
  CheckCircle,
  CircleX,
  ArrowRight
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

interface AutomationState {
  isRunning: boolean;
  currentPhase: 'idle' | 'phase1' | 'phase2' | 'phase3' | 'completed';
  progress: number;
  phase1Data?: { trendsCount: number; newsCount: number };
  phase2Data?: { articlesCount: number; sources: number };
  phase3Data?: { post: BlogPost; stats: any };
  error?: string;
}

export default function BlogAutomationEnhanced() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
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
      if (!response.ok) throw new Error('Failed to generate post');
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

  // Progressive automation flow
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

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'phase1': return <TrendingUp className="w-5 h-5" />;
      case 'phase2': return <Search className="w-5 h-5" />;
      case 'phase3': return <Sparkles className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'phase1': return 'text-green-400';
      case 'phase2': return 'text-blue-400';
      case 'phase3': return 'text-purple-400';
      case 'completed': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
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
                  Automação de Blog Inteligente
                </h1>
                <p className="text-gray-300 mt-1">
                  Sistema com progressão automática entre fases
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
              <DialogContent className="glass-3d border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-purple-400">
                    Criar Novo Nicho
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateNiche} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Nicho</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      className="glass-3d-light border-white/20 text-white"
                      placeholder="ex: Tecnologia, Saúde, Finanças"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      className="glass-3d-light border-white/20 text-white"
                      placeholder="Descreva o foco e objetivos do nicho"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                    <Input 
                      id="keywords" 
                      name="keywords" 
                      className="glass-3d-light border-white/20 text-white"
                      placeholder="palavra1, palavra2, palavra3"
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Idioma</Label>
                      <Select name="language" defaultValue="pt">
                        <SelectTrigger className="glass-3d-light border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contentStyle">Estilo de Conteúdo</Label>
                      <Select name="contentStyle" defaultValue="informativo">
                        <SelectTrigger className="glass-3d-light border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="informativo">Informativo</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="persuasivo">Persuasivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="targetAudience">Público-alvo</Label>
                    <Input 
                      id="targetAudience" 
                      name="targetAudience" 
                      className="glass-3d-light border-white/20 text-white"
                      placeholder="ex: Profissionais de TI, Estudantes"
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glass-button-3d bg-gradient-to-r from-purple-500 to-blue-500"
                    disabled={createNicheMutation.isPending}
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
                  </div>
                ) : (
                  niches.map((niche: BlogNiche) => (
                    <div
                      key={niche.id}
                      className={`glass-3d-light rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedNiche === niche.id 
                          ? 'ring-2 ring-purple-400 bg-purple-500/20' 
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedNiche(niche.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{niche.name}</h3>
                        {selectedNiche === niche.id && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{niche.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {niche.keywords.slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            {keyword}
                          </span>
                        ))}
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
                {/* Automation Control with Progress */}
                <Card className="glass-3d border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl text-purple-400">
                        <Zap className="w-5 h-5 mr-2" />
                        Automação Progressiva
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
                            Executando...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar Automação
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

                    {/* Phases Status */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Phase 1 */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase1' ? 'ring-2 ring-green-400 scale-105' : ''
                      }`}>
                        <div className={`mx-auto mb-2 ${getPhaseColor('phase1')}`}>
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
                        {automationState.phase1Data && (
                          <div className="mt-2 text-xs">
                            <Badge className="bg-green-500/20 text-green-300">
                              {automationState.phase1Data.trendsCount} trends
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Phase 2 */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase2' ? 'ring-2 ring-blue-400 scale-105' : ''
                      }`}>
                        <div className={`mx-auto mb-2 ${getPhaseColor('phase2')}`}>
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
                        {automationState.phase2Data && (
                          <div className="mt-2 text-xs">
                            <Badge className="bg-blue-500/20 text-blue-300">
                              {automationState.phase2Data.articlesCount} artigos
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Phase 3 */}
                      <div className={`glass-3d-light rounded-xl p-4 text-center transition-all ${
                        automationState.currentPhase === 'phase3' ? 'ring-2 ring-purple-400 scale-105' : ''
                      }`}>
                        <div className={`mx-auto mb-2 ${getPhaseColor('phase3')}`}>
                          {automationState.currentPhase === 'phase3' ? (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          ) : automationState.progress >= 100 ? (
                            <CheckCircle className="w-8 h-8 mx-auto" />
                          ) : (
                            <Sparkles className="w-8 h-8 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-semibold text-white">Fase 3</h4>
                        <p className="text-sm text-gray-300">Geração com IA</p>
                        {automationState.phase3Data && (
                          <div className="mt-2 text-xs">
                            <Badge className="bg-purple-500/20 text-purple-300">
                              Post Gerado
                            </Badge>
                          </div>
                        )}
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
                            className="glass-button-3d"
                            onClick={() => copyToClipboard(automationState.phase3Data?.post.content || '')}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button-3d"
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
                            <div 
                              className="text-gray-300 leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: automationState.phase3Data.post.content
                                  .replace(/^#\s+/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">')
                                  .replace(/^##\s+/gm, '<h2 class="text-xl font-semibold text-purple-400 mt-4 mb-3">')
                                  .replace(/^###\s+/gm, '<h3 class="text-lg font-medium text-blue-400 mt-3 mb-2">')
                                  .replace(/\n\n/g, '</p><p class="mb-4">')
                                  .replace(/^/, '<p class="mb-4">')
                                  .replace(/$/, '</p>')
                              }}
                            />
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

                {/* Recent Posts */}
                <Card className="glass-3d border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl text-purple-400">
                      <FileText className="w-5 h-5 mr-2" />
                      Posts Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPosts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum post gerado ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posts.slice(0, 5).map((post: BlogPost) => (
                          <div key={post.id} className="glass-3d-light rounded-xl p-4">
                            <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{post.summary}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {post.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} className="bg-blue-500/20 text-blue-300 text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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