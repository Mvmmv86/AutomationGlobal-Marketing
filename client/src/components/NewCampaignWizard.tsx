import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Target, 
  Users, 
  TrendingUp, 
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  X as XIcon,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Instagram,
  Facebook,
  AlertCircle,
  Link as LinkIcon,
  Eye,
  MousePointer,
  ShoppingBag,
  Heart,
  Plus,
  MessageCircle,
  Send,
  ThumbsUp,
  Share
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: 'facebook' | 'instagram';
  name: string;
  username: string;
  profileImage?: string;
  isConnected: boolean;
}

interface CampaignData {
  name: string;
  objective: string;
  description: string;
  selectedAccount: string;
  postContent: string;
  mediaFile?: File;
  mediaPreview?: string;
  mediaType: 'text' | 'image' | 'video';
}

interface NewCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAMPAIGN_OBJECTIVES = [
  { value: 'awareness', label: 'Reconhecimento - Alcance e impressões', icon: Eye },
  { value: 'traffic', label: 'Tráfego - Direcionamento para site', icon: MousePointer },
  { value: 'engagement', label: 'Engajamento - Curtidas e comentários', icon: Heart },
  { value: 'leads', label: 'Geração de leads - Captura de contatos', icon: Target },
  { value: 'sales', label: 'Conversões - Vendas diretas', icon: ShoppingBag },
  { value: 'app_install', label: 'Instalações de app', icon: Plus }
];

