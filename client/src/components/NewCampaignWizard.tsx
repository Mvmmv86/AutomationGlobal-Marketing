import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Target, 
  Users, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Brain,
  Eye,
  MousePointer,
  ShoppingBag,
  Instagram,
  Facebook,
  X as XIcon,
  ChevronRight,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react';

interface CampaignType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  objectives: string[];
}

interface PostData {
  platform: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
}

interface CampaignData {
  name: string;
  description: string;
  type: string;
  objective: string;
  firstPost?: PostData;
}

const campaignTypes: CampaignType[] = [
  {
    id: 'awareness',
    name: 'Reconhecimento',
    description: 'Aumente a visibilidade da sua marca',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500',
    objectives: ['Brand Awareness', 'Reach']
  },
  {
    id: 'consideration',
    name: 'Consideração',
    description: 'Engaje com pessoas interessadas',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    objectives: ['Traffic', 'Engagement', 'App Installs', 'Video Views', 'Lead Generation']
  },
  {
    id: 'conversion',
    name: 'Conversão',
    description: 'Incentive ações valiosas',
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    objectives: ['Conversions', 'Catalog Sales', 'Store Traffic']
  }
];

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
];

const contentTypes = [
  { id: 'text', name: 'Apenas Texto', icon: FileText, description: 'Post com texto simples' },
  { id: 'image', name: 'Texto + Imagem', icon: ImageIcon, description: 'Post com imagem' },
  { id: 'video', name: 'Texto + Vídeo', icon: Video, description: 'Post com vídeo' }
];

