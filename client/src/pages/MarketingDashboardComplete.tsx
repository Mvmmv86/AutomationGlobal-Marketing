import React from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Link,
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
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audience', label: 'Audiência', icon: Users },
  { id: 'content', label: 'Conteúdo', icon: VideoIcon },
  { id: 'automation', label: 'Automação', icon: Zap },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
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

  const contentStats = [
    { label: 'Posts Criados', value: 156, change: '+12%', icon: MessageCircle, color: 'text-blue-400' },
    { label: 'Templates Ativos', value: 24, change: '+3', icon: Activity, color: 'text-purple-400' },
    { label: 'Posts Agendados', value: 89, change: '+18', icon: Calendar, color: 'text-green-400' },
    { label: 'Engajamento Médio', value: '8.2%', change: '+1.5%', icon: TrendingUp, color: 'text-orange-400' }
  ];

  const recentContent = [
    { id: 1, title: 'Promoção Black Friday', platform: 'Instagram', status: 'Publicado', engagement: '15.2K', date: '2 horas atrás' },
    { id: 2, title: 'Tutorial Produto X', platform: 'YouTube', status: 'Agendado', engagement: '-', date: 'Amanhã 14h' },
    { id: 3, title: 'Depoimento Cliente', platform: 'Facebook', status: 'Rascunho', engagement: '-', date: '1 dia atrás' },
    { id: 4, title: 'Lançamento Nova Linha', platform: 'LinkedIn', status: 'Aprovação', engagement: '-', date: '3 horas atrás' }
  ];

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
              {recentContent.map((content) => (
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
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full p-3 rounded-lg text-left flex items-center gap-3 marketing-nav-item text-sm",
                activeTab === item.id && "active",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </button>
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

function MarketingDashboardCompleteInner() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useMarketingTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Use um ID padrão para demonstração se não fornecido
  const organizationId = id || '123e4567-e89b-12d3-a456-426614174000';

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

        {/* Métricas Globais */}
        <div className="mb-8">
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <TrendingUp className="w-5 h-5 text-green-400" />
            Métricas Globais (Tempo Real)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              title="Total Impressões"
              value={metricsData.impressions}
              change={metricsData.impressionsChange}
              icon={TrendingUp}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
              theme={theme}
            />
            
            <MetricCard
              title="Cliques"
              value={metricsData.clicks}
              change={metricsData.clicksChange}
              icon={MousePointer}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
              theme={theme}
            />
            
            <MetricCard
              title="Conversões"
              value={metricsData.conversions}
              change={metricsData.conversionsChange}
              icon={Target}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
              theme={theme}
            />
            
            <MetricCard
              title="ROI Geral"
              value={metricsData.roi}
              change={metricsData.roiChange}
              icon={DollarSign}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
              format="percentage"
              theme={theme}
            />
            
            <MetricCard
              title="Custo por Aquisição"
              value={metricsData.cpa}
              change={metricsData.cpaChange}
              icon={DollarSign}
              color="bg-gradient-to-r from-indigo-500 to-purple-500"
              format="currency"
              theme={theme}
            />
          </div>
        </div>

        {/* Performance por Canal */}
        <div className="mb-8">
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Target className="w-5 h-5 text-purple-400" />
            Performance por Canal
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {channelsData.map((channel, index) => (
              <ChannelCard key={index} channel={channel} theme={theme} />
            ))}
          </div>
        </div>

        {/* IA Insights */}
        <div>
          <h2 className={cn(
            "text-xl font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Brain className="w-5 h-5 text-cyan-400" />
            IA Insights (Tempo Real)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiInsights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} theme={theme} />
            ))}
          </div>
        </div>
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
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 'fb1', platform: 'facebook', name: 'Página Principal', connected: true, accountId: 'page_123' },
    { id: 'ig1', platform: 'instagram', name: '@empresa', connected: true, accountId: 'ig_456' }
  ]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['fb1', 'ig1']);
  
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'from-pink-500 to-purple-500' },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter/X', icon: TwitterIcon, color: 'from-gray-800 to-gray-900' },
    { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, color: 'from-red-600 to-red-700' }
  ];

  const suggestions = [
    'Aproveite nossa promoção especial de verão! 🌞',
    'Conheça nosso novo produto revolucionário',
    'Depoimentos de clientes satisfeitos ⭐',
    'Dicas exclusivas para você',
    'Tutorial: Como aproveitar ao máximo nosso serviço'
  ];

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

  // Funções de ação
  const handlePublish = async () => {
    // Primeiro mostra o preview
    setShowPreviewModal(true);
  };

  const confirmPublish = async () => {
    setShowPreviewModal(false);
    setIsPublishing(true);
    try {
      const postData = {
        content,
        mediaUrls: uploadedMedia.map(media => media.url || ''),
        accounts: selectedAccounts,
        publishMode,
        scheduledAt: publishMode === 'schedule' ? scheduleDate : null,
        postType: uploadedMedia.length > 0 ? 'media' : 'text'
      };

      const response = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'current-org-id' // TODO: Get from context
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();
      if (result.success) {
        console.log('Post criado com sucesso:', result.post);
        if (publishMode === 'now') {
          // Publicar imediatamente
          await handlePublishPost(result.post.id);
        }
        // Limpar formulário
        setContent('');
        setUploadedMedia([]);
      }
    } catch (error) {
      console.error('Erro ao publicar:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social-media/posts/${postId}/publish`, {
        method: 'POST',
        headers: {
          'x-organization-id': 'current-org-id' // TODO: Get from context
        }
      });
      const result = await response.json();
      console.log('Post publicado:', result);
    } catch (error) {
      console.error('Erro ao publicar post:', error);
    }
  };

  const handleConnectAccount = (platform: string) => {
    console.log('Conectar conta:', platform);
    // Aqui seria a integração real com APIs do Facebook/Instagram
  };

  const handleOptimizeWithAI = () => {
    // Simular otimização com IA
    const optimized = content + "\n\n✨ Versão otimizada com IA para maior engajamento!";
    setContent(optimized);
  };

  const handleGenerateHashtags = () => {
    const hashtags = "\n\n#marketing #digitalmarketing #business #growth #success";
    setContent(content + hashtags);
  };

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
      {/* Editor Principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Barra de Ações Rápidas */}
        <div className="glass-3d p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn(
              "text-lg font-bold flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Share2 className="w-5 h-5 text-purple-400" />
              Social Media Manager
            </h3>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="glass-button-3d">
                <RefreshCw className="w-4 h-4 mr-1" />
                Sincronizar
              </Button>
              <Button size="sm" className="gradient-purple-blue text-white">
                <Plus className="w-4 h-4 mr-1" />
                Nova Campanha
              </Button>
            </div>
          </div>
          
          {/* Status das Contas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-2 rounded-lg glass-3d-light">
                <div className="flex items-center gap-2">
                  {account.platform === 'facebook' && <FacebookIcon className="w-4 h-4 text-blue-500" />}
                  {account.platform === 'instagram' && <InstagramIcon className="w-4 h-4 text-pink-500" />}
                  <div>
                    <div className={cn("font-medium text-xs", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {account.name.split(' ')[0]}
                    </div>
                    <div className="text-xs text-green-400">Online</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedAccounts.includes(account.id)) {
                      setSelectedAccounts(prev => prev.filter(id => id !== account.id));
                    } else {
                      setSelectedAccounts(prev => [...prev, account.id]);
                    }
                  }}
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    selectedAccounts.includes(account.id) 
                      ? "bg-purple-500 border-purple-500" 
                      : "border-gray-500"
                  )}
                >
                  {selectedAccounts.includes(account.id) && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
              </div>
            ))}
            
            {/* Adicionar nova conta */}
            <button 
              onClick={() => handleConnectAccount('new')}
              className="flex items-center justify-center p-2 rounded-lg glass-3d-light border-2 border-dashed border-gray-500/30 hover:border-purple-400 transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
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
          <h4 className={cn("text-sm font-bold mb-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            📊 Performance Recente
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Instagram:</span>
              <span className="text-pink-400 font-medium">1.8K curtidas</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Facebook:</span>
              <span className="text-blue-400 font-medium">2.4K curtidas</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Engajamento:</span>
              <span className="text-green-400 font-medium">8.2%</span>
            </div>
          </div>
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
            disabled={!content.trim()}
            onClick={handleOptimizeWithAI}
          >
            <Brain className="w-3 h-3 mr-1" />
            Otimizar com IA
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

        {/* Posts Recentes */}
        <div className="glass-3d p-4">
          <h4 className={cn("text-sm font-bold mb-3", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            📝 Posts Recentes
          </h4>
          
          <div className="space-y-2">
            {[
              { platform: 'instagram', text: 'Promoção especial...', time: '2h', likes: '1.2K' },
              { platform: 'facebook', text: 'Novo produto...', time: '4h', likes: '890' },
              { platform: 'twitter', text: 'Dica rápida...', time: '6h', likes: '456' }
            ].map((post, index) => (
              <div key={index} className="p-2 rounded glass-3d-light">
                <div className="flex items-center gap-2 mb-1">
                  {post.platform === 'instagram' && <InstagramIcon className="w-3 h-3 text-pink-400" />}
                  {post.platform === 'facebook' && <FacebookIcon className="w-3 h-3 text-blue-400" />}
                  {post.platform === 'twitter' && <TwitterIcon className="w-3 h-3 text-gray-400" />}
                  <span className="text-xs text-gray-400">{post.time}</span>
                </div>
                <div className="text-xs text-gray-300 mb-1">{post.text}</div>
                <div className="text-xs text-green-400">{post.likes} curtidas</div>
              </div>
            ))}
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
                    {uploadedMedia.length > 0 && (
                      <div className="mb-3">
                        <div className={cn(
                          "relative rounded-lg overflow-hidden bg-gray-100",
                          selectedMediaType === 'story' ? 'aspect-[9/16] max-w-[300px] mx-auto' :
                          selectedMediaType === 'reel' ? 'aspect-[9/16] max-w-[300px] mx-auto' :
                          'aspect-square max-w-[400px] mx-auto'
                        )}>
                          <img 
                            src={uploadedMedia[0].preview} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {selectedMediaType === 'story' && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              Story
                            </div>
                          )}
                          {selectedMediaType === 'reel' && (
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
                  <span className="text-blue-400">{uploadedMedia.length > 0 ? `${selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)} com imagem` : 'Apenas texto'}</span>
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
                    Publicando...
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Send className="w-4 h-4" />
                    Confirmar e Publicar
                  </div>
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

  const scheduledPosts = [
    { id: 1, title: 'Promoção Black Friday', date: '2024-09-03', time: '14:00', platform: 'Instagram', status: 'agendado' },
    { id: 2, title: 'Tutorial Produto X', date: '2024-09-04', time: '10:30', platform: 'YouTube', status: 'aprovacao' },
    { id: 3, title: 'Depoimento Cliente', date: '2024-09-05', time: '16:15', platform: 'Facebook', status: 'rascunho' },
    { id: 4, title: 'Lançamento Nova Linha', date: '2024-09-06', time: '12:00', platform: 'LinkedIn', status: 'agendado' }
  ];

  const monthDays = Array.from({ length: 30 }, (_, i) => i + 1);

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
            Setembro 2024
          </p>
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
              {monthDays.map((day) => {
                const hasPost = scheduledPosts.some(post => 
                  new Date(post.date).getDate() === day
                );
                
                return (
                  <div key={day} className={cn(
                    "aspect-square p-2 rounded-lg text-center glass-button-3d relative",
                    hasPost && "ring-2 ring-purple-400"
                  )}>
                    <span className={cn(
                      "text-xs font-medium",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {day}
                    </span>
                    {hasPost && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
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
          
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="glass-3d p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium text-xs mb-1",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {post.title}
                    </div>
                    <div className={cn(
                      "text-xs",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {post.date} às {post.time}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-md bg-blue-500/20 text-blue-400">
                    {post.platform}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-md",
                    post.status === 'agendado' ? 'bg-green-500/20 text-green-400' :
                    post.status === 'aprovacao' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  )}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

export default function MarketingDashboardComplete() {
  return (
    <MarketingThemeProvider>
      <MarketingDashboardCompleteInner />
    </MarketingThemeProvider>
  );
}