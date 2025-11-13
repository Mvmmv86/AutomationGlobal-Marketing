import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  Instagram, 
  Send, 
  Calendar, 
  BarChart3, 
  Plus, 
  Eye,
  Trash2,
  Users,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Share
} from 'lucide-react';

interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'instagram';
  accountName: string;
  accountHandle: string;
  isActive: boolean;
  connectedAt: string;
}

interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  mediaUrls: string[];
  postType: 'text' | 'image' | 'video';
  status: 'draft' | 'published' | 'scheduled';
  scheduledAt?: string;
  publishedAt?: string;
  analytics?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  account?: {
    platform: string;
    accountName: string;
    accountHandle: string;
  };
}

interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  platforms: string[];
  usageCount: number;
}

export function SocialMediaManager() {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const { toast } = useToast();

  // Form states
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    accountId: '',
    publishMode: 'manual',
    scheduledAt: ''
  });
  
  const [newAccount, setNewAccount] = useState({
    platform: '',
    accountName: '',
    accountHandle: '',
    accessToken: ''
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Pegar organizationId do localStorage (salvo no login)
      const organizationId = localStorage.getItem('organizationId');

      if (!organizationId) {
        toast({
          title: 'Erro',
          description: 'Organização não encontrada. Faça login novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Load connected accounts (NOVA API - Semana 2)
      const accountsRes = await fetch(`/api/social/accounts?organizationId=${organizationId}`);
      const accountsData = await accountsRes.json();
      setAccounts(accountsData.accounts || []);

      // Load posts (NOVA API - Semana 2)
      const postsRes = await fetch(`/api/social/posts?organizationId=${organizationId}`);
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);

      // Load templates (API ANTIGA - ainda não migrada)
      const templatesRes = await fetch('/api/social-media/templates');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData.templates || []);

      // Load analytics (API ANTIGA - ainda não migrada)
      const analyticsRes = await fetch('/api/social-media/analytics');
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData);
      }

    } catch (error: any) {
      console.error('Load data error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async () => {
    try {
      // Pegar organizationId do localStorage
      const organizationId = localStorage.getItem('organizationId');

      if (!organizationId) {
        toast({
          title: 'Erro',
          description: 'Organização não encontrada. Faça login novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Validar plataforma
      const platform = newAccount.platform.toLowerCase();
      if (!['facebook', 'youtube'].includes(platform)) {
        toast({
          title: 'Erro',
          description: 'Selecione uma plataforma válida (Facebook ou YouTube)',
          variant: 'destructive'
        });
        return;
      }

      // 1. Obter URL de autorização OAuth (NOVA API - Semana 2)
      const authResponse = await fetch(
        `/api/social/auth/${platform}/connect?organizationId=${organizationId}`
      );
      const { authUrl } = await authResponse.json();

      // 2. Redirecionar usuário para autorização OAuth
      // Após autorização, o backend vai salvar a conta automaticamente
      // e redirecionar para /app/social/callback
      window.location.href = authUrl;

    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao conectar conta: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const createPost = async () => {
    try {
      // Pegar organizationId e userId do localStorage
      const organizationId = localStorage.getItem('organizationId');
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : null;

      if (!organizationId || !userId) {
        toast({
          title: 'Erro',
          description: 'Organização ou usuário não encontrado. Faça login novamente.',
          variant: 'destructive'
        });
        return;
      }

      // Buscar dados da conta selecionada para obter a plataforma
      const selectedAccount = accounts.find(a => a.id === newPost.accountId);
      if (!selectedAccount) {
        toast({
          title: 'Erro',
          description: 'Selecione uma conta válida',
          variant: 'destructive'
        });
        return;
      }

      // Criar post usando NOVA API - Semana 2
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          socialAccountId: newPost.accountId,
          platform: selectedAccount.platform, // facebook, instagram ou youtube
          postType: 'post', // ou 'story', 'video', 'reel'
          content: newPost.content,
          scheduledFor: newPost.scheduledAt || null, // ISO string ou null
          createdBy: userId,
          metadata: {
            title: newPost.title
          }
        })
      });

      const { post } = await response.json();

      if (post) {
        toast({
          title: 'Sucesso',
          description: newPost.scheduledAt ? 'Post agendado com sucesso!' : 'Post criado com sucesso!'
        });
        setNewPost({
          title: '',
          content: '',
          accountId: '',
          publishMode: 'manual',
          scheduledAt: ''
        });
        loadData();
      } else {
        throw new Error('Falha ao criar post');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao criar post: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const publishPost = async (postId: string) => {
    try {
      // Publicar post usando NOVA API - Semana 2
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: 'POST'
      });

      const { success } = await response.json();

      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Post publicado com sucesso!'
        });
        loadData();
      } else {
        throw new Error('Falha ao publicar post');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao publicar post: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const generateSuggestions = async () => {
    try {
      // API ANTIGA (socialMediaService) - funcional, sem necessidade de migração
      const response = await fetch('/api/social-media/suggestions?topic=marketing&platform=facebook');
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Generate suggestions error:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'secondary' | 'default' | 'outline' } = {
      draft: 'secondary',
      published: 'default',
      scheduled: 'outline'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'draft' && 'Rascunho'}
        {status === 'published' && 'Publicado'}
        {status === 'scheduled' && 'Agendado'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestão de Social Media
          </h2>
          <p className="text-gray-600">Gerencie suas publicações em redes sociais</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Conectar Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar Conta de Rede Social</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={newAccount.platform}
                  onValueChange={(value) => setNewAccount({...newAccount, platform: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Nome da conta"
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                />
                
                <Input
                  placeholder="Handle (@usuario)"
                  value={newAccount.accountHandle}
                  onChange={(e) => setNewAccount({...newAccount, accountHandle: e.target.value})}
                />
                
                <Input
                  type="password"
                  placeholder="Access Token (opcional para modo manual)"
                  value={newAccount.accessToken}
                  onChange={(e) => setNewAccount({...newAccount, accessToken: e.target.value})}
                />
                
                <Button 
                  onClick={connectAccount} 
                  className="w-full"
                  disabled={!newAccount.platform || !newAccount.accountName}
                >
                  Conectar Conta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {/* Create Post Form */}
          <Card className="glass-3d p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2 text-purple-600" />
              Criar Novo Post
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Input
                  placeholder="Título do post"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />
                
                <Textarea
                  placeholder="Conteúdo do post"
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                />
                
                <Select
                  value={newPost.accountId}
                  onValueChange={(value) => setNewPost({...newPost, accountId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {getPlatformIcon(account.platform)} {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button
                    onClick={createPost}
                    disabled={!newPost.content}
                    className="flex-1"
                  >
                    Salvar como Rascunho
                  </Button>
                  <Button
                    onClick={() => {
                      setNewPost({...newPost, publishMode: 'auto'});
                      createPost();
                    }}
                    disabled={!newPost.content || !newPost.accountId}
                    className="flex-1"
                  >
                    Publicar Agora
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sugestões de Conteúdo IA</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateSuggestions}
                    className="mb-2"
                  >
                    Gerar Sugestões
                  </Button>
                  
                  {suggestions.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => setNewPost({...newPost, content: suggestion})}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Posts List */}
          <div className="grid gap-4">
            {posts.map(post => (
              <Card key={post.id} className="glass-3d p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.account && getPlatformIcon(post.account.platform)}
                      <h4 className="font-medium">{post.title}</h4>
                      {getStatusBadge(post.status)}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      
                      {post.analytics && (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.analytics.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.analytics.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share className="w-4 h-4" />
                            {post.analytics.shares}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {post.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => publishPost(post.id)}
                      >
                        Publicar
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid gap-4">
            {accounts.map(account => (
              <Card key={account.id} className="glass-3d p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(account.platform)}
                    <div>
                      <h4 className="font-medium">{account.accountName}</h4>
                      <p className="text-sm text-gray-600">{account.accountHandle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-3d p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Alcance Total</p>
                  <p className="text-2xl font-bold">{analytics.summary?.totalReach || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-3d p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Impressões</p>
                  <p className="text-2xl font-bold">{analytics.summary?.totalImpressions || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-3d p-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Engajamento</p>
                  <p className="text-2xl font-bold">{analytics.summary?.totalEngagement || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-3d p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Clicks</p>
                  <p className="text-2xl font-bold">{analytics.summary?.totalClicks || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.map(template => (
              <Card key={template.id} className="glass-3d p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="mt-1 mr-2">{template.category}</Badge>
                    <p className="text-sm text-gray-600 mt-2">{template.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Usado {template.usageCount} vezes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPost({...newPost, content: template.content})}
                  >
                    Usar Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}