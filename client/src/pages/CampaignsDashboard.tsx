import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import NewCampaignWizard from '@/components/NewCampaignWizard';
import {
  Play,
  Pause,
  Eye,
  RefreshCw,
  Settings,
  Facebook,
  Instagram,
  TrendingUp,
  Calendar,
  Users,
  Target,
  BarChart3
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  isConnectedToFacebook: boolean;
  facebookCampaignId?: string;
  facebookStatus?: string;
  facebookObjective?: string;
  lastSyncAt?: string;
  createdAt: string;
  postsCount: number;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  facebookConnected: number;
}

export default function CampaignsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewCampaignWizard, setShowNewCampaignWizard] = useState(false);

  // Buscar campanhas REAIS do banco usando nova API
  const { data: campaignsResponse, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useQuery<{
    success: boolean;
    data: {
      campaigns: any[];
    };
  }>({
    queryKey: ['/api/campaigns'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Mapear resposta do backend (snake_case) para interface frontend (camelCase)
  const campaigns: Campaign[] = (campaignsResponse?.data?.campaigns || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    status: c.status,
    isConnectedToFacebook: !!c.facebook_campaign_id,
    facebookCampaignId: c.facebook_campaign_id,
    facebookStatus: c.facebook_status,
    facebookObjective: c.facebook_objective,
    lastSyncAt: c.last_sync_at,
    createdAt: c.created_at,
    postsCount: c.posts_count || 0,
  }));

  // Calcular estatísticas REAIS
  const stats: CampaignStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    pausedCampaigns: campaigns.filter(c => c.status === 'paused').length,
    facebookConnected: campaigns.filter(c => c.isConnectedToFacebook).length,
  };

  // Mutation para sincronizar campanha individual
  // TODO: Implementar endpoint de sync quando necessário
  const syncCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao sincronizar');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Sincronização Realizada",
        description: data.message || "Campanha sincronizada com Facebook",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro na Sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSyncCampaign = (campaign: Campaign) => {
    if (!campaign.facebookCampaignId) {
      toast({
        title: "⚠️ Campanha não conectada",
        description: "Esta campanha não está vinculada ao Facebook",
        variant: "destructive",
      });
      return;
    }

    syncCampaignMutation.mutate(campaign.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getObjectiveIcon = (objective?: string) => {
    switch (objective) {
      case 'CONVERSIONS': return <Target className="w-4 h-4" />;
      case 'TRAFFIC': return <TrendingUp className="w-4 h-4" />;
      case 'AWARENESS': return <Eye className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen marketing-gradient-bg p-6">
      {/* Header */}
      <div className="glass-3d rounded-20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
              📊 Campanhas Facebook
            </h1>
            <p className="text-gray-300 opacity-75">
              Gerencie suas campanhas conectadas ao Facebook Ads Manager
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/marketing">
              <Button
                variant="outline"
                className="glass-button-3d"
                data-testid="button-back-marketing"
              >
                ← Voltar ao Marketing
              </Button>
            </Link>
            <Button
              onClick={() => refetchCampaigns()}
              disabled={loadingCampaigns}
              className="glass-button-3d"
              data-testid="button-refresh-campaigns"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingCampaigns ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              className="glass-button-3d gradient-purple-blue"
              onClick={() => setShowNewCampaignWizard(true)}
              data-testid="button-new-campaign"
            >
              <Target className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-3d border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Total de Campanhas</p>
                <p className="text-3xl font-bold text-white" data-testid="text-total-campaigns">
                  {stats.totalCampaigns}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-3d border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Campanhas Ativas</p>
                <p className="text-3xl font-bold text-green-400" data-testid="text-active-campaigns">
                  {stats.activeCampaigns}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-3d border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Pausadas</p>
                <p className="text-3xl font-bold text-yellow-400" data-testid="text-paused-campaigns">
                  {stats.pausedCampaigns}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Pause className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-3d border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Facebook Conectadas</p>
                <p className="text-3xl font-bold text-blue-400" data-testid="text-facebook-connected">
                  {stats.facebookConnected}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Facebook className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      <div className="glass-3d rounded-20 p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 flex items-center">
          <Target className="w-6 h-6 mr-2 text-purple-400" />
          Suas Campanhas
        </h2>

        {loadingCampaigns ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200">Carregando campanhas...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhuma campanha encontrada</p>
            <p className="text-gray-500">Crie sua primeira campanha no editor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="glass-3d border-0 hover:scale-105 transition-all duration-300"
                data-testid={`card-campaign-${campaign.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg truncate font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      🎯 {campaign.name}
                    </CardTitle>
                    <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                      {campaign.status === 'active' ? '●' : '⏸'} {campaign.status}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <CardDescription className="text-gray-300 text-sm opacity-80">
                      {campaign.description.length > 80
                        ? `${campaign.description.substring(0, 80)}...`
                        : campaign.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Dados Reais do Facebook */}
                  <div className="space-y-2">
                    <h4 className="text-white font-bold text-sm flex items-center bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                      📊 Dados do Facebook
                    </h4>

                    {campaign.isConnectedToFacebook ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-green-400">
                          <Facebook className="w-3 h-3 mr-2" />
                          <span>Conectado ao Facebook</span>
                        </div>
                        {campaign.facebookCampaignId && (
                          <div className="text-gray-300 opacity-75">
                            • ID: {campaign.facebookCampaignId.substring(0, 12)}...
                          </div>
                        )}
                        {campaign.facebookStatus && (
                          <div className="text-gray-300 opacity-75 flex items-center">
                            • Status FB:
                            <Badge className="ml-2 text-xs bg-blue-500/20 text-blue-400">
                              {campaign.facebookStatus}
                            </Badge>
                          </div>
                        )}
                        {campaign.facebookObjective && (
                          <div className="text-gray-300 opacity-75 flex items-center">
                            • Objetivo:
                            <span className="ml-1 flex items-center">
                              {getObjectiveIcon(campaign.facebookObjective)}
                              <span className="ml-1">{campaign.facebookObjective}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        ⚠️ Campanha local (não conectada)
                      </div>
                    )}
                  </div>

                  {/* Informações Gerais */}
                  <div className="space-y-2 pt-3 border-t border-white/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 opacity-75">📝 Posts vinculados:</span>
                      <span className="text-white font-bold" data-testid={`text-posts-count-${campaign.id}`}>
                        {campaign.postsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 opacity-75">📅 Criada:</span>
                      <span className="text-white font-bold">
                        {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {campaign.lastSyncAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 opacity-75">🔄 Última sync:</span>
                        <span className="text-green-400 font-bold">
                          {new Date(campaign.lastSyncAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="glass-button-3d flex-1"
                      data-testid={`button-view-posts-${campaign.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver Posts
                    </Button>

                    {campaign.isConnectedToFacebook && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="glass-button-3d"
                        onClick={() => handleSyncCampaign(campaign)}
                        disabled={syncCampaignMutation.isPending}
                        data-testid={`button-sync-${campaign.id}`}
                      >
                        <RefreshCw className={`w-3 h-3 ${syncCampaignMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      className="glass-button-3d"
                      data-testid={`button-settings-${campaign.id}`}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Campaign Wizard */}
      <NewCampaignWizard
        isOpen={showNewCampaignWizard}
        onClose={() => setShowNewCampaignWizard(false)}
      />
    </div>
  );
}
