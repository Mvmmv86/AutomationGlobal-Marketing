import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  TrendingUp, 
  MousePointer, 
  Target, 
  DollarSign,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Brain,
  BarChart3,
  Users,
  Video,
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
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { id: 'content', label: 'Conteúdo', icon: Video },
  { id: 'automation', label: 'Automação', icon: Zap },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

function ContentManagement({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [activeContentTab, setActiveContentTab] = useState('library');

  const contentTabs = [
    { id: 'library', label: 'Biblioteca', icon: Video },
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
              <Video className="w-5 h-5 text-purple-400" />
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
    { channel: 'Instagram', icon: Instagram, traffic: 45, engagement: 78, color: 'bg-gradient-to-r from-pink-500 to-purple-500' },
    { channel: 'Facebook', icon: Facebook, traffic: 30, engagement: 65, color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
    { channel: 'YouTube', icon: Youtube, traffic: 15, engagement: 82, color: 'bg-gradient-to-r from-red-600 to-red-700' },
    { channel: 'Twitter', icon: Twitter, traffic: 10, engagement: 45, color: 'bg-gradient-to-r from-sky-500 to-sky-600' }
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
  const [postContent, setPostContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [scheduleDate, setScheduleDate] = useState('');

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' }
  ];

  const suggestions = [
    'Aproveite nossa promoção especial de verão! 🌞',
    'Conheça nosso novo produto revolucionário',
    'Depoimentos de clientes satisfeitos ⭐',
    'Dicas exclusivas para você',
    'Tutorial: Como aproveitar ao máximo nosso serviço'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor Principal */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-3d p-4">
          <h3 className={cn(
            "text-lg font-bold mb-4 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Editor de Post
          </h3>

          {/* Seleção de Plataforma */}
          <div className="flex gap-2 mb-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "glass-button-3d px-3 py-2 text-xs font-medium flex items-center gap-2",
                  selectedPlatform === platform.id && "gradient-purple-blue text-white"
                )}
              >
                <span>{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>

          {/* Área de Texto */}
          <div className="mb-4">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Digite seu conteúdo aqui..."
              className={cn(
                "w-full h-32 p-3 rounded-lg border-0 glass-3d text-sm resize-none",
                theme === 'dark' 
                  ? 'bg-white/10 text-white placeholder-gray-400' 
                  : 'bg-black/5 text-gray-900 placeholder-gray-500'
              )}
            />
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {postContent.length}/280 caracteres
              </span>
              <span className="text-purple-400">
                {selectedPlatform === 'instagram' ? '📸 Instagram' : 
                 selectedPlatform === 'facebook' ? '📘 Facebook' :
                 selectedPlatform === 'twitter' ? '🐦 Twitter' : '💼 LinkedIn'}
              </span>
            </div>
          </div>

          {/* Agendamento */}
          <div className="mb-4">
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Agendar publicação
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className={cn(
                "w-full p-2 rounded-lg border-0 glass-3d text-sm",
                theme === 'dark' 
                  ? 'bg-white/10 text-white' 
                  : 'bg-black/5 text-gray-900'
              )}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button className="glass-button-3d px-4 py-2 text-sm font-medium text-gray-400">
              Salvar Rascunho
            </button>
            <button className="gradient-purple-blue px-4 py-2 rounded-lg text-sm font-medium text-white">
              {scheduleDate ? 'Agendar' : 'Publicar Agora'}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar com Sugestões */}
      <div className="space-y-4">
        <div className="glass-3d p-4">
          <h4 className={cn(
            "text-sm font-bold mb-3 flex items-center gap-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            <Zap className="w-4 h-4 text-yellow-400" />
            Sugestões IA
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPostContent(suggestion)}
                className={cn(
                  "w-full p-2 text-left text-xs rounded-lg glass-button-3d hover:gradient-purple-blue hover:text-white transition-all",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-3d p-4">
          <h4 className={cn(
            "text-sm font-bold mb-3",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Métricas Previstas
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Alcance:</span>
              <span className="text-green-400">2.3K - 4.1K</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Engajamento:</span>
              <span className="text-blue-400">180 - 320</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Melhor horário:</span>
              <span className="text-purple-400">19h - 21h</span>
            </div>
          </div>
        </div>
      </div>
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