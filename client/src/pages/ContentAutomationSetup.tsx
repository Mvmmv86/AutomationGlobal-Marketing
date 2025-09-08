import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bot, 
  Globe, 
  Search,
  Target,
  FileText,
  Instagram,
  Calendar,
  Clock,
  Settings,
  Save,
  Zap,
  Layers,
  Hash,
  PenTool,
  CheckCircle,
  ArrowLeft,
  Play,
  Eye,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MarketingThemeProvider, useMarketingTheme } from "@/context/MarketingThemeContext";

// Types for form data
interface ContentAutomationFormData {
  name: string;
  keywordsPrimary: string;
  keywordsSecondary: string[];
  niche: string;
  toneOfVoice: string;
  newsSources: string[];
  customSources: string[];
  language: string;
  searchPeriod: string;
  articleSize: string;
  includeElements: string[];
  writingStyle: string;
  defaultCta: string;
  instagramType: string;
  imageStyle: string;
  includeInPost: string[];
  publishTime: string;
  frequency: string;
  scheduleDays: string[];
  executionTime: string;
  manualApproval: boolean;
}

function ContentAutomationSetupContent() {
  const { theme } = useMarketingTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<ContentAutomationFormData>({
    name: "",
    keywordsPrimary: "",
    keywordsSecondary: [],
    niche: "",
    toneOfVoice: "",
    newsSources: [],
    customSources: [],
    language: "português",
    searchPeriod: "24h",
    articleSize: "médio",
    includeElements: [],
    writingStyle: "jornalístico",
    defaultCta: "",
    instagramType: "feed",
    imageStyle: "minimalista", 
    includeInPost: [],
    publishTime: "19:30",
    frequency: "manual",
    scheduleDays: [],
    executionTime: "08:00",
    manualApproval: true
  });

  const [currentSecondaryKeyword, setCurrentSecondaryKeyword] = useState("");

  // Create automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (data: ContentAutomationFormData) => {
      const response = await fetch(`/api/organizations/1/automation/content/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar automação");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Automação criada com sucesso!",
        description: "Sua automação de conteúdo foi configurada e está pronta para uso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/content"] });
      setLocation("/marketing/automation/content/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar automação",
        description: error.message || "Erro interno do sistema",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.keywordsPrimary || !formData.niche) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, palavra-chave principal e nicho",
        variant: "destructive",
      });
      return;
    }

    createAutomationMutation.mutate(formData);
  };

  // Add secondary keyword
  const addSecondaryKeyword = () => {
    if (currentSecondaryKeyword.trim() && !formData.keywordsSecondary.includes(currentSecondaryKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywordsSecondary: [...prev.keywordsSecondary, currentSecondaryKeyword.trim()]
      }));
      setCurrentSecondaryKeyword("");
    }
  };

  // Remove secondary keyword
  const removeSecondaryKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywordsSecondary: prev.keywordsSecondary.filter(k => k !== keyword)
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (field: keyof ContentAutomationFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const glassCardClass = cn(
    "glass-3d border border-white/10 bg-white/5 backdrop-blur-[20px]",
    "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
    "transition-all duration-500 ease-out",
    "hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.15)]",
    "hover:transform hover:translateY(-2px) hover:scale-[1.01]",
    "rounded-[20px]"
  );

  const glassButtonClass = cn(
    "glass-button-3d relative overflow-hidden",
    "border border-white/20 bg-gradient-to-r from-purple-500/20 to-blue-500/20",
    "backdrop-blur-[15px] text-white font-medium",
    "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    "transition-all duration-300 ease-out",
    "hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)]",
    "hover:transform hover:translateY(-2px) hover:scale-[1.02]",
    "active:transform active:translateY(0) active:scale-[0.98]",
    "rounded-[16px] px-6 py-3"
  );

  const glassInputClass = cn(
    "border border-white/20 bg-white/5 backdrop-blur-[15px]",
    "text-white placeholder:text-white/60",
    "rounded-[12px] focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/25",
    "transition-all duration-300"
  );

  const gradientText = "bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent";

  return (
    <div className={cn(
      "min-h-screen p-6",
      "marketing-gradient-bg relative",
      "bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20"
    )}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => setLocation("/marketing")}
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className={cn("text-4xl font-bold mb-4", gradientText)}>
            Configuração de Automação de Conteúdo
          </h1>
          <p className="text-white/80 text-lg max-w-3xl mx-auto">
            Configure sua automação inteligente para buscar notícias, gerar conteúdo e publicar automaticamente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <div className="space-y-8">
          
          {/* Seção 1: Definição do Assunto */}
          <Card className={glassCardClass} data-testid="card-subject-definition">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
                1. Definição do Assunto
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure o tema principal e palavras-chave para sua automação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="automation-name" className="text-white font-medium">Nome da Automação *</Label>
                  <Input
                    id="automation-name"
                    placeholder="Ex: Automação IA Marketing Digital"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={glassInputClass}
                    data-testid="input-automation-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primary-keyword" className="text-white font-medium">Palavra-chave Principal *</Label>
                  <Input
                    id="primary-keyword"
                    placeholder="inteligência artificial, marketing digital, e-commerce"
                    value={formData.keywordsPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywordsPrimary: e.target.value }))}
                    className={glassInputClass}
                    data-testid="input-primary-keyword"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-keywords" className="text-white font-medium">Palavras-chave Secundárias</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-keywords"
                    placeholder="IA, automação, tecnologia"
                    value={currentSecondaryKeyword}
                    onChange={(e) => setCurrentSecondaryKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
                    className={glassInputClass}
                    data-testid="input-secondary-keywords"
                  />
                  <Button type="button" onClick={addSecondaryKeyword} className={glassButtonClass} data-testid="button-add-keyword">
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                {formData.keywordsSecondary.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywordsSecondary.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-500/20 text-white border border-purple-400/30 cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeSecondaryKeyword(keyword)}
                        data-testid={`badge-keyword-${index}`}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="niche" className="text-white font-medium">Nicho/Setor *</Label>
                  <Select value={formData.niche} onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-niche">
                      <SelectValue placeholder="Selecione o nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="e-commerce">E-commerce</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="educacao">Educação</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-white font-medium">Tom de Voz *</Label>
                  <Select value={formData.toneOfVoice} onValueChange={(value) => setFormData(prev => ({ ...prev, toneOfVoice: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-tone">
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="inspiracional">Inspiracional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Fontes de Notícias */}
          <Card className={glassCardClass} data-testid="card-news-sources">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                2. Fontes de Notícias
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecione as fontes de notícias para busca de conteúdo relevante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-white font-medium">Sites de Notícias Brasileiros</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {['G1', 'UOL', 'Folha', 'Estadão'].map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`news-${source}`}
                        checked={formData.newsSources.includes(source)}
                        onCheckedChange={(checked) => handleCheckboxChange('newsSources', source, checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                        data-testid={`checkbox-news-${source.toLowerCase()}`}
                      />
                      <Label htmlFor={`news-${source}`} className="text-white/90 cursor-pointer">{source}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white font-medium">Sites de Tecnologia Internacionais</Label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {['TechCrunch', 'Wired', 'Ars Technica'].map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tech-${source}`}
                        checked={formData.newsSources.includes(source)}
                        onCheckedChange={(checked) => handleCheckboxChange('newsSources', source, checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                        data-testid={`checkbox-tech-${source.toLowerCase().replace(' ', '-')}`}
                      />
                      <Label htmlFor={`tech-${source}`} className="text-white/90 cursor-pointer">{source}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-white font-medium">Idioma das Fontes</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-language">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="português">Português</SelectItem>
                      <SelectItem value="inglês">Inglês</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-period" className="text-white font-medium">Período de Busca</Label>
                  <Select value={formData.searchPeriod} onValueChange={(value) => setFormData(prev => ({ ...prev, searchPeriod: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-search-period">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Últimas 24 horas</SelectItem>
                      <SelectItem value="3d">Últimos 3 dias</SelectItem>
                      <SelectItem value="1w">Última semana</SelectItem>
                      <SelectItem value="2w">Últimas 2 semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Configurações do Blog */}
          <Card className={glassCardClass} data-testid="card-blog-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                3. Configurações do Blog
              </CardTitle>
              <CardDescription className="text-white/70">
                Defina como os artigos do blog serão gerados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="article-size" className="text-white font-medium">Tamanho do Artigo</Label>
                  <Select value={formData.articleSize} onValueChange={(value) => setFormData(prev => ({ ...prev, articleSize: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-article-size">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curto">Curto (300-500 palavras)</SelectItem>
                      <SelectItem value="médio">Médio (500-800 palavras)</SelectItem>
                      <SelectItem value="longo">Longo (800-1200 palavras)</SelectItem>
                      <SelectItem value="muito-longo">Muito longo (1200+ palavras)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="writing-style" className="text-white font-medium">Estilo de Escrita</Label>
                  <Select value={formData.writingStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, writingStyle: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-writing-style">
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jornalístico">Jornalístico</SelectItem>
                      <SelectItem value="tutorial">Tutorial/Guia</SelectItem>
                      <SelectItem value="opinião">Opinião/Análise</SelectItem>
                      <SelectItem value="lista">Lista/Ranking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white font-medium">Incluir Elementos</Label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Introdução cativante',
                    'Subtítulos (H2, H3)',
                    'Lista de pontos-chave',
                    'Conclusão com CTA',
                    'Tags/categorias',
                    'Meta description SEO'
                  ].map((element) => (
                    <div key={element} className="flex items-center space-x-2">
                      <Checkbox
                        id={`element-${element}`}
                        checked={formData.includeElements.includes(element)}
                        onCheckedChange={(checked) => handleCheckboxChange('includeElements', element, checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                        data-testid={`checkbox-element-${element.toLowerCase().replace(/[\s/()]/g, '-')}`}
                      />
                      <Label htmlFor={`element-${element}`} className="text-white/90 cursor-pointer text-sm">{element}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-cta" className="text-white font-medium">CTA Padrão</Label>
                <Input
                  id="default-cta"
                  placeholder="Quer automatizar seu marketing? Fale conosco!"
                  value={formData.defaultCta}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCta: e.target.value }))}
                  className={glassInputClass}
                  data-testid="input-default-cta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 4: Configurações do Instagram */}
          <Card className={glassCardClass} data-testid="card-instagram-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Instagram className="w-6 h-6 text-cyan-400" />
                </div>
                4. Configurações do Instagram
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure como os posts do Instagram serão criados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="instagram-type" className="text-white font-medium">Tipo de Post</Label>
                  <Select value={formData.instagramType} onValueChange={(value) => setFormData(prev => ({ ...prev, instagramType: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-instagram-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">Feed simples</SelectItem>
                      <SelectItem value="carrossel">Carrossel (múltiplas imagens)</SelectItem>
                      <SelectItem value="stories">Stories</SelectItem>
                      <SelectItem value="reels">Reels (futuro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-style" className="text-white font-medium">Estilo da Imagem</Label>
                  <Select value={formData.imageStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, imageStyle: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-image-style">
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimalista">Minimalista</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="criativo">Criativo/Artístico</SelectItem>
                      <SelectItem value="infográfico">Infográfico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white font-medium">Incluir no Post</Label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Hashtags relevantes',
                    'Menções (@)',
                    'Link na bio',
                    'Call-to-action',
                    'Emoji'
                  ].map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={`post-${item}`}
                        checked={formData.includeInPost.includes(item)}
                        onCheckedChange={(checked) => handleCheckboxChange('includeInPost', item, checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                        data-testid={`checkbox-post-${item.toLowerCase().replace(/[\s@()]/g, '-')}`}
                      />
                      <Label htmlFor={`post-${item}`} className="text-white/90 cursor-pointer text-sm">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publish-time" className="text-white font-medium">Horário de Publicação</Label>
                <Input
                  id="publish-time"
                  type="time"
                  value={formData.publishTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishTime: e.target.value }))}
                  className={glassInputClass}
                  data-testid="input-publish-time"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 5: Frequência e Automação */}
          <Card className={glassCardClass} data-testid="card-frequency-automation">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
                5. Frequência e Automação
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure quando e como a automação será executada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-white font-medium">Frequência de Execução</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger className={glassInputClass} data-testid="select-frequency">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual (sob demanda)</SelectItem>
                      <SelectItem value="diária">Diária</SelectItem>
                      <SelectItem value="3x-semana">3x por semana</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="execution-time" className="text-white font-medium">Horário de Execução</Label>
                  <Input
                    id="execution-time"
                    type="time"
                    value={formData.executionTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, executionTime: e.target.value }))}
                    className={glassInputClass}
                    data-testid="input-execution-time"
                  />
                </div>
              </div>

              {formData.frequency !== 'manual' && formData.frequency !== 'diária' && (
                <div className="space-y-4">
                  <Label className="text-white font-medium">Dias da Semana</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={formData.scheduleDays.includes(day)}
                          onCheckedChange={(checked) => handleCheckboxChange('scheduleDays', day, checked as boolean)}
                          className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                          data-testid={`checkbox-day-${day.toLowerCase()}`}
                        />
                        <Label htmlFor={`day-${day}`} className="text-white/90 cursor-pointer text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Aprovação Manual</Label>
                  <p className="text-white/70 text-sm">
                    {formData.manualApproval 
                      ? "Gera conteúdo e aguarda aprovação antes de publicar"
                      : "Publica automaticamente sem intervenção manual"
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.manualApproval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manualApproval: checked }))}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
                  data-testid="switch-manual-approval"
                />
              </div>
            </CardContent>
          </Card>

          {/* Controles da Tela */}
          <Card className={glassCardClass} data-testid="card-controls">
            <CardContent className="py-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    data-testid="button-preview"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    data-testid="button-test-search"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Testar Busca
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/marketing")}
                    className="border-white/30 text-white hover:bg-white/10"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAutomationMutation.isPending}
                    className={cn(glassButtonClass, "bg-gradient-to-r from-green-500/80 to-emerald-500/80")}
                    data-testid="button-save-automation"
                  >
                    {createAutomationMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Automação
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function ContentAutomationSetup() {
  return (
    <MarketingThemeProvider>
      <ContentAutomationSetupContent />
    </MarketingThemeProvider>
  );
}