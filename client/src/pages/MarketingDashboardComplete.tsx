import React from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  MousePointer, 
  Target, 
  DollarSign,
  Brain,
  BarChart3,
  Users,
  Video as VideoIcon,
  Sun,
  Moon,
  Home,
  Settings,
  Bell,
  Zap,
  PieChart,
  Activity,
  Calendar,
  Mail,
  MessageCircle,
  Plus,
  Upload,
  Send,
  Clock,
  Link as LinkIcon,
  Image,
  Edit,
  Save,
  Eye,
  CheckCircle,
  AlertCircle,
  Play,
  Share2,
  RefreshCw,
  X,
  Video,
  Heart,
  Share,
  ArrowLeft,
  Building,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiInstagram as InstagramIcon, SiFacebook as FacebookIcon, SiX as TwitterIcon, SiYoutube as YoutubeIcon } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

// Theme Context
import { MarketingThemeProvider, useMarketingTheme } from "@/context/MarketingThemeContext";
import CampaignsDashboard from "./CampaignsDashboard";
import AutomationDashboard from "./AutomationDashboard";
import { MarketingDashboardHome } from "@/components/dashboard/MarketingDashboardHome";

// Helper function to get organizationId from localStorage
const getOrganizationId = (): string => {
  return localStorage.getItem('organizationId') || '550e8400-e29b-41d4-a716-446655440001';
};

// Função para comprimir imagens e reduzir tamanho do payload
const compressImage = (base64String: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Se não for base64 de imagem, retorna o original
    if (!base64String || !base64String.startsWith('data:image/')) {
      resolve(base64String);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64String);
        return;
      }

      // Calcular novas dimensões mantendo proporção
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Converter para base64 com qualidade reduzida
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      console.log(`🖼️ Imagem comprimida: ${(base64String.length / 1024).toFixed(1)}KB → ${(compressedBase64.length / 1024).toFixed(1)}KB`);
      
      resolve(compressedBase64);
    };

    img.onerror = () => {
      console.log('❌ Erro ao comprimir imagem, usando original');
      resolve(base64String);
    };

    img.src = base64String;
  });
};

interface MarketingMetrics {
  impressions: number;
  impressionsChange: number;
  clicks: number;
  clicksChange: number;
  conversions: number;
  conversionsChange: number;
  roi: number;
  roiChange: number;
  cpa: number;
  cpaChange: number;
}

interface ChannelPerformance {
  channel: string;
  icon: any;
  traffic: number;
  engagement: number;
  color: string;
}