interface NewCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCampaignWizard({ isOpen, onClose }: NewCampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    type: '',
    objective: ''
  });
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  const [postData, setPostData] = useState<PostData>({
    platform: 'instagram',
    content: '',
    mediaType: 'text'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para criar campanha
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/social-media/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/campaigns'] });
      toast({
        title: "✅ Campanha Criada!",
        description: `Campanha "${campaignData.name}" criada com sucesso!`
      });
      
      // Se tem post, criar o post também
      if (postData.content.trim()) {
        createPostMutation.mutate({
          campaignId: response.id,
          ...postData
        });
      } else {
        handleClose();
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao criar campanha",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  });

  // Mutation para criar post
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/recent-posts'] });
      toast({
        title: "🎉 Post Criado!",
        description: "Primeiro post da campanha criado com sucesso!"
      });
      handleClose();
    }
  });

  const handleClose = () => {
    setCurrentStep(1);
    setCampaignData({ name: '', description: '', type: '', objective: '' });
    setSelectedType(null);
    setPostData({ platform: 'instagram', content: '', mediaType: 'text' });
    onClose();
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeSelect = (type: CampaignType) => {
    setSelectedType(type);
    setCampaignData(prev => ({
      ...prev,
      type: type.id,
      objective: type.objectives[0].toLowerCase().replace(' ', '_')
    }));
  };

  const handleFinish = () => {
    const finalData = {
      ...campaignData,
      firstPost: postData.content.trim() ? postData : undefined
    };
    
    createCampaignMutation.mutate(finalData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedType !== null;
      case 2: return campaignData.name.trim() !== '' && campaignData.description.trim() !== '';
      case 3: return true; // Post é opcional
      case 4: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Escolha o Tipo de Campanha</h3>
              <p className="text-purple-200">Selecione o objetivo principal da sua campanha</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {campaignTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`glass-3d border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedType?.id === type.id ? 'ring-2 ring-purple-400' : ''
                  }`}
                  onClick={() => handleTypeSelect(type)}
                  data-testid={`card-campaign-type-${type.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                        <type.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white">{type.name}</h4>
                        <p className="text-purple-200 text-sm">{type.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.objectives.slice(0, 3).map((obj) => (
                            <Badge key={obj} variant="secondary" className="text-xs">
                              {obj}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Configure sua Campanha</h3>
              <p className="text-purple-200">Defina os detalhes básicos da campanha</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Campanha</label>
                <Input
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Black Friday 2025"
                  className="glass-3d border-0 text-white placeholder-purple-300"
                  data-testid="input-campaign-name"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva os objetivos e estratégia da campanha..."
                  rows={4}
                  className="glass-3d border-0 text-white placeholder-purple-300 resize-none"
                  data-testid="textarea-campaign-description"
                />
              </div>

              {selectedType && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tipo Selecionado</label>
                  <Card className="glass-3d border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${selectedType.color} flex items-center justify-center`}>
                          <selectedType.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-white font-medium">{selectedType.name}</h5>
                          <p className="text-purple-200 text-sm">{selectedType.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Crie o Primeiro Post</h3>
              <p className="text-purple-200">Comece sua campanha com um post impactante (opcional)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Plataforma</label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <Card
                      key={platform.id}
                      className={`glass-3d border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        postData.platform === platform.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => setPostData(prev => ({ ...prev, platform: platform.id }))}
                      data-testid={`card-platform-${platform.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <platform.icon className={`w-6 h-6 ${platform.color}`} />
                          <span className="text-white font-medium">{platform.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Tipo de Conteúdo</label>
                <div className="grid grid-cols-1 gap-3">
                  {contentTypes.map((type) => (
                    <Card
                      key={type.id}
                      className={`glass-3d border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        postData.mediaType === type.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => setPostData(prev => ({ ...prev, mediaType: type.id }))}
                      data-testid={`card-content-type-${type.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <type.icon className="w-5 h-5 text-purple-400" />
                          <div>
                            <span className="text-white font-medium">{type.name}</span>
                            <p className="text-purple-200 text-sm">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Conteúdo do Post</label>
                <Textarea
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escreva o conteúdo do seu primeiro post..."
                  rows={6}
                  className="glass-3d border-0 text-white placeholder-purple-300 resize-none"
                  data-testid="textarea-post-content"
                />
                <p className="text-purple-300 text-xs mt-1">
                  Deixe em branco se quiser criar o post depois
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Revisar e Finalizar</h3>
              <p className="text-purple-200">Confira os detalhes antes de criar sua campanha</p>
            </div>

            <div className="space-y-4">
              <Card className="glass-3d border-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Detalhes da Campanha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-purple-300 text-sm">Nome:</span>
                    <p className="text-white font-medium">{campaignData.name}</p>
                  </div>
                  <div>
                    <span className="text-purple-300 text-sm">Descrição:</span>
                    <p className="text-white">{campaignData.description}</p>
                  </div>
                  <div>
                    <span className="text-purple-300 text-sm">Tipo:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedType && (
                        <>
                          <div className={`w-6 h-6 rounded bg-gradient-to-r ${selectedType.color} flex items-center justify-center`}>
                            <selectedType.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-white">{selectedType.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {postData.content.trim() && (
                <Card className="glass-3d border-0">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      Primeiro Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-purple-300 text-sm">Plataforma:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {platforms.find(p => p.id === postData.platform) && (
                          <>
                            {React.createElement(platforms.find(p => p.id === postData.platform)!.icon, {
                              className: `w-5 h-5 ${platforms.find(p => p.id === postData.platform)!.color}`
                            })}
                            <span className="text-white">{platforms.find(p => p.id === postData.platform)!.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-purple-300 text-sm">Conteúdo:</span>
                      <p className="text-white bg-black/20 rounded p-3 mt-1 text-sm">
                        {postData.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-3d border-0 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Nova Campanha
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Etapa {currentStep} de 4 - {
              ['Tipo de Campanha', 'Configuração', 'Primeiro Post', 'Revisão'][currentStep - 1]
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-purple-900/30 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="glass-3d border-purple-500/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="glass-button-3d gradient-purple-blue"
              data-testid="button-next-step"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={createCampaignMutation.isPending}
              className="glass-button-3d gradient-purple-blue"
              data-testid="button-finish-campaign"
            >
              {createCampaignMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}