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
  Zap
} from 'lucide-react';
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

export default function BlogAutomation() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('niches');
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
              <DialogContent className="glass-3d border-white/10 text-white">
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
                        selectedNiche === niche.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => setSelectedNiche(niche.id)}
                      data-testid={`niche-card-${niche.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{niche.name}</h3>
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
                            Executar Automação
                          </>
                        )}
                      </Button>
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
                  <TabsList className="glass-3d border-white/10 w-full">
                    <TabsTrigger 
                      value="posts" 
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-posts"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Posts Gerados
                    </TabsTrigger>
                    <TabsTrigger 
                      value="runs" 
                      className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300"
                      data-testid="tab-runs"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Histórico de Execuções
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="space-y-4">
                    {isLoadingPosts ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Nenhum post gerado ainda
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Execute a automação para gerar seu primeiro post
                        </p>
                      </div>
                    ) : (
                      posts.map((post: BlogPost) => (
                        <Card key={post.id} className="glass-3d-light border-white/10" data-testid={`post-card-${post.id}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-white line-clamp-2">
                                {post.title}
                              </CardTitle>
                              <div className="flex items-center space-x-2">
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
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
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