interface AIInsight {
  id: string;
  text: string;
  category: string;
  confidence: number;
  timestamp: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'campaigns', label: 'Campanhas', icon: Target },
  { id: 'content', label: 'Conteúdo', icon: VideoIcon },
  { id: 'automation', label: 'Automação', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audience', label: 'Audiência', icon: Users },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
  { id: 'billing', label: 'Cobranças', icon: DollarSign },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

function ContentManagement({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [activeContentTab, setActiveContentTab] = useState('library');

  const contentTabs = [
    { id: 'library', label: 'Biblioteca', icon: VideoIcon },
    { id: 'editor', label: 'Editor', icon: MessageCircle },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: Activity }
  ];

  // Buscar estatísticas reais via API - MIGRADO para API NOVA (Semana 2)
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/social/stats?organizationId=${getOrganizationId()}`],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  console.log('📊 Stats recebidas:', statsResponse);

  // Usar dados reais das estatísticas ou valores padrão
  const stats = (statsResponse as any)?.data || {
    postsCreated: 0,
    postsPublished: 0, 
    templatesActive: 0,
    postsScheduled: 0,
    averageEngagement: '0%'
  };

  console.log('📊 Stats detalhadas:', stats);

  // Calcular mudanças baseadas nos dados reais
  const postsChange = stats.postsCreated > 0 ? '+' + Math.round((stats.postsPublished / stats.postsCreated) * 100) + '%' : '0%';
  const templatesChange = stats.templatesActive > 0 ? '+' + stats.templatesActive : '0';
  const scheduledChange = stats.postsScheduled > 0 ? '+' + stats.postsScheduled : '0';

  const contentStats = [
    { 
      label: 'Posts Criados', 
      value: stats.postsCreated, 
      change: postsChange, 
      icon: MessageCircle, 
      color: 'text-blue-400',
      detail: `${stats.postsPublished} publicados`
    },
    { 
      label: 'Templates Ativos', 
      value: stats.templatesActive, 
      change: templatesChange, 
      icon: Activity, 
      color: 'text-purple-400',
      detail: 'prontos para uso'
    },
    { 
      label: 'Posts Agendados', 
      value: stats.postsScheduled, 
      change: scheduledChange, 
      icon: Calendar, 
      color: 'text-green-400',
      detail: 'aguardando publicação'
    },
    { 
      label: 'Engajamento Médio', 
      value: stats.averageEngagement, 
      change: '+1.5%', 
      icon: TrendingUp, 
      color: 'text-orange-400',
      detail: 'baseado nos posts ativos'
    }
  ];

  // Buscar dados reais dos posts via API - MIGRADO para API NOVA (Semana 2)
  const { data: postsResponse, isLoading: postsLoading } = useQuery({
    queryKey: [`/api/social/posts?organizationId=${getOrganizationId()}&limit=5`],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  console.log('📝 Posts recentes carregados:', postsResponse);

  // Extrair array de posts da resposta da API
  const postsData = postsResponse?.data || [];

  // Transformar dados reais para o formato da interface
  const recentContent = postsData.map((post: any) => ({
    id: post.id,
    title: post.fullText || post.text || 'Sem título',
    platform: post.platform || 'Instagram',
    status: post.status === 'published' ? 'Publicado' : 'Rascunho',
    engagement: post.likes > 0 ? `${post.likes}` : '-',
    date: post.time || 'agora'
  }));

  const templates = [
    { id: 1, name: 'Post Promocional', category: 'Vendas', uses: 45, preview: 'Oferta especial por tempo limitado!' },
    { id: 2, name: 'Story Interativo', category: 'Engagement', uses: 32, preview: 'Qual sua opinião sobre...' },
    { id: 3, name: 'Carrossel Educativo', category: 'Educação', uses: 28, preview: '5 dicas essenciais para...' },
    { id: 4, name: 'Depoimento Cliente', category: 'Social Proof', uses: 19, preview: 'Veja o que nossos clientes dizem' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">
            Gestão de Conteúdo
          </h1>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Crie, organize e programe seu conteúdo de marketing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveContentTab(tab.id)}
              className={cn(
                "glass-button-3d px-3 py-2 text-xs font-medium flex items-center gap-2",
                activeContentTab === tab.id && "gradient-purple-blue text-white",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards - Menores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {contentStats.map((stat, index) => (
          <div key={index} className="glass-3d p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className={cn(
                "text-xs font-medium",
                stat.change.startsWith('+') ? 'text-green-400' : 'text-blue-400'
              )}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-lg font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </div>
              <div className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conteúdo Principal baseado na aba ativa */}
      {activeContentTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conteúdo Recente */}
          <div className="space-y-4">
            <h3 className={cn(
              "text-lg font-bold flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <VideoIcon className="w-5 h-5 text-purple-400" />
              Conteúdo Recente
            </h3>
            
            <div className="space-y-3">
              {recentContent.map((content: any) => (
                <div key={content.id} className="glass-3d p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                      <div>
                        <div className={cn(
                          "font-medium text-sm",
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {content.title}
                        </div>
                        <div className={cn(
                          "text-xs",
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {content.platform} • {content.date}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-md",
                        content.status === 'Publicado' ? 'bg-green-500/20 text-green-400' :
                        content.status === 'Agendado' ? 'bg-blue-500/20 text-blue-400' :
                        content.status === 'Rascunho' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      )}>
                        {content.status}
                      </div>
                      {content.engagement !== '-' && (
                        <div className={cn(
                          "text-xs mt-1",
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {content.engagement}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates Populares */}
          <div className="space-y-4">
            <h3 className={cn(
              "text-lg font-bold flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Activity className="w-5 h-5 text-cyan-400" />
              Templates Populares
            </h3>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="glass-3d p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm mb-1",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {template.name}
                      </div>
                      <div className={cn(
                        "text-xs mb-2",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {template.preview}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-400">
                          {template.category}
                        </span>
                        <span className={cn(
                          "text-xs",
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {template.uses} usos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor de Conteúdo */}
      {activeContentTab === 'editor' && (
        <ContentEditor theme={theme} />
      )}

      {/* Calendário Editorial */}
      {activeContentTab === 'calendar' && (
        <EditorialCalendar theme={theme} />
      )}

      {/* Gestão de Templates */}
      {activeContentTab === 'templates' && (
        <TemplateManager theme={theme} />
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  format = 'number',
  theme = 'dark'
}: { 
  title: string;
  value: number;
  change: number;
  icon: any;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
  theme?: 'dark' | 'light';
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="glass-3d p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color} backdrop-blur-sm`}>
          {React.createElement(icon, { className: "w-4 h-4 text-white" })}
        </div>
        <div className={`text-xs font-medium ${
          change > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      <div className="space-y-1">
        <div className={cn(
          "text-lg font-bold",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {formatValue(value)}
        </div>
        <div className={cn(
          "text-xs",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          {title}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ channel, theme = 'dark' }: { channel: ChannelPerformance; theme?: 'dark' | 'light' }) {
  return (
    <div className="glass-3d p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${channel.color}`}>
          {React.createElement(channel.icon, { className: "w-5 h-5 text-white" })}
        </div>
        <div className="flex-1">
          <div className={cn(
            "font-semibold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>{channel.channel}</div>
          <div className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>{channel.traffic}% do tráfego</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={cn(
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>Engagement</span>
          <span className={cn(
            "font-semibold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>{channel.engagement}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${channel.color}`}
            style={{ width: `${channel.engagement}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AIInsightCard({ insight, theme = 'dark' }: { insight: AIInsight; theme?: 'dark' | 'light' }) {
  return (
    <div className="glass-3d p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg gradient-purple-blue">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className={cn(
            "text-sm font-medium mb-1",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {insight.text}
          </div>
          <div className={cn(
            "flex items-center gap-2 text-xs",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            <span>{insight.category}</span>
            <span>•</span>
            <span>Confiança: {insight.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mapa de IDs das abas para rotas
const tabToRoute: Record<string, string> = {
  'dashboard': '/app/dashboard',
  'campaigns': '/app/campaigns',
  'content': '/app/content',
  'automation': '/app/automation',
  'analytics': '/app/analytics',
  'audience': '/app/audience',
  'reports': '/app/reports',
  'billing': '/app/billing',
  'settings': '/app/settings'
};

function MarketingSidebar({
  activeTab,
  setActiveTab
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const { theme, toggleTheme } = useMarketingTheme();

  return (
    <div className="marketing-sidebar flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className={cn(
              "font-bold",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>Marketing</div>
            <div className="text-xs text-purple-400">Dashboard</div>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="glass-button-3d p-2 rounded-lg w-full flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="space-y-8">
          {navigationItems.map((item) => (
            <Link key={item.id} href={tabToRoute[item.id] || '/marketing'}>
              <a
                className={cn(
                  "w-full p-3 rounded-lg text-left flex items-center gap-3 marketing-nav-item text-sm block mb-8",
                  activeTab === item.id && "active",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="glass-3d p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <div className="text-xs">
              <div className={cn(
                "font-semibold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Online</div>
              <div className={cn(
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>Tempo real ativo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MarketingDashboardCompleteInnerProps {
  initialTab?: string;
}

function MarketingDashboardCompleteInner({ initialTab = 'dashboard' }: MarketingDashboardCompleteInnerProps) {
  const { id } = useParams<{ id: string }>();
  const { theme } = useMarketingTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);

  // Use um ID padrão para demonstração se não fornecido
  const organizationId = id || '123e4567-e89b-12d3-a456-426614174000';

  // Atualizar activeTab quando initialTab mudar (quando rota mudar)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Mock data baseado no framework solicitado
  const metricsData: MarketingMetrics = {
    impressions: 2500000,
    impressionsChange: 15,
    clicks: 125000,
    clicksChange: 8,
    conversions: 3450,
    conversionsChange: 12,
    roi: 340,
    roiChange: 25,
    cpa: 12.50,
    cpaChange: -5
  };

  const channelsData: ChannelPerformance[] = [
    { channel: 'Instagram', icon: InstagramIcon, traffic: 45, engagement: 78, color: 'bg-gradient-to-r from-pink-500 to-purple-500' },
    { channel: 'Facebook', icon: FacebookIcon, traffic: 30, engagement: 65, color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
    { channel: 'YouTube', icon: YoutubeIcon, traffic: 15, engagement: 82, color: 'bg-gradient-to-r from-red-600 to-red-700' },
    { channel: 'Twitter', icon: TwitterIcon, traffic: 10, engagement: 45, color: 'bg-gradient-to-r from-sky-500 to-sky-600' }
  ];

  const aiInsights: AIInsight[] = [
    {
      id: '1',
      text: 'Melhor horário para postar: 19h-21h',
      category: 'Timing',
      confidence: 92,
      timestamp: '2min atrás'
    },
    {
      id: '2', 
      text: 'Audiência mais engajada: 25-34 anos',
      category: 'Demografía',
      confidence: 88,
      timestamp: '5min atrás'
    },
    {
      id: '3',
      text: 'Conteúdo de vídeo +40% engagement',
      category: 'Conteúdo',
      confidence: 95,
      timestamp: '8min atrás'
    }
  ];

  if (activeTab === 'content') {
    return (
      <div className={cn(
        "min-h-screen flex transition-all duration-500",
        theme === 'dark' 
          ? "marketing-gradient-bg text-white" 
          : "marketing-gradient-bg light text-gray-900"
      )}>
        <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 p-8">
          <ContentManagement theme={theme} />
        </div>
      </div>
    );
  }

  if (activeTab === 'campaigns') {
    return (
      <div className={cn(
        "min-h-screen flex transition-all duration-500",
        theme === 'dark' 
          ? "marketing-gradient-bg text-white" 
          : "marketing-gradient-bg light text-gray-900"
      )}>
        <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1">
          <CampaignsDashboard />
        </div>
      </div>
    );
  }

  if (activeTab === 'dashboard') {
    return (
      <div className={cn(
        "min-h-screen flex transition-all duration-500",
        theme === 'dark'
          ? "marketing-gradient-bg text-white"
          : "marketing-gradient-bg light text-gray-900"
      )}>
        <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 p-8">
          <MarketingDashboardHome theme={theme} />
        </div>
      </div>
    );
  }

  if (activeTab === 'automation') {
    return (
      <div className={cn(
        "min-h-screen flex transition-all duration-500",
        theme === 'dark'
          ? "marketing-gradient-bg text-white" 
          : "marketing-gradient-bg light text-gray-900"
      )}>
        <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1">
          <AutomationDashboard 
            onSelectAutomation={(automationId) => setSelectedAutomation(automationId)} 
          />
        </div>
      </div>
    );
  }

  if (activeTab !== 'dashboard') {
    return (
      <div className={cn(
        "min-h-screen flex transition-all duration-500",
        theme === 'dark' 
          ? "marketing-gradient-bg text-white" 
          : "marketing-gradient-bg light text-gray-900"
      )}>
        <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 p-8">
          <div className="glass-3d p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl gradient-purple-blue flex items-center justify-center">
              {React.createElement(navigationItems.find(item => item.id === activeTab)?.icon || Home, { 
                className: "w-6 h-6 text-white" 
              })}
            </div>
            <h3 className={cn(
              "text-xl font-bold mb-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {navigationItems.find(item => item.id === activeTab)?.label}
            </h3>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Funcionalidade em desenvolvimento - Dashboard completo em construção
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex transition-all duration-500",
      theme === 'dark' 
        ? "marketing-gradient-bg text-white" 
        : "marketing-gradient-bg light text-gray-900"
    )}>
      <MarketingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Marketing Dashboard
              </h1>
              <p className={cn(
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Visão completa em tempo real das suas campanhas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              {[
                { key: '7d', label: '7 dias' },
                { key: '30d', label: '30 dias' },
                { key: '90d', label: '90 dias' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key as any)}
                  className={cn(
                    "glass-button-3d px-4 py-2 text-sm font-medium",
                    selectedPeriod === key && "gradient-purple-blue text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <MarketingDashboardHome theme={theme} selectedPeriod={selectedPeriod} />
      </div>
    </div>
  );
}

function ContentEditor({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  // Estados do editor
  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'feed' | 'story' | 'reel'>('feed');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<Array<{
    file: File;
    url: string;
    type: 'image' | 'video';
    name: string;
    mediaType: 'feed' | 'story' | 'reel';
    dimensions: string;
  }>>([]);
  
  // Estados de conexões sociais
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  
  // Query client para invalidação de cache
  const queryClient = useQueryClient();

  // Estados para campanhas
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState<string>('');
  
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'from-pink-500 to-purple-500' },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter/X', icon: TwitterIcon, color: 'from-gray-800 to-gray-900' },
    { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, color: 'from-red-600 to-red-700' }
  ];

  // Dynamic AI-powered suggestions based on content
  const [suggestions, setSuggestions] = useState([
    'Digite algo e verei sugestões personalizadas! 🤖',
    'Comece a escrever para receber ideias...',
    'Sugestões inteligentes aparecerão aqui ✨'
  ]);
  
  const [lastContentForSuggestions, setLastContentForSuggestions] = useState('');

  // Queries para campanhas
  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      return data.data || [];
    },
    retry: false,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      console.log('🎯 Criando campanha INTEGRADA com Facebook Ads Manager:', campaignData);
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignData.name,
          description: campaignData.description,
          type: campaignData.type,
          status: 'active'
        }),
      });
      
      console.log('📡 Status da integração Facebook:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na integração Facebook:', errorData);
        throw new Error(errorData.message || `Failed to create Facebook campaign: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Campanha criada no Facebook Ads Manager:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('🎉 onSuccess executado:', data);
      
      // Força o recarregamento da lista de campanhas
      await refetchCampaigns();
      
      // Invalida o cache do react-query para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      setShowCampaignModal(false);
      setCampaignName('');
      setCampaignDescription('');
      setCampaignType('');
      toast({
        title: "🎯 Campanha criada no Facebook Ads!",
        description: `Campanha "${data.data?.name}" criada no Facebook Ads Manager. ID: ${data.facebook?.campaignId}`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation:', error);
      toast({
        title: "Erro ao criar campanha",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  // Generate contextual suggestions based on user's content
  const generateContextualSuggestions = async (userContent: string) => {
    if (!userContent || userContent.trim().length < 10) {
      setSuggestions([
        'Digite algo e verei sugestões personalizadas! 🤖',
        'Comece a escrever para receber ideias...',
        'Sugestões inteligentes aparecerão aqui ✨'
      ]);
      return;
    }

    try {
      const response = await fetch('/api/social-media/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userContent,
          platform: selectedPlatform || 'instagram'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.log('Usando sugestões inteligentes locais');
      // Smart fallback suggestions based on content analysis
      const fallbackSuggestions = generateFallbackSuggestions(userContent);
      setSuggestions(fallbackSuggestions);
    }
  };

  // Smart fallback suggestions based on content analysis
  const generateFallbackSuggestions = (userContent: string): string[] => {
    const contentLower = userContent.toLowerCase();
    
    if (contentLower.includes('produto') || contentLower.includes('venda')) {
      return [
        '🚀 Destaque os benefícios únicos do seu produto',
        '💰 Adicione uma oferta especial limitada',
        '⭐ Inclua depoimentos de clientes satisfeitos'
      ];
    }
    
    if (contentLower.includes('serviço') || contentLower.includes('qualidade')) {
      return [
        '🎯 Mostre o diferencial do seu serviço',
        '👥 Adicione casos de sucesso reais',
        '🔥 Crie urgência com tempo limitado'
      ];
    }
    
    if (contentLower.includes('empresa') || contentLower.includes('negócio')) {
      return [
        '🏢 Conte a história da sua empresa',
        '📈 Mostre números de crescimento',
        '🤝 Destaque parcerias importantes'
      ];
    }
    
    if (contentLower.includes('preço') || contentLower.includes('barato') || contentLower.includes('desconto')) {
      return [
        '💸 Destaque o melhor custo-benefício',
        '⏰ Crie senso de urgência na oferta',
        '🎁 Adicione bônus exclusivos'
      ];
    }
    
    return [
      '✨ Adicione emojis para mais engajamento',
      '💬 Inclua uma pergunta para interação',
      '🎯 Crie um call-to-action persuasivo'
    ];
  };

  // Debounced effect to generate suggestions when content changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content !== lastContentForSuggestions) {
        setLastContentForSuggestions(content);
        generateContextualSuggestions(content);
      }
    }, 1500); // Wait 1.5s after user stops typing

    return () => clearTimeout(timeoutId);
  }, [content, lastContentForSuggestions, selectedPlatform]);

  // Especificações de dimensões por plataforma e tipo
  const mediaSpecs = {
    instagram: {
      feed: [
        { ratio: '1:1', width: 1080, height: 1080, label: 'Quadrado (Padrão)' },
        { ratio: '4:5', width: 1080, height: 1350, label: 'Retrato' },
        { ratio: '1.91:1', width: 1080, height: 566, label: 'Paisagem' }
      ],
      story: [
        { ratio: '9:16', width: 1080, height: 1920, label: 'Story Vertical' }
      ],
      reel: [
        { ratio: '9:16', width: 1080, height: 1920, label: 'Reel Vertical' }
      ]
    },
    facebook: {
      feed: [
        { ratio: '1.91:1', width: 1200, height: 630, label: 'Recomendado' },
        { ratio: '1:1', width: 1080, height: 1080, label: 'Quadrado' }
      ],
      story: [
        { ratio: '9:16', width: 1080, height: 1920, label: 'Story Vertical' }
      ]
    }
  };

  // Carregar contas conectadas da API - MIGRADO para API NOVA (Semana 2)
  const loadConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const organizationId = getOrganizationId();
      const response = await fetch(`/api/social/accounts?organizationId=${organizationId}`);

      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
        // Auto-selecionar todas as contas ativas
        setSelectedAccounts(data.accounts?.filter((acc: any) => acc.isActive).map((acc: any) => acc.id) || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // OAuth Real do Facebook
  const handleOAuthLogin = (platform: string) => {
    if (platform === 'facebook') {
      // Abrir janela OAuth do Facebook
      const authWindow = window.open(
        '/api/auth/facebook/login',
        'FacebookAuth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Escutar callback OAuth
      const messageListener = (event: MessageEvent) => {
        if (event.data.type === 'FACEBOOK_OAUTH_SUCCESS') {
          const { accessToken } = event.data;
          // Conectar conta com token real
          handleConnectAccountWithToken('facebook', accessToken);
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
          console.error('OAuth Error:', event.data.error);
          toast({
            title: "Erro OAuth",
            description: "Falha na autenticação do Facebook.",
            variant: "destructive",
          });
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);
    }
  };

  // MIGRADO para API NOVA (Semana 2)
  const handleConnectAccountWithToken = async (platform: string, accessToken: string) => {
    try {
      const organizationId = getOrganizationId();
      const response = await fetch(`/api/social/auth/${platform}/connect?organizationId=${organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          accountData: {} // Será preenchido pela validação do token
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🎉 Conta conectada!",
          description: `${platform.toUpperCase()} conectado com sucesso.`,
        });
        loadConnectedAccounts(); // Recarregar lista
        setShowConnectModal(false);
      } else {
        throw new Error('Falha ao conectar conta');
      }
    } catch (error) {
      console.error('Erro ao conectar conta:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível conectar a conta.",
        variant: "destructive",
      });
    }
  };

  // Fallback para conexão manual (Instagram) - MIGRADO para API NOVA (Semana 2)
  const handleConnectAccount = async (platform: string, accessToken: string, accountData: any) => {
    try {
      const organizationId = getOrganizationId();
      const response = await fetch(`/api/social/auth/${platform}/connect?organizationId=${organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          accountData
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Conta conectada!",
          description: `${platform} conectado com sucesso.`,
        });
        loadConnectedAccounts(); // Recarregar lista
        setShowConnectModal(false);
      } else {
        throw new Error('Falha ao conectar conta');
      }
    } catch (error) {
      console.error('Erro ao conectar conta:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível conectar a conta.",
        variant: "destructive",
      });
    }
  };

  // Carregar contas ao montar o componente
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  // Funções de ação
  const handlePublish = async () => {
    // Primeiro mostra o preview
    setShowPreviewModal(true);
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo necessário",
        description: "Adicione algum conteúdo antes de salvar o rascunho.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Comprimir imagens para rascunhos também
      const compressedMediaItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.url && item.url.startsWith('data:image/')) {
            const compressedUrl = await compressImage(item.url, 800, 0.7);
            return { ...item, url: compressedUrl };
          }
          return item;
        })
      );

      const organizationId = getOrganizationId();
      const draftData = {
        content,
        mediaItems: compressedMediaItems, // Usando imagens comprimidas
        selectedAccounts,
        mediaType: compressedMediaItems.length > 0 ? compressedMediaItems[0].mediaType : 'feed',
        status: 'draft',
        publishMode: 'manual',
        campaignId: selectedCampaign === "none" ? null : selectedCampaign, // Inclui o ID da campanha selecionada
        organizationId
      };

      // MIGRADO para API NOVA (Semana 2)
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Rascunho salvo!",
          description: `Post salvo com sucesso${mediaItems.length > 0 ? ' com imagem' : ''}.`,
        });
        console.log('Rascunho salvo:', result);
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o rascunho.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo necessário",
        description: "Adicione algum conteúdo para visualizar o preview.",
        variant: "destructive",
      });
      return;
    }
    setShowPreviewModal(true);
  };

  const confirmPublish = async () => {
    setShowPreviewModal(false);
    setIsPublishing(true);
    try {
      // Comprimir imagens antes de enviar
      console.log('🔧 Comprimindo imagens antes do envio...');
      const compressedMediaItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.url && item.url.startsWith('data:image/')) {
            const compressedUrl = await compressImage(item.url, 800, 0.7);
            return { ...item, url: compressedUrl };
          }
          return item;
        })
      );

      const organizationId = getOrganizationId();
      const postData = {
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        content,
        mediaUrls: uploadedMedia.map(media => media.url || ''),
        mediaItems: compressedMediaItems, // Usando imagens comprimidas
        selectedAccounts: selectedAccounts,
        mediaType: compressedMediaItems.length > 0 ? compressedMediaItems[0].mediaType || 'feed' : 'feed',
        publishMode,
        scheduledAt: publishMode === 'schedule' ? scheduleDate : null,
        status: publishMode === 'draft' ? 'draft' : publishMode === 'schedule' ? 'scheduled' : 'published', // Para publishMode === 'now', definir como published para que o backend processe
        campaignId: selectedCampaign === "none" ? null : selectedCampaign, // Inclui o ID da campanha selecionada
        organizationId
      };

      // MIGRADO para API NOVA (Semana 2)
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ POST SALVO COM SUCESSO:', result);
        
        // Limpar formulário
        setContent('');
        setUploadedMedia([]);
        setMediaItems([]);
        setSelectedAccounts([]);
        setScheduleDate('');
        setPublishMode('now');
        
        // Usar a mensagem que vem do backend
        const message = result.message || 'Post salvo com sucesso';
        toast({
          title: publishMode === 'schedule' ? "📅 Post agendado!" : 
                 publishMode === 'now' ? "🎉 Post publicado!" : "💾 Rascunho salvo!",
          description: message,
        });

        // Recarregar dados se foi agendado
        if (publishMode === 'schedule') {
          console.log('🔄 Recarregando posts agendados...');
          // Forçar recarregamento dos dados de posts agendados
          window.location.reload();
        }
      } else {
        const error = await response.json();
        console.error('❌ Erro ao publicar:', error);
        toast({
          title: "Erro na publicação",
          description: error.message || "Ocorreu um erro ao publicar o post.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao publicar:', error);
      toast({
        title: "Erro na publicação",
        description: "Ocorreu um erro ao publicar o post. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // MIGRADO para API NOVA (Semana 2)
  const handlePublishPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('Post publicado:', result);
    } catch (error) {
      console.error('Erro ao publicar post:', error);
    }
  };


  const handleOptimizeWithAI = async () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Adicione algum conteúdo antes de otimizar!",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);

    try {
      const response = await fetch('/api/social-media/optimize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          platform: selectedPlatform || 'instagram',
          goal: 'engajamento',
          language: 'português'
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Handle new API response format (Semana 2)
        const optimizedContent = result.optimizedContent || result.data?.optimizedContent;
        const improvements = result.improvements || [];

        setContent(optimizedContent);

        // Show improvements in toast
        const improvementsText = improvements.length > 0
          ? improvements.join(', ')
          : 'Conteúdo otimizado com sucesso!';

        toast({
          title: "✨ Conteúdo otimizado com IA!",
          description: improvementsText,
          variant: "default",
        });

        console.log('🤖 Otimização IA:', result);
      } else {
        throw new Error('Erro ao otimizar conteúdo');
      }
    } catch (error) {
      console.error('Erro ao otimizar:', error);
      toast({
        title: "Erro",
        description: "Falha ao otimizar conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateHashtags = () => {
    const hashtags = "\n\n#marketing #digitalmarketing #business #growth #success";
    setContent(content + hashtags);
  };

  // Função para buscar dados de analytics
      const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/social-media/analytics');
      if (response.ok) {
        const result = await response.json();
        setAnalyticsData(result.data);
        console.log('📊 Analytics carregados:', result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    }
  };

  // Função para buscar posts recentes REAIS - MIGRADO para API NOVA (Semana 2)
  const fetchRecentPosts = async () => {
    try {
      const organizationId = getOrganizationId();
      const response = await fetch(`/api/social/posts?organizationId=${organizationId}&limit=5`);
      const data = await response.json();
      if (data.success) {
        setRecentPosts(data.data);
        console.log('📝 Posts recentes carregados:', data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar posts recentes:', error);
      setRecentPosts([]); // Manter vazio em caso de erro
    }
  };

  // Carregar analytics e posts quando componente monta
  React.useEffect(() => {
    fetchAnalytics();
    fetchRecentPosts();
  }, []);

  // Funções de upload de mídia
  const handleMediaUpload = (type: 'image' | 'video') => {
    setSelectedMediaType('feed'); // Padrão para feed
    setShowMediaModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateImageDimensions = (file: File, specs: any): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const { width, height } = img;
        const isValid = specs.some((spec: any) => 
          Math.abs(width / height - spec.width / spec.height) < 0.1
        );
        URL.revokeObjectURL(url);
        resolve(isValid);
      };
      img.src = url;
    });
  };

  const handleMediaConfirm = async () => {
    if (!mediaFile) return;

    // Validar dimensões
    const platform = selectedPlatform as 'instagram' | 'facebook';
    const specs = mediaSpecs[platform]?.[selectedMediaType];
    
    if (specs && mediaFile.type.startsWith('image/')) {
      const isValid = await validateImageDimensions(mediaFile, specs);
      if (!isValid) {
        alert(`Dimensões inválidas para ${selectedMediaType}. Use: ${specs.map((s: any) => s.label).join(' ou ')}`);
        return;
      }
    }

    // Adicionar mídia à lista
    const newMediaItem = {
      file: mediaFile,
      url: mediaPreview,
      type: mediaFile.type.startsWith('image/') ? 'image' as const : 'video' as const,
      name: mediaFile.name,
      mediaType: selectedMediaType,
      dimensions: `${selectedPlatform} ${selectedMediaType}`
    };

    setMediaItems([...mediaItems, newMediaItem]);
    setShowMediaModal(false);
    setMediaFile(null);
    setMediaPreview('');
    
    // Mostrar confirmação
    toast({
      title: "Mídia adicionada!",
      description: `${mediaFile.name} foi adicionada como ${selectedMediaType} para ${selectedPlatform}`,
    });
  };

  const removeMediaItem = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Context Bar - Campanhas */}
      <div className="lg:col-span-3 mb-4">
        <div className="glass-3d p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Campanha Ativa:
                </span>
              </div>
              
              <Select value={selectedCampaign || ''} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-60 glass-button-3d">
                  <SelectValue placeholder="Selecionar campanha..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">📝 Sem campanha (post avulso)</SelectItem>
                  {(Array.isArray(campaigns) ? campaigns : []).map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-2">
                        {campaign.type === 'organic' && '🌱'}
                        {campaign.type === 'sponsored' && '💰'}  
                        {campaign.type === 'promotional' && '🎯'}
                        {campaign.type === 'branding' && '✨'}
                        <span className="font-medium">{campaign.name}</span>
                        <span className="text-xs text-gray-500">({campaign.postsCount} posts)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCampaign && selectedCampaign !== "none" && (
                <Badge variant="secondary" className="gradient-purple-blue text-white">
                  {(Array.isArray(campaigns) ? campaigns : []).find((c: any) => c.id === selectedCampaign)?.type?.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="glass-button-3d text-xs"
                onClick={() => setShowCampaignModal(true)}
                data-testid="button-create-campaign"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Campanha
              </Button>
            </div>
          </div>
          
          {selectedCampaign && selectedCampaign !== "none" && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-sm text-gray-400">
                {(Array.isArray(campaigns) ? campaigns : []).find((c: any) => c.id === selectedCampaign)?.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Social Media Manager Card - Compacto */}
        <div className="glass-3d p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn(
              "text-sm font-bold flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Share2 className="w-4 h-4 text-purple-400" />
              Social Media Manager
            </h3>
            
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="glass-button-3d text-xs px-2 py-1"
                onClick={loadConnectedAccounts}
                disabled={isLoadingAccounts}
                data-testid="button-sync-accounts"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Button 
                size="sm" 
                className="gradient-purple-blue text-white text-xs px-2 py-1"
                onClick={() => setShowCampaignModal(true)}
                data-testid="button-new-campaign"
              >
                <Plus className="w-3 h-3 mr-1" />
                Nova Campanha
              </Button>
            </div>
          </div>
          
          {/* Interface Compacta de Conexão */}
          {connectedAccounts.length === 0 ? (
            <div className="p-3 rounded-lg glass-3d-light border-2 border-dashed border-gray-500/30">
              <div className="text-center mb-3">
                <h4 className={cn("text-xs font-medium mb-1", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Conecte suas contas de redes sociais
                </h4>
                <p className="text-xs text-gray-500">
                  Conecte Facebook e Instagram para publicar diretamente
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleOAuthLogin('facebook')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                  data-testid="button-connect-facebook"
                >
                  <FacebookIcon className="w-3 h-3 mr-1" />
                  🔗 OAuth Facebook
                </Button>
                
                <Button
                  onClick={() => setShowConnectModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-2"
                  data-testid="button-connect-instagram"
                >
                  <InstagramIcon className="w-3 h-3 mr-1" />
                  Conectar Instagram
                </Button>
              </div>
              
              <div className="mt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadConnectedAccounts}
                  disabled={isLoadingAccounts}
                  className="glass-button-3d text-xs px-2 py-1"
                  data-testid="button-refresh-accounts"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Lista compacta de contas conectadas */}
              <div className="max-h-24 overflow-y-auto space-y-1">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-2 rounded glass-3d-light">
                    <div className="flex items-center gap-2">
                      {account.platform === 'facebook' && <FacebookIcon className="w-3 h-3 text-blue-500" />}
                      {account.platform === 'instagram' && <InstagramIcon className="w-3 h-3 text-pink-500" />}
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium text-xs truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          {account.accountName || account.name}
                        </div>
                        <div className="text-xs text-green-400">
                          {account.isActive ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (selectedAccounts.includes(account.id)) {
                            setSelectedAccounts(prev => prev.filter(id => id !== account.id));
                          } else {
                            setSelectedAccounts(prev => [...prev, account.id]);
                          }
                        }}
                        className={cn(
                          "w-3 h-3 rounded border flex items-center justify-center",
                          selectedAccounts.includes(account.id) 
                            ? "bg-purple-500 border-purple-500" 
                            : "border-gray-500"
                        )}
                        data-testid={`checkbox-account-${account.id}`}
                      >
                        {selectedAccounts.includes(account.id) && <CheckCircle className="w-2 h-2 text-white" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botão para adicionar mais contas */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConnectModal(true)}
                className="w-full glass-button-3d text-xs py-2"
                data-testid="button-add-accounts"
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar Conta
              </Button>
            </div>
          )}
        </div>

        {/* Editor de Conteúdo Expandido */}
        <div className="glass-3d p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn(
              "text-lg font-bold flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Edit className="w-5 h-5 text-blue-400" />
              Editor de Conteúdo
            </h3>
            
            {/* Botões de ação do editor */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="glass-button-3d" onClick={handleGenerateHashtags}>
                <Brain className="w-4 h-4 mr-1" />
                Hashtags
              </Button>
              <Button size="sm" variant="outline" className="glass-button-3d" onClick={handleOptimizeWithAI}>
                <Zap className="w-4 h-4 mr-1" />
                IA
              </Button>
            </div>
          </div>

          {/* Barra de Ferramentas do Editor */}
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg glass-3d-light">
            <div className="flex gap-1">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all",
                    selectedPlatform === platform.id 
                      ? `bg-gradient-to-r ${platform.color} text-white` 
                      : "glass-button-3d"
                  )}
                >
                  <platform.icon className="w-3 h-3" />
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Área de Texto Principal */}
          <div className="mb-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Escreva seu conteúdo para ${platforms.find(p => p.id === selectedPlatform)?.name}...`}
              className={cn(
                "min-h-40 glass-3d text-sm resize-none border-0",
                theme === 'dark' 
                  ? 'bg-white/10 text-white placeholder-gray-400' 
                  : 'bg-black/5 text-gray-900 placeholder-gray-500'
              )}
            />
            
            {/* Contador de caracteres e validação */}
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {content.length} caracteres
                {selectedPlatform === 'twitter' && content.length > 280 && ' • Muito longo para Twitter'}
                {selectedPlatform === 'instagram' && content.length > 2200 && ' • Muito longo para Instagram'}
                {selectedPlatform === 'facebook' && content.length > 63206 && ' • Muito longo para Facebook'}
                {selectedPlatform === 'youtube' && content.length > 5000 && ' • Muito longo para YouTube'}
              </span>
              <span className="text-purple-400">
                {selectedAccounts.length} conta{selectedAccounts.length !== 1 ? 's' : ''} selecionada{selectedAccounts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Upload e Mídia */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className={cn("text-sm font-medium", theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                Adicionar Mídia
              </label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="glass-button-3d"
                  onClick={() => handleMediaUpload('image')}
                  data-testid="button-upload-image"
                >
                  <Image className="w-4 h-4 mr-1" />
                  Imagem
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="glass-button-3d"
                  onClick={() => handleMediaUpload('video')}
                  data-testid="button-upload-video"
                >
                  <VideoIcon className="w-4 h-4 mr-1" />
                  Vídeo
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="glass-button-3d"
                  data-testid="button-upload-file"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Arquivo
                </Button>
              </div>
            </div>
            
            {/* Preview de mídia upload */}
            {mediaItems.length > 0 && (
              <div className="space-y-3 mb-3">
                {mediaItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-3d rounded-lg">
                    <div className="flex items-center space-x-3">
                      {/* Preview da mídia */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {item.type === 'image' ? (
                          <img 
                            src={item.url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <VideoIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          {item.name}
                        </div>
                        <div className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          {item.mediaType} • {selectedPlatform}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaItem(index)}
                      className="text-red-400 hover:text-red-300"
                      data-testid={`button-remove-media-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configurações de Publicação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Modo de Publicação */}
            <div>
              <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                Modo de Publicação:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'now', label: 'Agora', icon: Send },
                  { id: 'schedule', label: 'Agendar', icon: Clock },
                  { id: 'draft', label: 'Rascunho', icon: Save }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPublishMode(mode.id as any)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-all",
                      publishMode === mode.id 
                        ? "gradient-purple-blue text-white" 
                        : "glass-button-3d"
                    )}
                  >
                    <mode.icon className="w-3 h-3" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agendamento */}
            {publishMode === 'schedule' && (
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                  Data e Hora:
                </label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className={cn(
                    "glass-3d text-sm border-0",
                    theme === 'dark' 
                      ? 'bg-white/10 text-white' 
                      : 'bg-black/5 text-gray-900'
                  )}
                />
              </div>
            )}
          </div>

          {/* Botões de Ação Principais */}
          <div className="flex gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-button-3d flex-1"
              disabled={!content.trim()}
              onClick={handlePreview}
              data-testid="button-preview-post"
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-button-3d flex-1"
              disabled={!content.trim()}
              onClick={handleSaveDraft}
              data-testid="button-save-draft"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar Rascunho
            </Button>
            
            <Button 
              onClick={handlePublish}
              disabled={!content.trim() || selectedAccounts.length === 0 || isPublishing}
              className="gradient-purple-blue text-white flex-1"
              size="sm"
              data-testid="button-publish-now"
            >
              {isPublishing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publicando...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {publishMode === 'schedule' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Agendar Post
                    </>
                  ) : publishMode === 'draft' ? (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publicar Agora
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>

          {/* Status de Publicação */}
          {isPublishing && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Publicando em {selectedAccounts.length} conta{selectedAccounts.length !== 1 ? 's' : ''}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar com Analytics e Ferramentas */}
      <div className="space-y-4">
        {/* Performance Recente */}
        <div className="glass-3d p-4">
          <h4 className={cn("text-sm font-bold mb-3 flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            📊 Performance Recente
            <button 
              onClick={fetchAnalytics}
              className="ml-auto text-xs px-2 py-1 rounded glass-button-3d hover:gradient-purple-blue hover:text-white transition-all"
            >
              🔄
            </button>
          </h4>
          
          {analyticsData ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Instagram:</span>
                <span className="text-pink-400 font-medium">
                  {analyticsData.instagram.likes.toLocaleString()} curtidas
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Facebook:</span>
                <span className="text-blue-400 font-medium">
                  {analyticsData.facebook.likes.toLocaleString()} curtidas
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Engajamento:</span>
                <span className="text-green-400 font-medium">{analyticsData.overall.totalEngagement}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Alcance:</span>
                <span className="text-cyan-400 font-medium">
                  {analyticsData.overall.totalReach.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-2 bg-gray-600/20 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-600/20 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-600/20 rounded animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Sugestões de IA */}
        <div className="glass-3d p-4">
          <h4 className={cn("text-sm font-bold mb-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            🤖 Sugestões de IA
          </h4>
          
          <div className="space-y-2 mb-3">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setContent(suggestion)}
                className={cn(
                  "w-full text-left p-2 rounded-lg text-xs glass-button-3d hover:gradient-purple-blue hover:text-white transition-all",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                {suggestion.slice(0, 60)}...
              </button>
            ))}
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full glass-button-3d"
            disabled={!content.trim() || isOptimizing}
            onClick={handleOptimizeWithAI}
          >
            {isOptimizing ? (
              <>
                <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                Otimizando...
              </>
            ) : (
              <>
                <Brain className="w-3 h-3 mr-1" />
                Otimizar com IA
              </>
            )}
          </Button>
        </div>

        {/* Melhores Horários */}
        <div className="glass-3d p-4">
          <h4 className={cn("text-sm font-bold mb-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            ⏰ Melhores Horários
          </h4>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Facebook:</span>
              <span className="text-blue-400">14h - 16h</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Instagram:</span>
              <span className="text-pink-400">19h - 21h</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Hoje:</span>
              <span className="text-green-400 font-medium">Ótimo período</span>
            </div>
          </div>
        </div>

        {/* Posts Recentes - DADOS REAIS */}
        <div className="glass-3d p-4">
          <h4 className={cn("text-sm font-bold mb-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            📝 Posts Recentes
          </h4>
          
          <div className="space-y-2">
            {recentPosts.length === 0 ? (
              <div className="p-3 text-center">
                <div className="text-gray-400 text-xs mb-2">📭</div>
                <div className="text-xs text-gray-400">Nenhum post encontrado</div>
                <div className="text-xs text-gray-500 mt-1">Publique seu primeiro post!</div>
              </div>
            ) : (
              recentPosts.map((post, index) => (
                <div key={post.id || index} className="p-2 rounded glass-3d-light">
                  <div className="flex items-center gap-2 mb-1">
                    {post.platform === 'instagram' && <InstagramIcon className="w-3 h-3 text-pink-400" />}
                    {post.platform === 'facebook' && <FacebookIcon className="w-3 h-3 text-blue-400" />}
                    <span className="text-xs text-gray-400">{post.time}</span>
                  </div>
                  <div className="text-xs text-gray-300 mb-1" title={post.fullText}>
                    {post.text}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">{post.likes} curtidas</span>
                    <span className="text-blue-400">{post.comments} comentários</span>
                    <span className="text-purple-400">{post.shares} shares</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Status: {post.status === 'published' ? '✅ Publicado' : post.status === 'scheduled' ? '⏰ Agendado' : '📝 Rascunho'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Upload de Mídia */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-3d p-6 rounded-xl max-w-md w-full">
            <h3 className={cn("text-lg font-bold mb-4", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Selecionar Tipo de Mídia</h3>
            
            {/* Seleção de Tipo de Mídia */}
            <div className="mb-4">
              <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>Tipo de Post:</label>
              <div className="flex gap-2">
                {Object.entries({
                  feed: '📱 Feed',
                  story: '📖 Story', 
                  reel: '🎬 Reel'
                }).map(([type, label]) => {
                  const platform = selectedPlatform as 'instagram' | 'facebook';
                  const specs = mediaSpecs[platform];
                  const available = specs && (type in specs) ? specs[type as keyof typeof specs] : null;
                  
                  return (
                    <button
                      key={type}
                      disabled={!available}
                      onClick={() => setSelectedMediaType(type as any)}
                      className={cn(
                        "flex-1 p-2 rounded text-sm font-medium transition-all",
                        selectedMediaType === type 
                          ? "gradient-purple-blue text-white" 
                          : "glass-button-3d",
                        !available && "opacity-50 cursor-not-allowed"
                      )}
                      data-testid={`button-media-type-${type}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Especificações */}
            <div className="mb-4">
              <div className={cn("text-xs p-2 rounded glass-3d-light", theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>                
                {(() => {
                  const platform = selectedPlatform as 'instagram' | 'facebook';
                  const platformSpecs = mediaSpecs[platform];
                  const specs = platformSpecs && (selectedMediaType in platformSpecs) ? platformSpecs[selectedMediaType as keyof typeof platformSpecs] : null;
                  if (specs) {
                    return (
                      <div>
                        <div className="font-medium mb-1">Dimensões recomendadas:</div>
                        {specs.map((spec: any, idx: number) => (
                          <div key={idx}>• {spec.width}x{spec.height}px ({spec.ratio}) - {spec.label}</div>
                        ))}
                      </div>
                    );
                  }
                  return <div>Tipo não disponível para {selectedPlatform}</div>;
                })()}
              </div>
            </div>

            {/* Upload de Arquivo */}
            <div className="mb-4">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
                data-testid="input-file-upload"
              />
              <label 
                htmlFor="media-upload" 
                className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer glass-3d-light hover:border-purple-400 transition-colors"
              >
                {mediaPreview ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <div className={cn("text-sm", theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                      Clique para selecionar arquivo
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {setShowMediaModal(false); setMediaFile(null); setMediaPreview('');}}
                className="flex-1 glass-button-3d"
                data-testid="button-cancel-upload"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleMediaConfirm}
                disabled={!mediaFile}
                className="flex-1 gradient-purple-blue text-white"
                data-testid="button-confirm-upload"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview do Post */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-3d p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className={cn("text-xl font-bold mb-4 text-center", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Preview do Post
            </h3>
            
            {/* Simulação do Post */}
            <div className="space-y-4 mb-6">
              {selectedAccounts.map((accountId) => {
                const account = connectedAccounts.find(a => a.id === accountId);
                if (!account) return null;
                
                return (
                  <div key={accountId} className="glass-3d-light p-4 rounded-lg">
                    {/* Header da plataforma */}
                    <div className="flex items-center gap-3 mb-3">
                      {account.platform === 'instagram' && <InstagramIcon className="w-5 h-5 text-pink-500" />}
                      {account.platform === 'facebook' && <FacebookIcon className="w-5 h-5 text-blue-500" />}
                      <div>
                        <div className={cn("font-medium text-sm", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          {account.name}
                        </div>
                        <div className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          {account.platform === 'instagram' ? 'Instagram' : 'Facebook'} • Agora
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo da imagem */}
                    {mediaItems.length > 0 && mediaItems[0]?.url && (
                      <div className="mb-3">
                        <div className={cn(
                          "relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200",
                          mediaItems[0].mediaType === 'story' ? 'aspect-[9/16] max-w-[300px] mx-auto' :
                          mediaItems[0].mediaType === 'reel' ? 'aspect-[9/16] max-w-[300px] mx-auto' :
                          'aspect-square max-w-[400px] mx-auto'
                        )}>
                          <img 
                            src={mediaItems[0].url} 
                            alt="Preview do Post"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', mediaItems[0]);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Imagem carregada com sucesso:', mediaItems[0].url);
                            }}
                          />
                          {mediaItems[0].mediaType === 'story' && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              Story
                            </div>
                          )}
                          {mediaItems[0].mediaType === 'reel' && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              Reel
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Texto do post */}
                    {content && (
                      <div className={cn(
                        "text-sm mb-3 whitespace-pre-wrap",
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {content}
                      </div>
                    )}

                    {/* Simulação de interações */}
                    <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span>Curtir</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageCircle className="w-4 h-4" />
                        <span>Comentar</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Share className="w-4 h-4" />
                        <span>Compartilhar</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo da publicação */}
            <div className="glass-3d-light p-4 rounded-lg mb-6">
              <h4 className={cn("font-bold text-sm mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Resumo da Publicação
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Plataformas:</span>
                  <span className="text-purple-400">{selectedAccounts.length} conta{selectedAccounts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Tipo:</span>
                  <span className="text-blue-400">{mediaItems.length > 0 ? `${mediaItems[0].mediaType.charAt(0).toUpperCase() + mediaItems[0].mediaType.slice(1)} com imagem` : 'Apenas texto'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Caracteres:</span>
                  <span className="text-green-400">{content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Modo:</span>
                  <span className="text-orange-400">
                    {publishMode === 'now' ? 'Publicar Agora' : 
                     publishMode === 'schedule' ? 'Agendado' : 'Rascunho'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowPreviewModal(false)}
                variant="outline"
                className="flex-1 glass-button-3d"
                data-testid="button-cancel-preview"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar e Editar
              </Button>
              <Button 
                onClick={confirmPublish}
                disabled={isPublishing}
                className="flex-1 gradient-purple-blue text-white"
                data-testid="button-confirm-publish"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {publishMode === 'schedule' ? 'Agendando...' : 
                     publishMode === 'now' ? 'Publicando...' : 'Salvando...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {publishMode === 'schedule' ? (
                      <>
                        <Calendar className="w-4 h-4" />
                        Confirmar Agendamento
                      </>
                    ) : publishMode === 'now' ? (
                      <>
                        <Send className="w-4 h-4" />
                        Confirmar e Publicar
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Rascunho
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conexão de Contas */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-3d p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Conectar Contas de Redes Sociais
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-white p-1"
                data-testid="button-close-connect-modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Conecte múltiplas contas do Facebook e Instagram para gerenciar suas publicações de forma centralizada.
              </p>

              {/* Facebook */}
              <div className="space-y-3">
                <h4 className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Facebook
                </h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleOAuthLogin('facebook')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-connect-facebook-main"
                  >
                    <FacebookIcon className="w-4 h-4 mr-2" />
                    🔗 Conectar com OAuth Real
                  </Button>
                  <Button
                    onClick={() => handleOAuthLogin('facebook')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-connect-facebook-secondary"
                  >
                    <FacebookIcon className="w-4 h-4 mr-2" />
                    🔐 Outra Conta Facebook
                  </Button>
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-3">
                <h4 className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Instagram
                </h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleOAuthLogin('facebook')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    data-testid="button-connect-instagram-main"
                  >
                    <InstagramIcon className="w-4 h-4 mr-2" />
                    🔗 OAuth Instagram Real
                  </Button>
                  <Button
                    onClick={() => handleOAuthLogin('facebook')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-connect-instagram-business"
                  >
                    <InstagramIcon className="w-4 h-4 mr-2" />
                    🔐 Conta Comercial Real
                  </Button>
                </div>
              </div>

              {/* Instruções */}
              <div className="mt-6 p-3 rounded glass-3d-light">
                <h5 className={cn("text-xs font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Como funciona?
                </h5>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Clique em "Conectar" para autorizar o acesso</li>
                  <li>• Você será redirecionado para autenticação</li>
                  <li>• Após conectar, poderá escolher quais contas usar</li>
                  <li>• Gerencie múltiplas contas facilmente</li>
                </ul>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1"
                  data-testid="button-cancel-connect"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={loadConnectedAccounts}
                  disabled={isLoadingAccounts}
                  className="flex-1 gradient-purple-blue text-white"
                  data-testid="button-refresh-modal"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Campanha */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCampaignModal(false)}>
          <div className="glass-3d p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Nova Campanha
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Crie uma nova campanha para organizar seus posts
                </p>
              </div>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="glass-button-3d p-2 hover:scale-105 transition-transform"
                data-testid="close-campaign-modal"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Nome da Campanha
                </label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Black Friday 2025"
                  className="glass-button-3d"
                  data-testid="input-campaign-name"
                />
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Objetivo da Campanha
                </label>
                <select 
                  value={campaignType} 
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="glass-button-3d w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    color: 'white',
                  }}
                  data-testid="select-campaign-type"
                >
                  <option value="" disabled style={{ backgroundColor: '#1a1a2e', color: '#888' }}>Selecionar objetivo...</option>
                  <option value="awareness" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>🎯 Reconhecimento - Alcance e impressões</option>
                  <option value="traffic" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>🔗 Tráfego - Cliques no link</option>
                  <option value="engagement" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>❤️ Interação - Curtidas, comentários, compartilhamentos</option>
                  <option value="leads" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>📝 Geração de cadastro - Leads e formulários</option>
                  <option value="app_promotion" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>📱 Promoção do app - Instalações e ações no app</option>
                  <option value="sales" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>💰 Vendas - Conversões e valor de conversão</option>
                  <option value="reach" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>👥 Alcance - Alcançar o máximo de pessoas únicas</option>
                  <option value="brand_awareness" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>✨ Reconhecimento da marca - Lembrança da marca</option>
                  <option value="video_views" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>📹 Visualizações de vídeo - Pessoas que assistem vídeos</option>
                  <option value="messages" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>💬 Mensagens - Conversas no Messenger/WhatsApp</option>
                  <option value="conversion" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>🎊 Conversão - Ações específicas no site</option>
                  <option value="store_visits" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>🏪 Visitas à loja - Pessoas que visitam loja física</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Descrição (Opcional)
                </label>
                <Textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Descreva o objetivo e estratégia desta campanha..."
                  className="glass-button-3d resize-none"
                  rows={3}
                  data-testid="textarea-campaign-description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCampaignModal(false)}
                className="glass-button-3d"
                data-testid="button-cancel-campaign"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!campaignName.trim()) {
                    toast({
                      title: "Nome obrigatório",
                      description: "Por favor, insira um nome para a campanha.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!campaignType) {
                    toast({
                      title: "Objetivo obrigatório",
                      description: "Por favor, selecione um objetivo para a campanha.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  createCampaignMutation.mutate({
                    name: campaignName.trim(),
                    description: campaignDescription.trim(),
                    type: campaignType,
                    status: 'active',
                  });
                }}
                disabled={createCampaignMutation.isPending || !campaignName.trim() || !campaignType}
                className="gradient-purple-blue text-white"
                data-testid="button-create-campaign-submit"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorialCalendar({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDayModal, setSelectedDayModal] = useState<{ date: Date; posts: any[] } | null>(null);

  // Buscar posts agendados reais do banco de dados - MIGRADO para API NOVA (Semana 2)
  const { data: scheduledPostsResponse, isLoading } = useQuery({
    queryKey: [`/api/social/posts?status=scheduled&organizationId=${getOrganizationId()}`],
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  const scheduledPosts = scheduledPostsResponse?.data || [];

  // Gerar dias do mês atual
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Começar no domingo anterior se necessário
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 semanas x 7 dias
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Agrupar posts por data
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post: any) => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navegar meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Abrir modal com posts do dia
  const openDayModal = (date: Date) => {
    const postsForDay = getPostsForDate(date);
    if (postsForDay.length > 0) {
      setSelectedDayModal({ date, posts: postsForDay });
    }
  };

  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatTime = (scheduledAt: string) => {
    return new Date(scheduledAt).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn(
            "text-lg font-bold flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Calendar className="w-5 h-5 text-cyan-400" />
            Calendário Editorial
          </h3>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="glass-button-3d p-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="glass-button-3d p-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 rotate-180" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "glass-button-3d px-3 py-2 text-xs font-medium",
              viewMode === 'week' && "gradient-purple-blue text-white"
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "glass-button-3d px-3 py-2 text-xs font-medium",
              viewMode === 'month' && "gradient-purple-blue text-white"
            )}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário Visual */}
        <div className="lg:col-span-3">
          <div className="glass-3d p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className={cn(
                  "text-center text-xs font-medium py-2",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                const postsForDay = getPostsForDate(date);
                const hasPost = postsForDay.length > 0;
                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <div 
                    key={index} 
                    onClick={() => openDayModal(date)}
                    className={cn(
                      "aspect-square p-2 rounded-lg text-center glass-button-3d relative transition-all cursor-pointer",
                      !isCurrentMonth && "opacity-30",
                      hasPost && "ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/20",
                      isToday && "ring-2 ring-purple-400 bg-purple-500/10",
                      hasPost && "hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/30"
                    )}
                    data-testid={`calendar-day-${date.getDate()}`}
                  >
                    <span className={cn(
                      "text-xs font-medium",
                      theme === 'dark' ? 'text-white' : 'text-gray-900',
                      !isCurrentMonth && "text-gray-500",
                      isToday && "text-purple-300 font-bold"
                    )}>
                      {date.getDate()}
                    </span>
                    
                    {/* Indicador de posts */}
                    {hasPost && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {postsForDay.length === 1 ? (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            {postsForDay.length > 2 && (
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Contador de posts */}
                    {postsForDay.length > 0 && (
                      <div className="absolute top-1 right-1">
                        <span className="text-[10px] bg-cyan-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {postsForDay.length}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista de Posts Agendados */}
        <div className="space-y-4">
          <h4 className={cn(
            "text-sm font-bold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Próximas Publicações
          </h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="glass-3d p-3 animate-pulse">
                  <div className="h-3 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : scheduledPosts.length > 0 ? (
            <div className="space-y-3">
              {scheduledPosts.map((post: any) => (
                <div key={post.id} className="glass-3d p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-xs mb-1",
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {post.title || post.fullText?.substring(0, 50) + '...' || 'Post agendado'}
                      </div>
                      <div className={cn(
                        "text-xs",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {new Date(post.scheduledAt).toLocaleDateString('pt-BR')} às {formatTime(post.scheduledAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-md bg-blue-500/20 text-blue-400">
                      {post.platform}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-md",
                      post.status === 'scheduled' ? 'bg-green-500/20 text-green-400' :
                      post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    )}>
                      {post.status === 'scheduled' ? 'Agendado' : post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
              <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                Nenhum post agendado
              </p>
              <p className={cn("text-xs mt-1 opacity-75", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                Seus posts agendados aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Dia */}
      {selectedDayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedDayModal(null)}>
          <div className="glass-3d p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Posts Agendados
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {selectedDayModal.date.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="glass-button-3d p-2 hover:scale-105 transition-transform"
                data-testid="close-modal"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Lista de Posts */}
            <div className="space-y-3">
              {selectedDayModal.posts.map((post: any) => (
                <div key={post.id} className="glass-3d p-4 border border-cyan-400/20">
                  {/* Plataforma e Hora */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {post.platform === 'instagram' && (
                        <InstagramIcon className="w-4 h-4 text-pink-400" />
                      )}
                      {post.platform === 'facebook' && (
                        <FacebookIcon className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-xs font-medium text-cyan-400">
                        {post.platform}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-md bg-green-500/20 text-green-400"
                    )}>
                      {formatTime(post.scheduledAt)}
                    </span>
                  </div>

                  {/* Conteúdo do Post */}
                  <div className="mb-3">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {post.fullText || post.text || 'Conteúdo do post...'}
                    </p>
                  </div>

                  {/* Ações do Post */}
                  <div className="flex items-center gap-2">
                    <button className="glass-button-3d px-3 py-1 text-xs hover:scale-105 transition-transform">
                      <Eye className="w-3 h-3 mr-1" />
                      Visualizar
                    </button>
                    <button className="glass-button-3d px-3 py-1 text-xs hover:scale-105 transition-transform">
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer do Modal */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDayModal(null)}
                className="glass-button-3d px-4 py-2 text-sm hover:scale-105 transition-transform"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateManager({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const categories = [
    { id: 'todos', name: 'Todos', count: 28 },
    { id: 'promocional', name: 'Promocional', count: 8 },
    { id: 'educativo', name: 'Educativo', count: 12 },
    { id: 'social-proof', name: 'Social Proof', count: 5 },
    { id: 'engagement', name: 'Engagement', count: 3 }
  ];

  const allTemplates = [
    { id: 1, name: 'Post Promocional Black Friday', category: 'promocional', uses: 45, preview: '🔥 SUPER OFERTA! Aproveite desconto de até 70% em todos os produtos. Apenas por tempo limitado!', platforms: ['instagram', 'facebook'], status: 'ativo' },
    { id: 2, name: 'Story Interativo Enquete', category: 'engagement', uses: 32, preview: '🤔 Ajude-nos a decidir! Qual produto vocês querem ver em nossa próxima coleção?', platforms: ['instagram'], status: 'ativo' },
    { id: 3, name: 'Carrossel Tutorial', category: 'educativo', uses: 28, preview: '📚 Tutorial completo em 5 slides: Como aproveitar ao máximo nosso produto', platforms: ['instagram', 'linkedin'], status: 'ativo' },
    { id: 4, name: 'Depoimento Cliente', category: 'social-proof', uses: 19, preview: '⭐ "Produto incrível! Superou todas as minhas expectativas" - Maria S., Cliente Satisfeita', platforms: ['facebook', 'instagram'], status: 'ativo' },
    { id: 5, name: 'Dica do Dia', category: 'educativo', uses: 15, preview: '💡 Dica do Dia: Sabia que você pode otimizar seus resultados fazendo isso?', platforms: ['linkedin', 'twitter'], status: 'rascunho' },
    { id: 6, name: 'Lançamento de Produto', category: 'promocional', uses: 12, preview: '🚀 NOVIDADE! Conheça nosso mais novo produto que vai revolucionar sua rotina', platforms: ['instagram', 'facebook', 'linkedin'], status: 'ativo' }
  ];

  const filteredTemplates = selectedCategory === 'todos' 
    ? allTemplates 
    : allTemplates.filter(template => template.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-bold flex items-center gap-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          <Activity className="w-5 h-5 text-orange-400" />
          Gerenciar Templates
        </h3>

        <button className="gradient-purple-blue px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Categorias */}
        <div className="space-y-4">
          <h4 className={cn(
            "text-sm font-bold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Categorias
          </h4>
          
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "w-full p-3 text-left glass-button-3d text-sm font-medium flex items-center justify-between",
                  selectedCategory === category.id && "gradient-purple-blue text-white"
                )}
              >
                <span>{category.name}</span>
                <span className="text-xs opacity-70">{category.count}</span>
              </button>
            ))}
          </div>

          <div className="glass-3d p-4 mt-6">
            <h4 className={cn(
              "text-sm font-bold mb-3",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Estatísticas
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Templates Ativos:</span>
                <span className="text-green-400">24</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Mais Usado:</span>
                <span className="text-purple-400">Promocional</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Conversão Média:</span>
                <span className="text-blue-400">8.2%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Templates */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="glass-3d p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className={cn(
                      "font-medium text-sm mb-1",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {template.name}
                    </h5>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-400">
                        {template.category}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-md",
                        template.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {template.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "text-xs mb-3 p-2 rounded-lg glass-3d-light",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {template.preview}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1">
                    {template.platforms.map((platform) => (
                      <span key={platform} className="text-xs">
                        {platform === 'instagram' ? '📸' :
                         platform === 'facebook' ? '📘' :
                         platform === 'linkedin' ? '💼' : '🐦'}
                      </span>
                    ))}
                  </div>
                  <span className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {template.uses} usos
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="glass-button-3d px-3 py-1 text-xs font-medium flex-1">
                    Usar
                  </button>
                  <button className="glass-button-3d px-3 py-1 text-xs font-medium">
                    Editar
                  </button>
                  <button className="glass-button-3d px-3 py-1 text-xs font-medium text-red-400">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MARKETING DASHBOARD HOME CONSOLIDADO - VERSÃO ANTIGA (NÃO USAR)
// =====================================================================

function MarketingDashboardHomeOld({
  theme = 'dark',
  selectedPeriod = '30d'
}: {
  theme?: 'dark' | 'light';
  selectedPeriod?: string;
}) {
  const [showNewCampaignWizard, setShowNewCampaignWizard] = useState(false);

  // ===== MARKETING METRICS =====
  const { data: globalMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: [`/api/marketing/global-metrics/${selectedPeriod.replace('d', '')}`],
    refetchInterval: 30000,
  });

  const { data: channelPerformance, isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/marketing/channel-performance'],
    refetchInterval: 30000,
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/marketing/ai-insights'],
    refetchInterval: 10000, // Atualizar a cada 10s para tempo real
  });

  // ===== SOCIAL MEDIA ANALYTICS (Semana 2) =====
  const { data: socialAnalytics, isLoading: socialAnalyticsLoading } = useQuery({
    queryKey: ['/api/social-media/analytics', selectedPeriod],
    queryFn: async () => {
      const days = parseInt(selectedPeriod.replace('d', ''));
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/social-media/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch social analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Estado para o setor selecionado do funil
  const [selectedSector, setSelectedSector] = useState('ecommerce');
  const [showSectorModal, setShowSectorModal] = useState(false);

  const { data: salesFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['/api/marketing/sales-funnel', selectedSector],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/sales-funnel?sector=${selectedSector}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Dados processados
  const metrics = globalMetrics?.data || {
    totalImpressions: 0,
    impressionsGrowth: 0,
    totalClicks: 0, 
    clicksGrowth: 0,
    totalConversions: 0,
    conversionsGrowth: 0,
    totalROI: 0,
    roiGrowth: 0,
    costPerAcquisition: 0,
    capaGrowth: 0
  };

  const channels = channelPerformance?.data || [];
  const insights = aiInsights?.data || [];
  const funnel = salesFunnel?.data || {
    awareness: 0,
    interest: 0,
    consideration: 0,
    intent: 0,
    evaluation: 0,
    purchase: 0
  };

  // Social Media Analytics (Semana 2)
  const socialMetrics = socialAnalytics?.data?.overall || {
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    totalImpressions: 0,
    engagementRate: 0,
    averageLikes: 0,
    averageComments: 0,
    averageShares: 0
  };

  const socialByPlatform = socialAnalytics?.data?.byPlatform || [];

  return (
    <div className="space-y-8">
      {/* ===== MÉTRICAS GLOBAIS ===== */}
      <div>
        <h2 className={cn(
          "text-2xl font-bold mb-6 flex items-center gap-3",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Métricas Globais
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Impressões */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                metrics.impressionsGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {metrics.impressionsGrowth > 0 ? '+' : ''}{metrics.impressionsGrowth}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? '...' : (metrics.totalImpressions / 1000000).toFixed(1) + 'M'}
              </div>
              <div className="text-xs text-gray-400">Impressões</div>
            </div>
          </div>

          {/* Cliques */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <MousePointer className="w-4 h-4 text-purple-400" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                metrics.clicksGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {metrics.clicksGrowth > 0 ? '+' : ''}{metrics.clicksGrowth}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? '...' : (metrics.totalClicks / 1000).toFixed(0) + 'K'}
              </div>
              <div className="text-xs text-gray-400">Cliques</div>
            </div>
          </div>

          {/* Conversões */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="w-4 h-4 text-green-400" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                metrics.conversionsGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {metrics.conversionsGrowth > 0 ? '+' : ''}{metrics.conversionsGrowth}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? '...' : metrics.totalConversions.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Conversões</div>
            </div>
          </div>

          {/* ROI */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                metrics.roiGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {metrics.roiGrowth > 0 ? '+' : ''}{metrics.roiGrowth}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? '...' : metrics.totalROI + '%'}
              </div>
              <div className="text-xs text-gray-400">ROI</div>
            </div>
          </div>

          {/* CPA */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                metrics.capaGrowth < 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {metrics.capaGrowth}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? '...' : '$' + metrics.costPerAcquisition}
              </div>
              <div className="text-xs text-gray-400">CPA</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SEGUNDA LINHA: PERFORMANCE POR CANAL + AI INSIGHTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance por Canal */}
        <div>
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Users className="w-5 h-5 text-purple-400" />
            Performance por Canal
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {channelsLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                {channels.map((channel: any, index: number) => (
                  <div key={index} className="glass-3d p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {channel.platform === 'instagram' && <InstagramIcon className="w-5 h-5 text-pink-500" />}
                        {channel.platform === 'facebook' && <FacebookIcon className="w-5 h-5 text-blue-500" />}
                        {channel.platform === 'youtube' && <YoutubeIcon className="w-5 h-5 text-red-500" />}
                        {channel.platform === 'twitter' && <TwitterIcon className="w-5 h-5 text-gray-500" />}
                        <div>
                          <div className={cn("font-medium capitalize", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                            {channel.platform}
                          </div>
                          <div className="text-xs text-gray-400">
                            {channel.followers?.toLocaleString()} seguidores
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-cyan-400">
                          {channel.trafficPercentage}%
                        </div>
                        <div className={cn(
                          "text-xs",
                          channel.isConnected ? 'text-green-400' : 'text-red-400'
                        )}>
                          {channel.isConnected ? 'Conectado' : 'Desconectado'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Engajamento:</span>
                        <span className="text-white">{channel.engagement}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Crescimento:</span>
                        <span className={channel.growth > 0 ? 'text-green-400' : 'text-red-400'}>
                          {channel.growth > 0 ? '+' : ''}{channel.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Status do Sistema Card - Movido para cá */}
                <div className="glass-3d p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-400" />
                      <div>
                        <div className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          Status do Sistema
                        </div>
                        <div className="text-xs text-gray-400">
                          Visão geral operacional
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">
                        100%
                      </div>
                      <div className="text-xs text-green-400">
                        Online
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Campanhas Ativas:</span>
                      <span className="text-white">12</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Posts Agendados:</span>
                      <span className="text-green-400">8</span>
                    </div>
                  </div>
                </div>

                {/* Budget Restante Card - Movido para cá */}
                <div className="glass-3d p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          Budget Restante
                        </div>
                        <div className="text-xs text-gray-400">
                          Controle financeiro
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-400">
                        $2.1K
                      </div>
                      <div className="text-xs text-green-400">
                        Disponível
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Gasto Hoje:</span>
                      <span className="text-white">$127</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Meta Mensal:</span>
                      <span className="text-cyan-400">$5K</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Brain className="w-5 h-5 text-cyan-400" />
            IA Insights (Tempo Real)
          </h2>
          
          <div className="space-y-3">
            {insightsLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
              </div>
            ) : (
              insights.map((insight: any) => (
                <div key={insight.id} className="glass-3d p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn("font-medium text-sm", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {insight.title}
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-1 rounded-md",
                      insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    )}>
                      {insight.confidence}%
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-2">
                    {insight.description}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{insight.time}</span>
                    {insight.actionable && (
                      <button className="glass-button-3d px-2 py-1 text-xs">
                        Aplicar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== TERCEIRA LINHA: FUNIL DE VENDAS + BOTÕES DE AÇÃO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funil de Vendas */}
        <div className="lg:col-span-2">
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <PieChart className="w-5 h-5 text-orange-400" />
            Funil de Vendas Interativo
          </h2>
          
          <div className="glass-3d p-6 relative">
            {/* Botão de Setor compacto dentro do card */}
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setShowSectorModal(true)}
                className="glass-button-3d px-2 py-1 text-xs font-medium flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 hover:from-orange-500/30 hover:to-orange-600/30 transition-all duration-300"
              >
                <Building className="w-3 h-3 text-orange-400" />
                <span className="text-gray-300">
                  {selectedSector === 'ecommerce' && '🛒 E-commerce'}
                  {selectedSector === 'financeiro' && '💰 Financeiro'} 
                  {selectedSector === 'educacional' && '📚 Educacional'}
                  {selectedSector === 'infoproduto' && '💡 Infoproduto'}
                </span>
                <ChevronDown className="w-2 h-2 text-orange-400" />
              </button>
            </div>

            {funnelLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-600/20 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-600/20 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="relative">
                {/* Target no fundo */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-24 opacity-20">
                  <div className="w-full h-full rounded-full border-4 border-white/20"></div>
                  <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-2 border-white/20"></div>
                  <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border border-white/20"></div>
                  <div className="absolute top-6 left-6 right-6 bottom-6 rounded-full bg-white/10"></div>
                </div>

                {/* Funil 3D Dinâmico por Setor */}
                <div className="relative flex flex-col items-center space-y-0 py-6" style={{ perspective: '1000px' }}>
                  {salesFunnel?.data?.stages?.map((stage: any, index: number) => {
                    const widthPercentages = [100, 90, 75, 65, 50]; // Larguras decrescentes
                    const clipPaths = [
                      'polygon(10% 0%, 90% 0%, 85% 100%, 15% 100%)',
                      'polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)',
                      'polygon(15% 0%, 85% 0%, 78% 100%, 22% 100%)',
                      'polygon(18% 0%, 82% 0%, 75% 100%, 25% 100%)',
                      'polygon(25% 0%, 75% 0%, 65% 100%, 35% 100%)'
                    ];
                    const heights = [5, 4.5, 4, 3.5, 3]; // Alturas mais compactas
                    
                    return (
                      <div key={index} className="relative" style={{ width: `${widthPercentages[index] || 50}%`, maxWidth: '400px' }}>
                        <div 
                          className="flex items-center justify-center text-white font-bold text-sm relative"
                          style={{
                            background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                            clipPath: clipPaths[index] || clipPaths[4],
                            transform: 'perspective(800px) rotateX(8deg)',
                            boxShadow: `0 4px 16px ${stage.color}80, 0 2px 8px rgba(0,0,0,0.3)`,
                            height: `${heights[index] || 9}rem`,
                            borderRadius: index === 0 ? '8px 8px 0 0' : index === (salesFunnel?.data?.stages?.length || 0) - 1 ? '0 0 6px 6px' : '0'
                          }}
                        >
                          <div className="text-center">
                            <div className="text-sm font-bold">{stage.name}</div>
                            <div className="text-xs opacity-90">{stage.value?.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Estatísticas */}
                <div className="mt-6 pt-4 border-t border-gray-600 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">Taxa de Conversão</div>
                    <div className="text-green-400 font-bold text-lg">{salesFunnel?.data?.totalConversionRate || 2.1}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Tempo Médio</div>
                    <div className="text-cyan-400 font-bold text-lg">{salesFunnel?.data?.averageTimeToConvert || 14} dias</div>
                  </div>
                </div>

                {/* Benchmarks das Plataformas por Setor */}
                {salesFunnel?.data?.platformBenchmarks && (
                  <div className="mt-6 pt-4 border-t border-gray-600">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        📊 Benchmarks Oficiais - {selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Facebook/Instagram */}
                      <div className="glass-3d-dark p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">f</span>
                          </div>
                          <span className="font-medium text-gray-300">Meta Ads</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">CTR:</span>
                            <span className="text-blue-400 font-medium">{salesFunnel?.data?.platformBenchmarks?.facebookCTR}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">CVR:</span>
                            <span className="text-green-400 font-medium">{salesFunnel?.data?.platformBenchmarks?.facebookCVR}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Google Ads */}
                      <div className="glass-3d-dark p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">G</span>
                          </div>
                          <span className="font-medium text-gray-300">Google Ads</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">CVR:</span>
                            <span className="text-green-400 font-medium">{salesFunnel?.data?.platformBenchmarks?.googleAdsCVR}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">CPA:</span>
                            <span className="text-orange-400 font-medium">${salesFunnel?.data?.platformBenchmarks?.avgCPA}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-500">
                        Dados atualizados baseados em benchmarks oficiais 2024-2025
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Botões de Ação Consolidados */}
        <div>
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Zap className="w-5 h-5 text-yellow-400" />
            Ações Rápidas
          </h2>
          
          <div className="space-y-4">
            {/* Criar Nova Campanha */}
            <button
              onClick={() => setShowNewCampaignWizard(true)}
              className="w-full glass-3d p-6 text-left hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg gradient-purple-blue">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold">Nova Campanha</div>
                  <div className="text-xs text-gray-400">Criar campanha completa</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Configure audiência, orçamento e creative assets
              </div>
            </button>

            {/* Criar Post */}
            <button 
              onClick={() => {
                // Navegar para o Content Editor
                const event = new CustomEvent('navigateToContentEditor');
                window.dispatchEvent(event);
              }}
              className="w-full glass-3d p-6 text-left hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg gradient-purple-blue">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold">Novo Post</div>
                  <div className="text-xs text-gray-400">Editor com IA integrada</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Crie conteúdo otimizado para todas as plataformas
              </div>
            </button>

            {/* Analíticos Avançados */}
            <button className="w-full glass-3d p-6 text-left hover:scale-105 transition-transform">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-lg gradient-purple-blue">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold">Relatórios</div>
                  <div className="text-xs text-gray-400">Analytics detalhado</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Insights profundos sobre performance
              </div>
            </button>

            {/* Status Operacional */}
            <div className="glass-3d p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold text-white">Status Operacional</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">APIs Conectadas:</span>
                  <span className="text-green-400">5/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sincronização:</span>
                  <span className="text-cyan-400">Ativa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span className="text-purple-400">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUARTA LINHA: SOCIAL MEDIA ANALYTICS (Semana 2) ===== */}
      <div>
        <h2 className={cn(
          "text-xl font-bold mb-4 flex items-center gap-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          <Share2 className="w-5 h-5 text-blue-400" />
          Social Media Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Posts */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {socialAnalyticsLoading ? '...' : socialMetrics.totalPosts}
              </div>
              <div className="text-xs text-gray-400">Total Posts</div>
            </div>
          </div>

          {/* Total Engagement */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Heart className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {socialAnalyticsLoading ? '...' : socialMetrics.totalEngagement.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Engagement</div>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {socialAnalyticsLoading ? '...' : socialMetrics.engagementRate.toFixed(2) + '%'}
              </div>
              <div className="text-xs text-gray-400">Engagement Rate</div>
            </div>
          </div>

          {/* Total Reach */}
          <div className="glass-3d p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {socialAnalyticsLoading ? '...' : (socialMetrics.totalReach / 1000).toFixed(1) + 'K'}
              </div>
              <div className="text-xs text-gray-400">Total Reach</div>
            </div>
          </div>
        </div>

        {/* Performance by Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {socialAnalyticsLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-600/20 rounded animate-pulse"></div>
            </div>
          ) : (
            socialByPlatform.map((platform: any, index: number) => (
              <div key={index} className="glass-3d p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {platform.platform === 'instagram' && <InstagramIcon className="w-5 h-5 text-pink-500" />}
                    {platform.platform === 'facebook' && <FacebookIcon className="w-5 h-5 text-blue-500" />}
                    {platform.platform === 'youtube' && <YoutubeIcon className="w-5 h-5 text-red-500" />}
                    {platform.platform === 'twitter' && <TwitterIcon className="w-5 h-5 text-gray-500" />}
                    <div>
                      <div className={cn("font-medium capitalize", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {platform.platform}
                      </div>
                      <div className="text-xs text-gray-400">
                        {platform.totalPosts} posts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">
                      {platform.engagementRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      Engagement
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Likes:</span>
                    <span className="text-white">{platform.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Comments:</span>
                    <span className="text-white">{platform.totalComments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Shares:</span>
                    <span className="text-white">{platform.totalShares.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Campaign Wizard Modal */}
      {showNewCampaignWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-3d p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nova Campanha</h3>
              <button 
                onClick={() => setShowNewCampaignWizard(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-400 mb-4">Assistente para criar nova campanha em desenvolvimento...</p>
            <button 
              onClick={() => setShowNewCampaignWizard(false)}
              className="w-full gradient-purple-blue text-white py-2 rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Setores */}
      {showSectorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-3d p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-400" />
                Selecionar Setor de Negócio
              </h3>
              <button 
                onClick={() => setShowSectorModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-6 text-sm">
              Escolha o setor para visualizar métricas e benchmarks específicos do seu negócio
            </p>

            <div className="space-y-3">
              {[
                { 
                  key: 'ecommerce', 
                  label: 'E-commerce', 
                  desc: 'Lojas online e varejo digital',
                  cvr: '2.8%',
                  icon: '🛒',
                  time: '7 dias',
                  stats: 'CVR: 2.8% | Tempo: 7 dias'
                },
                { 
                  key: 'financeiro', 
                  label: 'Financeiro', 
                  desc: 'Bancos, seguros e fintechs',
                  cvr: '2.8%',
                  icon: '💰',
                  time: '21 dias',
                  stats: 'CVR: 2.8% | Tempo: 21 dias'
                },
                { 
                  key: 'educacional', 
                  label: 'Educacional', 
                  desc: 'Cursos e instituições de ensino',
                  cvr: '13.8%',
                  icon: '📚',
                  time: '14 dias',
                  stats: 'CVR: 13.8% | Tempo: 14 dias'
                },
                { 
                  key: 'infoproduto', 
                  label: 'Infoproduto', 
                  desc: 'Produtos digitais e mentoria',
                  cvr: '12.0%',
                  icon: '💡',
                  time: '10 dias',
                  stats: 'CVR: 12.0% | Tempo: 10 dias'
                }
              ].map((sector) => (
                <button
                  key={sector.key}
                  onClick={() => {
                    setSelectedSector(sector.key);
                    setShowSectorModal(false);
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all duration-300 border group",
                    selectedSector === sector.key 
                      ? "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-400/40 text-white" 
                      : "glass-3d-dark border-transparent text-gray-300 hover:border-orange-400/20 hover:bg-orange-500/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{sector.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-base mb-1 group-hover:text-white transition-colors">
                          {sector.label}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">{sector.desc}</div>
                        <div className="text-xs text-orange-400 font-medium">
                          {sector.stats}
                        </div>
                      </div>
                    </div>
                    {selectedSector === sector.key && (
                      <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-500 text-center">
                📊 Dados baseados em benchmarks oficiais Meta & Google Ads 2024-2025
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketingDashboardComplete({ initialTab = 'dashboard' }: { initialTab?: string }) {
  return (
    <MarketingThemeProvider>
      <MarketingDashboardCompleteInner initialTab={initialTab} />
    </MarketingThemeProvider>
  );
}