export default function NewCampaignWizard({ isOpen, onClose }: NewCampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    objective: '',
    description: '',
    selectedAccount: '',
    postContent: '',
    mediaFile: undefined,
    mediaPreview: '',
    mediaType: 'text'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar contas conectadas
  const { data: connectedAccounts = [], isLoading: accountsLoading } = useQuery<ConnectedAccount[]>({
    queryKey: ['/api/social-media/connected-accounts'],
    enabled: isOpen
  });

  // Mutation para conectar conta
  const connectAccountMutation = useMutation({
    mutationFn: async (platform: string) => {
      // Redirecionar para OAuth do Facebook/Instagram
      window.location.href = `/api/social-media/connect/${platform}`;
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao conectar",
        description: error.message || "Não foi possível conectar a conta",
        variant: "destructive"
      });
    }
  });

  // Mutation para criar campanha e post
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      // Primeiro criar a campanha
      const campaignResponse = await apiRequest('POST', '/api/social-media/campaigns', {
        name: data.name,
        type: 'social_media', // Tipo padrão para campanhas de mídia social
        objective: data.objective,
        description: data.description,
        accountId: data.selectedAccount
      });

      const campaignData = await campaignResponse.json();

      // Depois criar o post
      const postPayload: any = {
        campaignId: campaignData.data?.id || 'temp-campaign-id',
        platform: getAccountPlatform(data.selectedAccount),
        accountId: data.selectedAccount,
        content: data.postContent,
        mediaType: data.mediaType,
        status: 'draft'
      };

      if (data.mediaFile) {
        // Converter arquivo para base64
        const base64 = await fileToBase64(data.mediaFile);
        postPayload.mediaUrl = base64;
      }

      const postResponse = await apiRequest('POST', '/api/social-media/posts', postPayload);

      return { campaign: campaignData, post: await postResponse.json() };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
      
      toast({
        title: "🎉 Campanha Criada!",
        description: `Campanha "${campaignData.name}" e post criados com sucesso!`
      });
      
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao criar campanha",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  });

  const handleClose = () => {
    setCurrentStep(1);
    setCampaignData({
      name: '',
      objective: '',
      description: '',
      selectedAccount: '',
      postContent: '',
      mediaFile: undefined,
      mediaPreview: '',
      mediaType: 'text'
    });
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "❌ Arquivo inválido",
          description: "Selecione apenas imagens ou vídeos",
          variant: "destructive"
        });
        return;
      }

      setCampaignData(prev => ({
        ...prev,
        mediaFile: file,
        mediaType: isImage ? 'image' : 'video'
      }));

      // Preview da imagem
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setCampaignData(prev => ({
            ...prev,
            mediaPreview: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const getAccountPlatform = (accountId: string): string => {
    const account = connectedAccounts?.find((acc: ConnectedAccount) => acc.id === accountId);
    return account?.platform || 'instagram';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim().length > 0 && campaignData.objective.length > 0;
      case 2:
        return campaignData.selectedAccount.length > 0;
      case 3:
        return campaignData.postContent.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Nova Campanha</h2>
              <p className="text-gray-400 text-sm">Crie uma nova campanha para organizar seus posts</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Campanha</label>
                <Input
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Black Friday 2025"
                  className="glass-3d border-0 text-white placeholder-gray-500 bg-white/5"
                  data-testid="input-campaign-name"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Objetivo da Campanha</label>
                <Select
                  value={campaignData.objective}
                  onValueChange={(value) => setCampaignData(prev => ({ ...prev, objective: value }))}
                >
                  <SelectTrigger className="glass-3d border-0 text-white bg-white/5" data-testid="select-campaign-objective">
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent className="glass-3d-dark border-0">
                    {CAMPAIGN_OBJECTIVES.map((obj) => (
                      <SelectItem key={obj.value} value={obj.value} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <obj.icon className="w-4 h-4" />
                          {obj.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Descrição (Opcional)</label>
                <Textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo e estratégia desta campanha..."
                  rows={3}
                  className="glass-3d border-0 text-white placeholder-gray-500 bg-white/5 resize-none"
                  data-testid="textarea-campaign-description"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Selecionar Conta</h2>
              <p className="text-gray-400 text-sm">Escolha a conta onde a campanha será executada</p>
            </div>

            {accountsLoading ? (
              <div className="flex justify-center py-8">
                <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-6">Nenhuma conta conectada</p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => connectAccountMutation.mutate('facebook')}
                      className="glass-button-3d w-full flex items-center gap-3"
                      data-testid="button-connect-facebook"
                    >
                      <Facebook className="w-5 h-5" />
                      Conectar Facebook
                    </Button>
                    <Button
                      onClick={() => connectAccountMutation.mutate('instagram')}
                      className="glass-button-3d w-full flex items-center gap-3"
                      data-testid="button-connect-instagram"
                    >
                      <Instagram className="w-5 h-5" />
                      Conectar Instagram
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-white text-sm font-medium mb-2 block">Contas Disponíveis</label>
                {connectedAccounts?.map((account: ConnectedAccount) => (
                  <Card
                    key={account.id}
                    className={`glass-3d border-0 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      campaignData.selectedAccount === account.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    onClick={() => setCampaignData(prev => ({ ...prev, selectedAccount: account.id }))}
                    data-testid={`card-account-${account.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {account.platform === 'facebook' ? (
                          <Facebook className="w-6 h-6 text-blue-500" />
                        ) : (
                          <Instagram className="w-6 h-6 text-pink-500" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{account.name}</p>
                          <p className="text-gray-400 text-sm">@{account.username}</p>
                        </div>
                        {account.isConnected && (
                          <Badge className="bg-green-500/20 text-green-400 border-0">
                            Conectada
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Criar Post</h2>
              <p className="text-gray-400 text-sm">Adicione o conteúdo do primeiro post da campanha</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Conteúdo do Post</label>
                <Textarea
                  value={campaignData.postContent}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, postContent: e.target.value }))}
                  placeholder="Escreva o texto do seu post aqui..."
                  rows={4}
                  className="glass-3d border-0 text-white placeholder-gray-500 bg-white/5 resize-none"
                  data-testid="textarea-post-content"
                />
                <p className="text-gray-400 text-xs mt-1">
                  {campaignData.postContent.length}/2200 caracteres
                </p>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Mídia (Opcional)</label>
                
                {!campaignData.mediaFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-3d border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Clique para adicionar imagem ou vídeo</p>
                    <p className="text-gray-400 text-sm">JPG, PNG, MP4 até 10MB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaignData.mediaType === 'image' && campaignData.mediaPreview && (
                      <div className="glass-3d p-4 rounded-lg">
                        <img 
                          src={campaignData.mediaPreview} 
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {campaignData.mediaType === 'video' && (
                      <div className="glass-3d p-4 rounded-lg flex items-center gap-3">
                        <Video className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{campaignData.mediaFile?.name}</p>
                          <p className="text-gray-400 text-sm">Vídeo selecionado</p>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCampaignData(prev => ({
                          ...prev,
                          mediaFile: undefined,
                          mediaPreview: '',
                          mediaType: 'text'
                        }));
                      }}
                      className="glass-3d border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Remover Mídia
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const selectedAccount = connectedAccounts?.find((acc: ConnectedAccount) => acc.id === campaignData.selectedAccount);
        const selectedObjective = CAMPAIGN_OBJECTIVES.find(obj => obj.value === campaignData.objective);

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Revisar e Publicar</h2>
              <p className="text-gray-400 text-sm">Confirme os detalhes antes de criar a campanha</p>
            </div>

            <div className="space-y-4">
              {/* Cards menores e mais compactos */}
              <div className="space-y-3">
                <Card className="glass-3d border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{campaignData.name}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {selectedObjective?.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedAccount && (
                  <Card className="glass-3d border-0">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {selectedAccount.platform === 'facebook' ? (
                          <Facebook className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Instagram className="w-4 h-4 text-pink-500" />
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{selectedAccount.name}</p>
                          <p className="text-gray-400 text-xs">@{selectedAccount.username}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preview realista do post */}
                <div className="glass-3d border-0 rounded-lg overflow-hidden">
                  {selectedAccount?.platform === 'instagram' ? (
                    // Instagram-style preview
                    <div className="bg-white">
                      {/* Header do Instagram */}
                      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Instagram className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-black text-sm font-semibold">{selectedAccount.username}</p>
                          <p className="text-gray-500 text-xs">Patrocinado</p>
                        </div>
                      </div>
                      
                      {/* Conteúdo da mídia */}
                      {campaignData.mediaPreview ? (
                        <div className="aspect-square bg-gray-100">
                          <img 
                            src={campaignData.mediaPreview} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : campaignData.mediaType === 'video' ? (
                        <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-12 h-12 text-white mx-auto mb-2" />
                            <p className="text-white text-xs">Vídeo</p>
                          </div>
                        </div>
                      ) : (
                        // Post só com texto - preview do texto em formato de imagem
                        <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
                          <p className="text-white text-center text-sm font-medium leading-relaxed">
                            {campaignData.postContent.length > 100 
                              ? campaignData.postContent.substring(0, 100) + '...'
                              : campaignData.postContent
                            }
                          </p>
                        </div>
                      )}
                      
                      {/* Footer do Instagram */}
                      <div className="p-3">
                        <div className="flex items-center gap-4 mb-2">
                          <Heart className="w-6 h-6 text-gray-800" />
                          <MessageCircle className="w-6 h-6 text-gray-800" />
                          <Send className="w-6 h-6 text-gray-800" />
                        </div>
                        <p className="text-black text-sm">
                          <span className="font-semibold">{selectedAccount.username}</span>{' '}
                          {campaignData.postContent.length > 120 
                            ? campaignData.postContent.substring(0, 120) + '... mais'
                            : campaignData.postContent
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Facebook-style preview
                    <div className="bg-white">
                      {/* Header do Facebook */}
                      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-black text-sm font-semibold">{selectedAccount?.name}</p>
                          <p className="text-gray-500 text-xs">Anúncio · Agora</p>
                        </div>
                      </div>
                      
                      {/* Texto do post */}
                      <div className="p-4">
                        <p className="text-black text-sm leading-relaxed mb-3">
                          {campaignData.postContent}
                        </p>
                        
                        {/* Mídia */}
                        {campaignData.mediaPreview ? (
                          <div className="rounded-lg overflow-hidden">
                            <img 
                              src={campaignData.mediaPreview} 
                              alt="Preview"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        ) : campaignData.mediaType === 'video' && (
                          <div className="bg-gray-900 rounded-lg h-48 flex items-center justify-center">
                            <div className="text-center">
                              <Video className="w-12 h-12 text-white mx-auto mb-2" />
                              <p className="text-white text-sm">{campaignData.mediaFile?.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer de interação */}
                      <div className="border-t border-gray-100 p-3">
                        <div className="flex justify-between text-gray-600">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">Curtir</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">Comentar</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share className="w-4 h-4" />
                            <span className="text-xs">Compartilhar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-3d-dark border-0 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <div className="flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h1 className="text-lg font-bold text-white">
                  {currentStep === 1 && "Nova Campanha"}
                  {currentStep === 2 && "Selecionar Conta"}
                  {currentStep === 3 && "Criar Post"}
                  {currentStep === 4 && "Revisar e Publicar"}
                </h1>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Etapa {currentStep} de 4
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="glass-3d border-0 hover:bg-white/10"
            >
              <XIcon className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-1 mb-6">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          <div className="min-h-[400px] mb-6">
            {renderStep()}
          </div>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="glass-3d border-gray-600 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="glass-button-3d gradient-purple-blue"
                data-testid="button-next-step"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => createCampaignMutation.mutate(campaignData)}
                disabled={createCampaignMutation.isPending || !canProceed()}
                className="glass-button-3d gradient-purple-blue"
                data-testid="button-create-campaign"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}