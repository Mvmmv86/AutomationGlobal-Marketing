import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  Mail,
  Phone,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Search,
  Filter,
  Eye,
  CreditCard,
  Pause,
  Play,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Brain,
  DollarSign,
  Target,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Globe,
  ArrowRight,
  ArrowLeft,
  Upload,
  Megaphone,
  Headphones,
  TrendingDown,
  Cpu,
  Plug,
  UserPlus,
  FileCheck,
  Home,
  Star,
  Crown,
  Check,
  X,
  Info,
  Sparkles,
  Database,
  Cloud,
  Lock,
  Wifi,
  MessageSquare,
  BookOpen,
  Briefcase,
  PieChart
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Tipos seguindo o schema do projeto
interface Organization {
  id: string;
  name: string;
  email: string;
  type: 'marketing' | 'support' | 'trading';
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'inactive';
  logoUrl?: string;
  userCount: number;
  aiUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  revenue: number;
  lastActivity: string;
  createdAt: string;
  settings: {
    maxUsers: number;
    maxAiRequests: number;
    features: string[];
  };
}

interface FilterState {
  search: string;
  type: string;
  plan: string;
  status: string;
  dateRange: string;
}

interface GlobalStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  totalAiRequests: number;
  totalAiCost: number;
  growthRate: number;
}

// Wizard interfaces
interface WizardData {
  // Step 1: Informações Básicas
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  logo?: File;
  
  // Step 2: Tipo de Negócio
  businessType: 'marketing' | 'support' | 'trading';
  selectedModules: string[];
  
  // Step 3: Plano
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  
  // Step 4: IA Configuration
  primaryAiProvider: 'openai' | 'anthropic';
  backupAiProvider: 'openai' | 'anthropic';
  aiModels: Record<string, string>;
  aiLimits: Record<string, number>;
  
  // Step 5: Módulos
  includedModules: string[];
  optionalModules: string[];
  moduleConfigs: Record<string, any>;
  
  // Step 6: Integrações
  integrations: string[];
  integrationConfigs: Record<string, any>;
  
  // Step 7: Equipe
  adminUser: { name: string; email: string; role: string };
  teamMembers: Array<{ name: string; email: string; role: string }>;
  
  // Step 8: Confirmação
  acceptTerms: boolean;
  billingInfo: any;
}

// Plan configurations
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    users: 1,
    aiRequests: 100,
    features: ['Basic AI', 'Community Support', 'Core Features'],
    color: 'from-gray-600 to-slate-600',
    icon: Shield
  },
  starter: {
    name: 'Starter',
    price: 29,
    users: 2,
    aiRequests: 1000,
    features: ['Basic AI', 'Email Support', '1 Integration'],
    color: 'from-blue-600 to-cyan-600',
    icon: Star
  },
  professional: {
    name: 'Professional', 
    price: 99,
    users: 10,
    aiRequests: 10000,
    features: ['Advanced AI', 'Priority Support', '5 Integrations', 'Analytics'],
    color: 'from-purple-600 to-pink-600',
    icon: Zap
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    users: -1, // Unlimited
    aiRequests: 100000,
    features: ['Full AI Suite', '24/7 Support', 'Unlimited Integrations', 'Advanced Analytics', 'Custom Features'],
    color: 'from-yellow-600 to-orange-600',
    icon: Crown
  }
};

// Business types and their modules
const BUSINESS_TYPES = {
  marketing: {
    name: 'Agência de Marketing',
    icon: Megaphone,
    color: 'from-cyan-600 to-blue-600',
    description: 'Automação completa para agências de marketing digital',
    modules: [
      { id: 'marketing-ai', name: 'Marketing AI', description: 'Criação automática de campanhas' },
      { id: 'content-ai', name: 'Content AI', description: 'Geração de conteúdo inteligente' },
      { id: 'analytics-ai', name: 'Analytics AI', description: 'Análise preditiva de campanhas' }
    ]
  },
  support: {
    name: 'Centro de Suporte',
    icon: Headphones,
    color: 'from-green-600 to-emerald-600',
    description: 'Plataforma completa de atendimento ao cliente',
    modules: [
      { id: 'support-ai', name: 'Support AI', description: 'Atendimento automatizado' },
      { id: 'chatbot-ai', name: 'Chatbot AI', description: 'Chat inteligente 24/7' },
      { id: 'knowledge-ai', name: 'Knowledge AI', description: 'Base de conhecimento inteligente' }
    ]
  },
  trading: {
    name: 'Mesa de Trading',
    icon: TrendingUp,
    color: 'from-yellow-600 to-orange-600',
    description: 'Plataforma avançada para trading automatizado',
    modules: [
      { id: 'trading-ai', name: 'Trading AI', description: 'Algoritmos de trading automatizado' },
      { id: 'risk-ai', name: 'Risk AI', description: 'Análise de risco em tempo real' },
      { id: 'market-ai', name: 'Market AI', description: 'Análise preditiva de mercado' }
    ]
  }
};

// Schemas de formulário
const createOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise'], {
    required_error: 'Selecione um plano'
  }),
  type: z.enum(['marketing', 'support', 'trading'], {
    required_error: 'Selecione um tipo'
  }),
  description: z.string().optional(),
});

const editOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
  type: z.enum(['marketing', 'support', 'trading']),
  status: z.enum(['active', 'inactive', 'trial', 'suspended']),
  description: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;
type EditOrgForm = z.infer<typeof editOrgSchema>;

const ITEMS_PER_PAGE = 25;

// Mock data - será substituído pela API real
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    email: 'admin@techcorp.com',
    type: 'marketing',
    plan: 'enterprise',
    status: 'active',
    logoUrl: 'https://via.placeholder.com/40x40/00f5ff/ffffff?text=TC',
    userCount: 45,
    aiUsage: { requests: 12500, tokens: 450000, cost: 127.50 },
    revenue: 2400,
    lastActivity: '2025-01-28T10:30:00Z',
    createdAt: '2024-08-15T09:00:00Z',
    settings: { maxUsers: 50, maxAiRequests: 50000, features: ['advanced-ai', 'priority-support'] }
  },
  {
    id: '2',
    name: 'StartupX Innovation',
    email: 'team@startupx.io',
    type: 'support',
    plan: 'pro',
    status: 'trial',
    logoUrl: 'https://via.placeholder.com/40x40/8b5cf6/ffffff?text=SX',
    userCount: 12,
    aiUsage: { requests: 3200, tokens: 85000, cost: 34.80 },
    revenue: 890,
    lastActivity: '2025-01-28T08:15:00Z',
    createdAt: '2024-12-10T14:30:00Z',
    settings: { maxUsers: 25, maxAiRequests: 10000, features: ['standard-ai'] }
  },
  {
    id: '3',
    name: 'Enterprise Analytics Co',
    email: 'ops@enterprise-analytics.com',
    type: 'trading',
    plan: 'enterprise',
    status: 'active',
    logoUrl: 'https://via.placeholder.com/40x40/10b981/ffffff?text=EA',
    userCount: 78,
    aiUsage: { requests: 25600, tokens: 890000, cost: 245.30 },
    revenue: 4800,
    lastActivity: '2025-01-28T11:45:00Z',
    createdAt: '2024-06-20T11:00:00Z',
    settings: { maxUsers: 100, maxAiRequests: 100000, features: ['advanced-ai', 'priority-support'] }
  }
];

const mockGlobalStats: GlobalStats = {
  totalOrganizations: 22,
  activeOrganizations: 18,
  totalUsers: 340,
  totalRevenue: 28500,
  totalAiRequests: 89300,
  totalAiCost: 2180.75,
  growthRate: 15.3
};

export default function OrganizationsManagementComplete() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    plan: 'all',
    status: 'all',
    dateRange: 'all'
  });
  
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  // Wizard states
  const [currentWizardStep, setCurrentWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    selectedModules: [],
    includedModules: [],
    optionalModules: [],
    integrations: [],
    teamMembers: [],
    aiModels: {},
    aiLimits: {},
    moduleConfigs: {},
    integrationConfigs: {},
    acceptTerms: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Forms
  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      email: '',
      description: '',
    },
  });

  const editForm = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
  });

  // Queries
  const { data: organizations = mockOrganizations, isLoading, refetch } = useQuery({
    queryKey: ['/api/organizations/complete'],
    queryFn: () => Promise.resolve(mockOrganizations),
    refetchInterval: 30000,
  });

  const { data: globalStats = mockGlobalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/organizations/stats'],
    queryFn: () => Promise.resolve(mockGlobalStats),
    refetchInterval: 30000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrgForm) => {
      // Simulação da API - substituir pela chamada real
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização criada com sucesso!" });
      setIsCreateDialogOpen(false);
      createForm.reset();
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao criar organização", variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditOrgForm) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização atualizada com sucesso!" });
      setIsEditDialogOpen(false);
      setSelectedOrg(null);
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar organização", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Organização removida com sucesso!" });
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao remover organização", variant: "destructive" });
    }
  });

  // Filtered and paginated data
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !filters.search || 
        org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = filters.type === 'all' || org.type === filters.type;
      const matchesPlan = filters.plan === 'all' || org.plan === filters.plan;
      const matchesStatus = filters.status === 'all' || org.status === filters.status;
      
      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const orgDate = new Date(org.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orgDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case '7d': matchesDate = daysDiff <= 7; break;
          case '30d': matchesDate = daysDiff <= 30; break;
          case '90d': matchesDate = daysDiff <= 90; break;
          case '1y': matchesDate = daysDiff <= 365; break;
        }
      }
      
      return matchesSearch && matchesType && matchesPlan && matchesStatus && matchesDate;
    });
  }, [organizations, filters]);

  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganizations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrganizations, currentPage]);

  const totalPages = Math.ceil(filteredOrganizations.length / ITEMS_PER_PAGE);

  // Wizard helper functions
  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const nextWizardStep = () => {
    if (currentWizardStep < 8) {
      setCurrentWizardStep(prev => prev + 1);
    }
  };

  const prevWizardStep = () => {
    if (currentWizardStep > 1) {
      setCurrentWizardStep(prev => prev - 1);
    }
  };

  const getWizardStepIcon = (step: number) => {
    const icons = [
      Building2, // Step 1: Informações Básicas
      Briefcase, // Step 2: Tipo de Negócio  
      Crown, // Step 3: Plano
      Brain, // Step 4: IA Configuration
      Cpu, // Step 5: Módulos
      Plug, // Step 6: Integrações
      UserPlus, // Step 7: Equipe
      FileCheck // Step 8: Confirmação
    ];
    return icons[step - 1] || Building2;
  };

  const isWizardStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(wizardData.name && wizardData.email);
      case 2:
        return !!(wizardData.businessType);
      case 3:
        return !!(wizardData.plan);
      case 4:
        return !!(wizardData.primaryAiProvider);
      case 5:
        return true; // Módulos sempre válidos
      case 6:
        return true; // Integrações sempre válidas
      case 7:
        return !!(wizardData.adminUser?.name && wizardData.adminUser?.email);
      case 8:
        return wizardData.acceptTerms === true;
      default:
        return false;
    }
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Organization['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400 border-green-400/50', icon: CheckCircle, label: 'Ativa' },
      trial: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50', icon: Clock, label: 'Trial' },
      suspended: { color: 'bg-red-500/20 text-red-400 border-red-400/50', icon: XCircle, label: 'Suspensa' },
      inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-400/50', icon: AlertCircle, label: 'Inativa' }
    };
    
    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} border px-2 py-1 flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: Organization['plan']) => {
    const planConfig = {
      starter: { color: 'from-blue-600 to-cyan-600', label: 'Starter' },
      pro: { color: 'from-purple-600 to-pink-600', label: 'Pro' },
      enterprise: { color: 'from-yellow-600 to-orange-600', label: 'Enterprise' }
    };
    
    const config = planConfig[plan];
    
    return (
      <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 px-2 py-1 font-bold`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: Organization['type']) => {
    const typeConfig = {
      marketing: { color: 'text-cyan-400', icon: Target, label: 'Marketing' },
      support: { color: 'text-green-400', icon: Shield, label: 'Support' },
      trading: { color: 'text-yellow-400', icon: BarChart3, label: 'Trading' }
    };
    
    const config = typeConfig[type];
    const IconComponent = config.icon;
    
    return (
      <div className={`flex items-center gap-1 ${config.color} text-sm font-semibold`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  // Selection handlers
  const handleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrgs.size === paginatedOrganizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(paginatedOrganizations.map(org => org.id)));
    }
  };

  // Action handlers
  const handleSingleAction = (org: Organization, action: string) => {
    setSelectedOrg(org);
    
    switch (action) {
      case 'view':
        setIsDetailsDialogOpen(true);
        break;
      case 'edit':
        editForm.reset({
          name: org.name,
          email: org.email,
          plan: org.plan,
          type: org.type,
          status: org.status,
        });
        setIsEditDialogOpen(true);
        break;
      case 'analytics':
        setIsAnalyticsDialogOpen(true);
        break;
      case 'billing':
        setIsBillingDialogOpen(true);
        break;
      case 'suspend':
        if (org.status === 'active') {
          if (confirm(`Tem certeza que deseja suspender a organização "${org.name}"?`)) {
            toast({
              title: "Organização Suspensa",
              description: `${org.name} foi suspensa com sucesso`,
              variant: "destructive",
            });
          }
        } else if (org.status === 'suspended') {
          if (confirm(`Tem certeza que deseja reativar a organização "${org.name}"?`)) {
            toast({
              title: "Organização Reativada",
              description: `${org.name} foi reativada com sucesso`,
            });
          }
        }
        break;
      case 'delete':
        if (confirm(`⚠️ ATENÇÃO: Esta ação excluirá permanentemente a organização "${org.name}".\n\nUm backup será criado automaticamente antes da exclusão.\n\nDeseja continuar?`)) {
          deleteMutation.mutate(org.id);
          toast({
            title: "Backup Criado",
            description: `Backup da organização ${org.name} salvo antes da exclusão`,
          });
        }
        break;
      default:
        toast({
          title: "Ação Executada",
          description: `${action} executada para ${org.name}`,
        });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.size === 0) {
      toast({
        title: "Seleção Necessária",
        description: "Selecione pelo menos uma organização",
        variant: "destructive",
      });
      return;
    }

    const selectedNames = Array.from(selectedOrgs).map(id => 
      organizations.find(org => org.id === id)?.name
    ).join(', ');

    toast({
      title: "Ação em Massa Executada",
      description: `${action} aplicada a ${selectedOrgs.size} organizações: ${selectedNames}`,
    });

    setSelectedOrgs(new Set());
  };

  const onCreateSubmit = (data: CreateOrgForm) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EditOrgForm) => {
    editMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black text-white matrix-grid">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl icon-container-futuristic">
              <Building2 className="w-8 h-8 icon-silver-neon" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text uppercase tracking-wider">
                Gestão de Organizações
              </h1>
              <p className="text-gray-400 mt-1">Painel administrativo completo da plataforma</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation('/admin-dashboard')}
              className="btn-glow bg-gradient-to-r from-blue-600 to-cyan-600"
              data-testid="nav-admin-dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard Admin
            </Button>
            
            <Button
              onClick={() => setLocation('/')}
              variant="ghost" 
              className="hover:bg-gray-700"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            
            <Button 
              onClick={() => refetch()} 
              className="neon-panel btn-glow"
              data-testid="refresh-organizations"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Organizations */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Organizações</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <Building2 className="h-6 w-6 icon-silver-neon" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="gradient-text">{formatNumber(globalStats.totalOrganizations)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-green-400 font-bold">{globalStats.growthRate}%</span>
                <span className="ml-2">crescimento mensal</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-green-400 font-bold">{globalStats.activeOrganizations} ativas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Total Usuários</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <Users className="h-6 w-6 icon-silver-neon" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-purple-400">{formatNumber(globalStats.totalUsers)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <Activity className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-purple-400 font-bold">Ativos</span>
                <span className="ml-2">na plataforma</span>
              </div>
            </CardContent>
          </Card>

          {/* Total AI Requests */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Requisições IA</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <Brain className="h-6 w-6 icon-silver-neon ai-pulse" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-yellow-400">{formatNumber(globalStats.totalAiRequests)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-yellow-400 font-bold">Total</span>
                <span className="ml-2">processadas</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-green-400 font-bold">{formatCurrency(globalStats.totalAiCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="glass-card card-hover neon-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-300 uppercase tracking-wider">Revenue Total</CardTitle>
              <div className="p-3 rounded-xl icon-container-futuristic">
                <DollarSign className="h-6 w-6 icon-silver-neon" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white mb-3">
                {statsLoading ? (
                  <div className="animate-pulse text-gray-400">...</div>
                ) : (
                  <span className="text-green-400">{formatCurrency(globalStats.totalRevenue)}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-3">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-green-400 font-bold">MRR</span>
                <span className="ml-2">recorrente</span>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="glass bg-gray-900/50 border-gray-700">
            <TabsTrigger value="manage" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Gerenciar Organizações
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Plus className="w-4 h-4 mr-2" />
              Criar Organização
            </TabsTrigger>
          </TabsList>

          {/* Manage Organizations Tab */}
          <TabsContent value="manage" className="space-y-6">
            
            {/* Filters Section */}
            <Card className="glass-card neon-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Filter className="w-5 h-5 text-cyan-400" />
                  <span className="gradient-text">Filtros e Busca</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome ou email da organização..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 glass bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-400"
                    data-testid="search-organizations"
                  />
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.plan} onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Planos</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger className="glass bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filtrar por Data" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Todas as Datas</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                      <SelectItem value="1y">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400">
                    Mostrando <span className="text-cyan-400 font-bold">{paginatedOrganizations.length}</span> de{' '}
                    <span className="text-cyan-400 font-bold">{filteredOrganizations.length}</span> organizações
                    {selectedOrgs.size > 0 && (
                      <span className="ml-4 text-yellow-400">
                        • <span className="font-bold">{selectedOrgs.size}</span> selecionadas
                      </span>
                    )}
                  </div>
                  
                  {selectedOrgs.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48 glass bg-gray-900/50 border-gray-700 text-white">
                          <SelectValue placeholder="Ações em Massa" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="change-plan">Alterar Plano</SelectItem>
                          <SelectItem value="suspend">Suspender</SelectItem>
                          <SelectItem value="reactivate">Reativar</SelectItem>
                          <SelectItem value="notify">Enviar Notificação</SelectItem>
                          <SelectItem value="export">Exportar Dados</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        onClick={() => bulkAction && handleBulkAction(bulkAction)}
                        disabled={!bulkAction}
                        className="btn-glow"
                        data-testid="execute-bulk-action"
                      >
                        Executar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organizations Table */}
            <Card className="glass-card neon-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span className="gradient-text">Lista de Organizações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-purple-500 mx-auto"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-cyan-400/20"></div>
                    </div>
                    <p className="text-gray-400 mt-4">Carregando organizações...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700">
                        <tr>
                          <th className="p-4 text-left">
                            <Checkbox
                              checked={selectedOrgs.size === paginatedOrganizations.length && paginatedOrganizations.length > 0}
                              onCheckedChange={handleSelectAll}
                              data-testid="select-all-organizations"
                            />
                          </th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Organização</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Tipo</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Plano</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Usuários</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">IA Usage</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Revenue</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Status</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Última Atividade</th>
                          <th className="p-4 text-left text-gray-400 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {paginatedOrganizations.map((org) => (
                          <tr key={org.id} className="hover:bg-gray-900/30 transition-colors duration-200">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedOrgs.has(org.id)}
                                onCheckedChange={() => handleSelectOrg(org.id)}
                                data-testid={`select-org-${org.id}`}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden icon-container-futuristic">
                                  {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-cyan-600 to-purple-600 flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{org.name}</p>
                                  <p className="text-sm text-gray-400">{org.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{getTypeBadge(org.type)}</td>
                            <td className="p-4">{getPlanBadge(org.plan)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-cyan-400" />
                                <span className="text-white font-semibold">{org.userCount}</span>
                                <span className="text-gray-400 text-sm">/ {org.settings.maxUsers}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Brain className="w-4 h-4 text-yellow-400" />
                                  <span className="text-yellow-400 font-semibold">{formatNumber(org.aiUsage.requests)}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  ${org.aiUsage.cost.toFixed(2)}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-semibold">{formatCurrency(org.revenue)}</span>
                              </div>
                            </td>
                            <td className="p-4">{getStatusBadge(org.status)}</td>
                            <td className="p-4">
                              <div className="text-sm text-gray-400">
                                {formatDate(org.lastActivity)}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'view')}
                                  className="p-2 hover:bg-cyan-500/20 group"
                                  data-testid={`view-org-${org.id}`}
                                  title="Visualizar Detalhes"
                                >
                                  <Eye className="w-4 h-4 text-cyan-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'edit')}
                                  className="p-2 hover:bg-purple-500/20 group"
                                  data-testid={`edit-org-${org.id}`}
                                  title="Editar Configurações"
                                >
                                  <Settings className="w-4 h-4 text-purple-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'analytics')}
                                  className="p-2 hover:bg-yellow-500/20 group"
                                  data-testid={`analytics-org-${org.id}`}
                                  title="Ver Analytics"
                                >
                                  <BarChart3 className="w-4 h-4 text-yellow-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'billing')}
                                  className="p-2 hover:bg-green-500/20 group"
                                  data-testid={`billing-org-${org.id}`}
                                  title="Gerenciar Billing"
                                >
                                  <CreditCard className="w-4 h-4 text-green-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'suspend')}
                                  className={`p-2 group ${
                                    org.status === 'suspended' 
                                      ? 'hover:bg-green-500/20' 
                                      : 'hover:bg-orange-500/20'
                                  }`}
                                  data-testid={`suspend-org-${org.id}`}
                                  title={org.status === 'suspended' ? 'Reativar' : 'Suspender'}
                                >
                                  {org.status === 'suspended' ? (
                                    <Play className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Pause className="w-4 h-4 text-orange-400" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSingleAction(org, 'delete')}
                                  className="p-2 hover:bg-red-500/20 group"
                                  data-testid={`delete-org-${org.id}`}
                                  title="Excluir (com backup)"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="glass-card neon-panel">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Página {currentPage} de {totalPages}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="hover:bg-cyan-500/20"
                        data-testid="prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        if (page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`${
                              page === currentPage 
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                                : 'hover:bg-gray-700'
                            } min-w-[40px]`}
                            data-testid={`page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="hover:bg-cyan-500/20"
                        data-testid="next-page"
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Create Organization Tab - Wizard */}
          <TabsContent value="create" className="space-y-6">
            
            {/* Wizard Progress */}
            <Card className="glass-card neon-panel max-w-4xl mx-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold gradient-text">Wizard de Criação</h2>
                    <p className="text-gray-400 text-sm">Step {currentWizardStep} de 8</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">{Math.round((currentWizardStep / 8) * 100)}%</div>
                  </div>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                  {Array.from({ length: 8 }, (_, i) => {
                    const stepNumber = i + 1;
                    const StepIcon = getWizardStepIcon(stepNumber);
                    const isActive = stepNumber === currentWizardStep;
                    const isCompleted = stepNumber < currentWizardStep;
                    
                    return (
                      <div key={stepNumber} className="flex flex-col items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-cyan-600 to-purple-600 ring-2 ring-cyan-500/50' 
                              : isCompleted
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                              : 'bg-gray-700 border border-gray-600'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <StepIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                          )}
                        </div>
                        
                        <div className="mt-1 text-center">
                          <div className={`text-xs font-semibold ${isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                            {stepNumber}
                          </div>
                        </div>
                        
                        {stepNumber < 8 && (
                          <div className={`h-0.5 w-12 mt-2 ${isCompleted ? 'bg-gradient-to-r from-green-400 to-cyan-400' : 'bg-gray-700'}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Main Wizard Card */}
            <Card className="glass-card neon-panel max-w-4xl mx-auto min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {currentWizardStep === 1 && <><Building2 className="w-6 h-6 text-cyan-400" /><span className="gradient-text">Informações Básicas</span></>}
                  {currentWizardStep === 2 && <><Briefcase className="w-6 h-6 text-purple-400" /><span className="gradient-text">Tipo de Negócio</span></>}
                  {currentWizardStep === 3 && <><Crown className="w-6 h-6 text-yellow-400" /><span className="gradient-text">Seleção de Plano</span></>}
                  {currentWizardStep === 4 && <><Brain className="w-6 h-6 text-green-400" /><span className="gradient-text">Configuração de IA</span></>}
                  {currentWizardStep === 5 && <><Cpu className="w-6 h-6 text-blue-400" /><span className="gradient-text">Seleção de Módulos</span></>}
                  {currentWizardStep === 6 && <><Plug className="w-6 h-6 text-orange-400" /><span className="gradient-text">Configuração de Integrações</span></>}
                  {currentWizardStep === 7 && <><UserPlus className="w-6 h-6 text-pink-400" /><span className="gradient-text">Convite de Equipe</span></>}
                  {currentWizardStep === 8 && <><FileCheck className="w-6 h-6 text-emerald-400" /><span className="gradient-text">Revisão e Confirmação</span></>}
                </CardTitle>
                <p className="text-gray-400 mt-2">
                  {currentWizardStep === 1 && "Nome, email, telefone, website e descrição da organização"}
                  {currentWizardStep === 2 && "Escolha entre Agência de Marketing, Centro de Suporte ou Mesa de Trading"}
                  {currentWizardStep === 3 && "Starter ($29), Professional ($99) ou Enterprise ($299)"}
                  {currentWizardStep === 4 && "Provedor principal e backup, modelos e limites de IA"}
                  {currentWizardStep === 5 && "Módulos inclusos no plano e opcionais"}
                  {currentWizardStep === 6 && "Integrações recomendadas e configuração"}
                  {currentWizardStep === 7 && "Admin principal, membros da equipe e roles"}
                  {currentWizardStep === 8 && "Resumo completo, termos de serviço e billing"}
                </p>
              </CardHeader>
              <CardContent>
                {/* Step 1: Informações Básicas */}
                {currentWizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Nome da Organização *</Label>
                        <Input
                          value={wizardData.name || ''}
                          onChange={(e) => updateWizardData({ name: e.target.value })}
                          placeholder="Ex: TechCorp Solutions"
                          className="glass bg-gray-900/50 border-gray-700 text-white"
                          data-testid="wizard-step1-name"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Email Principal *</Label>
                        <Input
                          type="email"
                          value={wizardData.email || ''}
                          onChange={(e) => updateWizardData({ email: e.target.value })}
                          placeholder="contato@empresa.com"
                          className="glass bg-gray-900/50 border-gray-700 text-white"
                          data-testid="wizard-step1-email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Telefone</Label>
                        <Input
                          value={wizardData.phone || ''}
                          onChange={(e) => updateWizardData({ phone: e.target.value })}
                          placeholder="+55 (11) 99999-9999"
                          className="glass bg-gray-900/50 border-gray-700 text-white"
                          data-testid="wizard-step1-phone"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Website</Label>
                        <Input
                          value={wizardData.website || ''}
                          onChange={(e) => updateWizardData({ website: e.target.value })}
                          placeholder="https://www.empresa.com"
                          className="glass bg-gray-900/50 border-gray-700 text-white"
                          data-testid="wizard-step1-website"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Descrição</Label>
                      <Textarea
                        value={wizardData.description || ''}
                        onChange={(e) => updateWizardData({ description: e.target.value })}
                        placeholder="Descreva brevemente o que sua organização faz..."
                        className="glass bg-gray-900/50 border-gray-700 text-white resize-none"
                        rows={4}
                        data-testid="wizard-step1-description"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Logo da Empresa (Opcional)</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 mb-2">Clique para fazer upload ou arraste sua logo aqui</p>
                        <p className="text-sm text-gray-500">PNG, JPG até 5MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Tipo de Negócio */}
                {currentWizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {Object.entries(BUSINESS_TYPES).map(([key, type]) => {
                        const IconComponent = type.icon;
                        const isSelected = wizardData.businessType === key;
                        
                        return (
                          <Card 
                            key={key}
                            className={`glass-card neon-panel cursor-pointer transition-all duration-300 ${
                              isSelected 
                                ? 'ring-2 ring-cyan-400 bg-gradient-to-b from-cyan-500/10 to-purple-500/10' 
                                : 'hover:ring-1 hover:ring-gray-500'
                            }`}
                            onClick={() => updateWizardData({ businessType: key as any })}
                            data-testid={`wizard-step2-${key}`}
                          >
                            <CardContent className="p-6 text-center">
                              <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-4`}>
                                <IconComponent className="w-8 h-8 text-white" />
                              </div>
                              
                              <h4 className="text-xl font-bold text-white mb-2">{type.name}</h4>
                              <p className="text-gray-400 text-sm mb-4">{type.description}</p>
                              
                              <div className="space-y-2">
                                <div className="text-sm font-semibold text-gray-300">Módulos Inclusos:</div>
                                {type.modules.map((module, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                                    <span>{module.name}</span>
                                  </div>
                                ))}
                              </div>
                              
                              {isSelected && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="text-sm font-semibold">Selecionado</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Seleção de Plano */}
                {currentWizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {Object.entries(PLANS).map(([key, plan]) => {
                        const IconComponent = plan.icon;
                        const isSelected = wizardData.plan === key;
                        const isPopular = key === 'professional';
                        const isFree = key === 'free';
                        
                        return (
                          <Card 
                            key={key}
                            className={`glass-card neon-panel cursor-pointer transition-all duration-300 relative min-h-[420px] ${
                              isSelected 
                                ? 'ring-2 ring-cyan-400 bg-gradient-to-b from-cyan-500/10 to-purple-500/10 scale-105' 
                                : 'hover:ring-1 hover:ring-gray-500 hover:scale-102'
                            }`}
                            onClick={() => updateWizardData({ plan: key as any })}
                            data-testid={`wizard-step3-${key}`}
                          >
                            {isPopular && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">
                                  🔥 Mais Popular
                                </div>
                              </div>
                            )}
                            
                            {isFree && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">
                                  ✨ Gratuito
                                </div>
                              </div>
                            )}
                            
                            <CardContent className="p-4 text-center h-full flex flex-col justify-between">
                              <div>
                                <div className={`w-12 h-12 mx-auto rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center mb-3`}>
                                  <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                
                                <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
                                <div className="text-2xl font-bold gradient-text mb-3">
                                  {plan.price === 0 ? (
                                    <span className="text-green-400">Gratuito</span>
                                  ) : (
                                    <>
                                      ${plan.price}<span className="text-sm text-gray-400">/mês</span>
                                    </>
                                  )}
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Usuários</span>
                                    <span className="text-white font-semibold">
                                      {plan.users === -1 ? 'Ilimitado' : plan.users}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">IA/mês</span>
                                    <span className="text-white font-semibold">{formatNumber(plan.aiRequests)}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 mb-4">
                                  {plan.features.slice(0, 3).map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                      <span className="text-left">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="flex items-center justify-center gap-2 text-cyan-400 mt-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Selecionado</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Configuração de IA */}
                {currentWizardStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Provedor Principal */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Provedor Principal de IA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            {[
                              { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT-5, melhor para texto e análise' },
                              { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude Sonnet 4, excelente para raciocínio' }
                            ].map((provider) => (
                              <div
                                key={provider.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  wizardData.primaryAiProvider === provider.id
                                    ? 'border-cyan-400 bg-cyan-500/10'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                                onClick={() => updateWizardData({ primaryAiProvider: provider.id as any })}
                                data-testid={`wizard-step4-primary-${provider.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{provider.icon}</span>
                                  <div>
                                    <h4 className="text-white font-semibold">{provider.name}</h4>
                                    <p className="text-sm text-gray-400">{provider.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Provedor Backup */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Provedor Backup</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            {[
                              { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude como backup confiável' },
                              { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT como fallback robusto' }
                            ].filter(p => p.id !== wizardData.primaryAiProvider).map((provider) => (
                              <div
                                key={provider.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  wizardData.backupAiProvider === provider.id
                                    ? 'border-cyan-400 bg-cyan-500/10'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                                onClick={() => updateWizardData({ backupAiProvider: provider.id as any })}
                                data-testid={`wizard-step4-backup-${provider.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{provider.icon}</span>
                                  <div>
                                    <h4 className="text-white font-semibold">{provider.name}</h4>
                                    <p className="text-sm text-gray-400">{provider.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Configurações de Limite */}
                    <Card className="glass-card neon-panel">
                      <CardHeader>
                        <CardTitle className="text-lg gradient-text">Limites e Configurações</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Limite Diário (requisições)</label>
                          <input
                            type="number"
                            className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                            value={wizardData.aiLimits?.daily || Math.floor((wizardData.plan ? PLANS[wizardData.plan].aiRequests : 1000) / 30)}
                            onChange={(e) => updateWizardData({ 
                              aiLimits: { ...wizardData.aiLimits, daily: parseInt(e.target.value) || 0 }
                            })}
                            data-testid="wizard-step4-daily-limit"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Timeout (segundos)</label>
                          <input
                            type="number"
                            className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                            value={wizardData.aiLimits?.timeout || 30}
                            onChange={(e) => updateWizardData({ 
                              aiLimits: { ...wizardData.aiLimits, timeout: parseInt(e.target.value) || 30 }
                            })}
                            data-testid="wizard-step4-timeout"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Max Tokens</label>
                          <input
                            type="number"
                            className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                            value={wizardData.aiLimits?.maxTokens || 4000}
                            onChange={(e) => updateWizardData({ 
                              aiLimits: { ...wizardData.aiLimits, maxTokens: parseInt(e.target.value) || 4000 }
                            })}
                            data-testid="wizard-step4-max-tokens"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 5: Seleção de Módulos */}
                {currentWizardStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Módulos Inclusos */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Módulos Inclusos no Plano</CardTitle>
                          <p className="text-sm text-gray-400">Estes módulos estão inclusos no seu plano {wizardData.plan ? PLANS[wizardData.plan].name : ''}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {wizardData.businessType && BUSINESS_TYPES[wizardData.businessType].modules.map((module) => (
                            <div key={module.id} className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                  <h4 className="text-white font-semibold">{module.name}</h4>
                                  <p className="text-sm text-gray-400">{module.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Módulos Opcionais */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Módulos Opcionais</CardTitle>
                          <p className="text-sm text-gray-400">Adicione funcionalidades extras (podem ter custo adicional)</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { id: 'advanced-analytics', name: 'Analytics Avançado', description: 'Relatórios detalhados e previsões', price: 19 },
                            { id: 'multi-language', name: 'Suporte Multi-idioma', description: 'Tradução automática e localizações', price: 15 },
                            { id: 'api-access', name: 'Acesso API Premium', description: 'APIs avançadas e webhooks', price: 25 },
                            { id: 'white-label', name: 'White Label', description: 'Marca personalizada completa', price: 49 }
                          ].map((module) => {
                            const isSelected = wizardData.optionalModules?.includes(module.id);
                            return (
                              <div
                                key={module.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-cyan-400 bg-cyan-500/10' 
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                                onClick={() => {
                                  const current = wizardData.optionalModules || [];
                                  const updated = isSelected 
                                    ? current.filter(id => id !== module.id)
                                    : [...current, module.id];
                                  updateWizardData({ optionalModules: updated });
                                }}
                                data-testid={`wizard-step5-optional-${module.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-gray-500'
                                    }`}>
                                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                      <h4 className="text-white font-semibold">{module.name}</h4>
                                      <p className="text-sm text-gray-400">{module.description}</p>
                                    </div>
                                  </div>
                                  <span className="text-cyan-400 font-semibold">+${module.price}/mês</span>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Step 6: Integrações */}
                {currentWizardStep === 6 && (
                  <div className="space-y-6">
                    {/* Header com informações */}
                    <div className="text-center mb-6">
                      <p className="text-gray-400 text-sm">
                        Selecione as integrações que deseja conectar à sua organização. 
                        Você pode configurá-las posteriormente.
                      </p>
                      {wizardData.integrations && wizardData.integrations.length > 0 && (
                        <div className="mt-2 text-cyan-400 text-sm">
                          ✅ {wizardData.integrations.length} integração(ões) selecionada(s)
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Automação com 5000+ apps', category: 'Automação', popularity: 'high' },
                        { id: 'slack', name: 'Slack', icon: '💬', description: 'Notificações e comandos', category: 'Comunicação', popularity: 'high' },
                        { id: 'discord', name: 'Discord', icon: '🎮', description: 'Bot e integrações', category: 'Comunicação', popularity: 'medium' },
                        { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Pagamentos e billing', category: 'Pagamentos', popularity: 'high' },
                        { id: 'paypal', name: 'PayPal', icon: '🏦', description: 'Pagamentos globais', category: 'Pagamentos', popularity: 'medium' },
                        { id: 'google-analytics', name: 'Google Analytics', icon: '📊', description: 'Análise de tráfego', category: 'Analytics', popularity: 'high' },
                        { id: 'hubspot', name: 'HubSpot', icon: '🎯', description: 'CRM e marketing', category: 'CRM', popularity: 'medium' },
                        { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'CRM empresarial', category: 'CRM', popularity: 'high' },
                        { id: 'mailchimp', name: 'Mailchimp', icon: '📧', description: 'Email marketing', category: 'Marketing', popularity: 'medium' },
                        { id: 'whatsapp', name: 'WhatsApp Business', icon: '💚', description: 'Mensagens WhatsApp', category: 'Comunicação', popularity: 'high' },
                        { id: 'gmail', name: 'Gmail', icon: '📨', description: 'Integração com Gmail', category: 'Email', popularity: 'high' },
                        { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Bot Telegram', category: 'Comunicação', popularity: 'medium' }
                      ].map((integration) => {
                        const isSelected = wizardData.integrations?.includes(integration.id);
                        return (
                          <Card
                            key={integration.id}
                            className={`glass-card cursor-pointer transition-all min-h-[120px] ${
                              isSelected 
                                ? 'ring-2 ring-cyan-400 bg-cyan-500/10' 
                                : 'hover:ring-1 hover:ring-gray-500'
                            }`}
                            onClick={() => {
                              const current = wizardData.integrations || [];
                              const updated = isSelected 
                                ? current.filter(id => id !== integration.id)
                                : [...current, integration.id];
                              updateWizardData({ integrations: updated });
                            }}
                            data-testid={`wizard-step6-${integration.id}`}
                          >
                            <CardContent className="p-4 text-center h-full flex flex-col justify-between">
                              <div>
                                <div className="relative">
                                  <div className="text-3xl mb-2">{integration.icon}</div>
                                  {integration.popularity === 'high' && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
                                  )}
                                </div>
                                <h4 className="text-white font-semibold mb-1">{integration.name}</h4>
                                <p className="text-xs text-gray-400 mb-2">{integration.description}</p>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                                    {integration.category}
                                  </span>
                                  {integration.popularity === 'high' && (
                                    <span className="inline-block px-2 py-1 text-xs bg-orange-600 text-white rounded">
                                      Popular
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center justify-center gap-2 text-cyan-400 mt-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Selecionado</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 7: Configuração da Equipe */}
                {currentWizardStep === 7 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Admin Principal */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Administrador Principal</CardTitle>
                          <p className="text-sm text-gray-400">Usuário com acesso total à organização</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-400">Nome Completo</label>
                            <input
                              type="text"
                              className="w-full mt-1 p-3 bg-gray-800 border border-gray-600 rounded text-white"
                              value={wizardData.adminUser?.name || ''}
                              onChange={(e) => updateWizardData({ 
                                adminUser: { 
                                  name: e.target.value, 
                                  email: wizardData.adminUser?.email || '', 
                                  role: 'admin' 
                                }
                              })}
                              placeholder="Ex: João Silva"
                              data-testid="wizard-step7-admin-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Email</label>
                            <input
                              type="email"
                              className="w-full mt-1 p-3 bg-gray-800 border border-gray-600 rounded text-white"
                              value={wizardData.adminUser?.email || ''}
                              onChange={(e) => updateWizardData({ 
                                adminUser: { 
                                  name: wizardData.adminUser?.name || '', 
                                  email: e.target.value, 
                                  role: 'admin' 
                                }
                              })}
                              placeholder="admin@empresa.com"
                              data-testid="wizard-step7-admin-email"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Membros da Equipe */}
                      <Card className="glass-card neon-panel">
                        <CardHeader>
                          <CardTitle className="text-lg gradient-text">Membros da Equipe</CardTitle>
                          <p className="text-sm text-gray-400">
                            {wizardData.plan && PLANS[wizardData.plan].users === -1 
                              ? 'Adicione quantos membros precisar (usuários ilimitados)'
                              : `Adicione até ${(wizardData.plan ? PLANS[wizardData.plan].users : 2) - 1} usuários`
                            }
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Lista de membros existentes */}
                          {(wizardData.teamMembers || []).map((member, index) => (
                            <div key={index} className="relative space-y-2 p-3 bg-gray-800/50 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">Membro {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(wizardData.teamMembers || [])];
                                    updated.splice(index, 1);
                                    updateWizardData({ teamMembers: updated });
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                  data-testid={`wizard-step7-remove-member-${index}`}
                                >
                                  ✕ Remover
                                </button>
                              </div>
                              <input
                                type="text"
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                value={member.name || ''}
                                onChange={(e) => {
                                  const updated = [...(wizardData.teamMembers || [])];
                                  updated[index] = { 
                                    name: e.target.value, 
                                    email: member.email || '', 
                                    role: 'user' 
                                  };
                                  updateWizardData({ teamMembers: updated });
                                }}
                                placeholder="Nome completo"
                                data-testid={`wizard-step7-member-${index}-name`}
                              />
                              <input
                                type="email"
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                value={member.email || ''}
                                onChange={(e) => {
                                  const updated = [...(wizardData.teamMembers || [])];
                                  updated[index] = { 
                                    name: member.name || '', 
                                    email: e.target.value, 
                                    role: 'user' 
                                  };
                                  updateWizardData({ teamMembers: updated });
                                }}
                                placeholder="email@empresa.com"
                                data-testid={`wizard-step7-member-${index}-email`}
                              />
                            </div>
                          ))}

                          {/* Botão para adicionar novo membro */}
                          {(() => {
                            const currentMemberCount = (wizardData.teamMembers || []).length;
                            const maxUsers = wizardData.plan ? PLANS[wizardData.plan].users : 2;
                            const canAddMore = maxUsers === -1 || currentMemberCount < (maxUsers - 1);
                            
                            return canAddMore ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(wizardData.teamMembers || [])];
                                  updated.push({ name: '', email: '', role: 'user' });
                                  updateWizardData({ teamMembers: updated });
                                }}
                                className="w-full p-4 border-2 border-dashed border-cyan-600 rounded-lg text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/5 transition-all"
                                data-testid="wizard-step7-add-member"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl">+</span>
                                  <span>Adicionar Membro da Equipe</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {maxUsers === -1 
                                    ? 'Sem limite de usuários no plano Enterprise'
                                    : `${(maxUsers - 1) - currentMemberCount} vagas restantes`
                                  }
                                </p>
                              </button>
                            ) : (
                              <div className="text-center p-4 border-2 border-dashed border-gray-600 rounded">
                                <p className="text-gray-400 text-sm">
                                  🚫 Limite de usuários atingido para o plano {wizardData.plan ? PLANS[wizardData.plan].name : ''}<br/>
                                  Faça upgrade para adicionar mais membros.
                                </p>
                              </div>
                            );
                          })()}

                          {/* Informação sobre plano Enterprise */}
                          {wizardData.plan && PLANS[wizardData.plan].users === -1 && (
                            <div className="text-center p-3 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-600/30 rounded">
                              <p className="text-yellow-400 text-sm">
                                ✨ <strong>Plano Enterprise</strong><br/>
                                Adicione quantos membros precisar - sem limitações!
                              </p>
                            </div>
                          )}

                          {/* Contador de membros */}
                          {(wizardData.teamMembers || []).length > 0 && (
                            <div className="text-center text-xs text-gray-400">
                              Total: {(wizardData.teamMembers || []).length} membro(s) + 1 administrador
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Step 8: Confirmação Final */}
                {currentWizardStep === 8 && (
                  <div className="space-y-6">
                    <div className="max-w-4xl mx-auto">
                      {/* Informações Básicas */}
                      <Card className="glass-card neon-panel mb-6">
                        <CardHeader>
                          <CardTitle className="text-xl gradient-text">📋 Resumo Completo da Configuração</CardTitle>
                          <p className="text-sm text-gray-400">Revise todas as configurações antes de criar a organização</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Seção 1: Dados Básicos */}
                          <div>
                            <h3 className="text-lg text-cyan-400 mb-3 border-b border-cyan-600/30 pb-1">1. Informações Básicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Nome da Organização:</span>
                                <span className="text-white font-semibold">{wizardData.name || 'Não definido'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Email Principal:</span>
                                <span className="text-white font-semibold">{wizardData.email || 'Não definido'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Tipo de Negócio:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.businessType ? BUSINESS_TYPES[wizardData.businessType].name : 'Não definido'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Descrição:</span>
                                <span className="text-white font-semibold">{wizardData.description || 'Nenhuma'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Seção 2: Plano e Módulos */}
                          <div>
                            <h3 className="text-lg text-cyan-400 mb-3 border-b border-cyan-600/30 pb-1">2. Plano e Módulos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Plano Selecionado:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.plan ? `${PLANS[wizardData.plan].name} ($${PLANS[wizardData.plan].price}/mês)` : 'Não definido'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Usuários Permitidos:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.plan ? (PLANS[wizardData.plan].users === -1 ? 'Ilimitado' : PLANS[wizardData.plan].users) : '0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Requisições IA/mês:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.plan ? formatNumber(PLANS[wizardData.plan].aiRequests) : '0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Módulos Opcionais:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.optionalModules?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Seção 3: Configuração de IA */}
                          <div>
                            <h3 className="text-lg text-cyan-400 mb-3 border-b border-cyan-600/30 pb-1">3. Configuração de IA</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Provedor Principal:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.primaryAiProvider ? (wizardData.primaryAiProvider === 'openai' ? 'OpenAI (GPT-5)' : 'Anthropic (Claude Sonnet 4)') : 'Não definido'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Provedor Backup:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.backupAiProvider ? (wizardData.backupAiProvider === 'openai' ? 'OpenAI (GPT-5)' : 'Anthropic (Claude Sonnet 4)') : 'Não definido'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Limite Diário:</span>
                                <span className="text-white font-semibold">
                                  {wizardData.aiLimits?.daily || Math.floor((wizardData.plan ? PLANS[wizardData.plan].aiRequests : 1000) / 30)} requisições
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Max Tokens:</span>
                                <span className="text-white font-semibold">{wizardData.aiLimits?.maxTokens || 4000}</span>
                              </div>
                            </div>
                          </div>

                          {/* Seção 4: Integrações */}
                          <div>
                            <h3 className="text-lg text-cyan-400 mb-3 border-b border-cyan-600/30 pb-1">4. Integrações Selecionadas</h3>
                            <div className="text-sm">
                              {wizardData.integrations && wizardData.integrations.length > 0 ? (
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Total de Integrações:</span>
                                    <span className="text-white font-semibold">{wizardData.integrations.length}</span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {wizardData.integrations.map((integrationId) => {
                                      const integration = [
                                        { id: 'zapier', name: 'Zapier' }, { id: 'slack', name: 'Slack' }, 
                                        { id: 'discord', name: 'Discord' }, { id: 'stripe', name: 'Stripe' }, 
                                        { id: 'paypal', name: 'PayPal' }, { id: 'google-analytics', name: 'Google Analytics' },
                                        { id: 'hubspot', name: 'HubSpot' }, { id: 'salesforce', name: 'Salesforce' }, 
                                        { id: 'mailchimp', name: 'Mailchimp' }, { id: 'whatsapp', name: 'WhatsApp Business' },
                                        { id: 'gmail', name: 'Gmail' }, { id: 'telegram', name: 'Telegram' }
                                      ].find(i => i.id === integrationId);
                                      return (
                                        <span key={integrationId} className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded text-xs">
                                          {integration?.name || integrationId}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400">Nenhuma integração selecionada</div>
                              )}
                            </div>
                          </div>

                          {/* Seção 5: Equipe */}
                          <div>
                            <h3 className="text-lg text-cyan-400 mb-3 border-b border-cyan-600/30 pb-1">5. Configuração da Equipe</h3>
                            <div className="space-y-3 text-sm">
                              {/* Admin Principal */}
                              <div>
                                <h4 className="text-gray-400 mb-2">Administrador Principal:</h4>
                                <div className="pl-4 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Nome:</span>
                                    <span className="text-white font-semibold">{wizardData.adminUser?.name || 'Não definido'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="text-white font-semibold">{wizardData.adminUser?.email || 'Não definido'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Membros da Equipe */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-gray-400">Membros da Equipe:</h4>
                                  <span className="text-white font-semibold">
                                    {(wizardData.teamMembers || []).length}
                                  </span>
                                </div>
                                {(wizardData.teamMembers || []).length > 0 ? (
                                  <div className="pl-4 space-y-2">
                                    {wizardData.teamMembers.map((member, index) => (
                                      <div key={index} className="flex justify-between text-xs bg-gray-800/30 p-2 rounded">
                                        <span className="text-gray-300">{member.name || `Membro ${index + 1}`}</span>
                                        <span className="text-gray-400">{member.email || 'Email não definido'}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="pl-4 text-gray-400 text-xs">Nenhum membro adicionado</div>
                                )}
                              </div>

                              {/* Total de Usuários */}
                              <div className="pt-2 border-t border-gray-700">
                                <div className="flex justify-between font-semibold">
                                  <span className="text-gray-400">Total de Usuários:</span>
                                  <span className="text-cyan-400">
                                    {1 + (wizardData.teamMembers || []).length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Aceite de Termos */}
                      <Card className="glass-card neon-panel mb-6">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={wizardData.acceptTerms}
                              onCheckedChange={(checked) => updateWizardData({ acceptTerms: !!checked })}
                              data-testid="wizard-step8-terms"
                              className="mt-1"
                            />
                            <div>
                              <p className="text-white">
                                Eu aceito os{' '}
                                <span className="text-cyan-400 cursor-pointer hover:underline">Termos de Serviço</span>
                                {' '}e a{' '}
                                <span className="text-cyan-400 cursor-pointer hover:underline">Política de Privacidade</span>
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                Ao aceitar, você concorda com todas as condições da plataforma e autoriza a criação da organização com as configurações acima.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resumo de Custos */}
                      {wizardData.plan && (
                        <Card className="glass-card neon-panel">
                          <CardHeader>
                            <CardTitle className="text-lg gradient-text">💰 Resumo de Custos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Plano {PLANS[wizardData.plan].name}:</span>
                                <span className="text-white font-semibold">
                                  {PLANS[wizardData.plan].price === 0 ? 'Gratuito' : `$${PLANS[wizardData.plan].price}/mês`}
                                </span>
                              </div>
                              {wizardData.optionalModules && wizardData.optionalModules.length > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Módulos Opcionais:</span>
                                  <span className="text-white font-semibold">
                                    +$
                                    {[
                                      { id: 'advanced-analytics', price: 19 },
                                      { id: 'multi-language', price: 15 },
                                      { id: 'api-access', price: 25 },
                                      { id: 'white-label', price: 49 }
                                    ]
                                      .filter(module => wizardData.optionalModules.includes(module.id))
                                      .reduce((total, module) => total + module.price, 0)}/mês
                                  </span>
                                </div>
                              )}
                              <div className="border-t border-gray-600 pt-2">
                                <div className="flex justify-between text-lg font-bold">
                                  <span className="text-cyan-400">Total Mensal:</span>
                                  <span className="text-cyan-400">
                                    {(() => {
                                      const baseCost = PLANS[wizardData.plan].price;
                                      const optionalCost = wizardData.optionalModules
                                        ? [
                                            { id: 'advanced-analytics', price: 19 },
                                            { id: 'multi-language', price: 15 },
                                            { id: 'api-access', price: 25 },
                                            { id: 'white-label', price: 49 }
                                          ]
                                            .filter(module => wizardData.optionalModules.includes(module.id))
                                            .reduce((total, module) => total + module.price, 0)
                                        : 0;
                                      const total = baseCost + optionalCost;
                                      return total === 0 ? 'Gratuito' : `$${total}/mês`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-700/30">
                  <Button
                    onClick={prevWizardStep}
                    disabled={currentWizardStep === 1}
                    className="flex items-center gap-2 hover:bg-gray-700"
                    variant="ghost"
                    data-testid="wizard-prev-step"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-3">
                    {currentWizardStep < 8 ? (
                      <Button
                        onClick={nextWizardStep}
                        disabled={!isWizardStepValid(currentWizardStep)}
                        className="btn-glow bg-gradient-to-r from-cyan-600 to-purple-600"
                        data-testid="wizard-next-step"
                      >
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (isWizardStepValid(8)) {
                            // Convert wizardData to form format
                            const formData = {
                              name: wizardData.name || '',
                              email: wizardData.email || '',
                              type: wizardData.businessType || 'marketing',
                              plan: wizardData.plan === 'professional' ? 'pro' : wizardData.plan || 'starter',
                              description: wizardData.description || ''
                            };
                            createMutation.mutate(formData as any);
                          }
                        }}
                        disabled={!isWizardStepValid(8) || createMutation.isPending}
                        className="btn-glow bg-gradient-to-r from-green-600 to-emerald-600"
                        data-testid="wizard-create-organization"
                      >
                        {createMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Criar Organização
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="glass bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Eye className="w-6 h-6 text-cyan-400" />
                <span className="gradient-text">Detalhes da Organização</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrg && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-4 p-6 rounded-lg glass-card neon-panel">
                  <div className="w-16 h-16 rounded-xl overflow-hidden icon-container-futuristic">
                    {selectedOrg.logoUrl ? (
                      <img src={selectedOrg.logoUrl} alt={selectedOrg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-cyan-600 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedOrg.name}</h3>
                    <p className="text-gray-400 mb-3">{selectedOrg.email}</p>
                    <div className="flex items-center gap-4">
                      {getTypeBadge(selectedOrg.type)}
                      {getPlanBadge(selectedOrg.plan)}
                      {getStatusBadge(selectedOrg.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">ID da Organização</p>
                    <p className="font-mono text-cyan-400">{selectedOrg.id}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card neon-panel">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-cyan-400" />
                        <div>
                          <p className="text-2xl font-bold text-white">{selectedOrg.userCount}</p>
                          <p className="text-sm text-gray-400">Usuários Ativos</p>
                          <p className="text-xs text-gray-500">de {selectedOrg.settings.maxUsers} máximo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card neon-panel">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-yellow-400" />
                        <div>
                          <p className="text-2xl font-bold text-white">{formatNumber(selectedOrg.aiUsage.requests)}</p>
                          <p className="text-sm text-gray-400">Requisições IA</p>
                          <p className="text-xs text-gray-500">{formatNumber(selectedOrg.aiUsage.tokens)} tokens</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card neon-panel">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="text-2xl font-bold text-white">{formatCurrency(selectedOrg.revenue)}</p>
                          <p className="text-sm text-gray-400">Revenue Mensal</p>
                          <p className="text-xs text-gray-500">Custo IA: ${selectedOrg.aiUsage.cost.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card neon-panel">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-purple-400" />
                        <div>
                          <p className="text-lg font-bold text-white">Ativa</p>
                          <p className="text-sm text-gray-400">Última Atividade</p>
                          <p className="text-xs text-gray-500">{formatDate(selectedOrg.lastActivity)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Configuration Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card neon-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings className="w-5 h-5 text-cyan-400" />
                        <span className="gradient-text">Configurações</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Máximo de Usuários</span>
                        <span className="text-white font-semibold">{selectedOrg.settings.maxUsers}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Limite de Requisições IA</span>
                        <span className="text-white font-semibold">{formatNumber(selectedOrg.settings.maxAiRequests)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Data de Criação</span>
                        <span className="text-white font-semibold">{formatDate(selectedOrg.createdAt)}</span>
                      </div>
                      <div className="py-2">
                        <span className="text-gray-400 block mb-2">Recursos Habilitados</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrg.settings.features.map((feature, index) => (
                            <Badge key={index} className="bg-purple-500/20 text-purple-400 border-purple-400/50">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card neon-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="w-5 h-5 text-yellow-400" />
                        <span className="gradient-text">Métricas de Uso</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Uso de Usuários</span>
                          <span className="text-white font-semibold">
                            {Math.round((selectedOrg.userCount / selectedOrg.settings.maxUsers) * 100)}%
                          </span>
                        </div>
                        <div className="progress-bar-futuristic">
                          <div 
                            className="progress-fill-cpu" 
                            style={{ width: `${Math.round((selectedOrg.userCount / selectedOrg.settings.maxUsers) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Uso de IA</span>
                          <span className="text-white font-semibold">
                            {Math.round((selectedOrg.aiUsage.requests / selectedOrg.settings.maxAiRequests) * 100)}%
                          </span>
                        </div>
                        <div className="progress-bar-futuristic">
                          <div 
                            className="progress-fill-memory" 
                            style={{ width: `${Math.round((selectedOrg.aiUsage.requests / selectedOrg.settings.maxAiRequests) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-700/50">
                        <div className="text-center">
                          <p className="text-2xl font-bold gradient-text">{formatCurrency(selectedOrg.revenue)}</p>
                          <p className="text-sm text-gray-400">Revenue Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
          <DialogContent className="glass bg-gray-900 border-gray-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="w-6 h-6 text-yellow-400" />
                <span className="gradient-text">Analytics da Organização</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrg && (
              <div className="space-y-6">
                <div className="text-center p-8 glass-card neon-panel">
                  <BarChart3 className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold gradient-text mb-2">Analytics Avançado</h3>
                  <p className="text-gray-400 mb-4">
                    Análise completa de performance para <span className="text-white font-semibold">{selectedOrg.name}</span>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-lg glass bg-gradient-to-r from-yellow-600/10 to-orange-600/10">
                      <h4 className="text-lg font-bold text-yellow-400">Requisições IA</h4>
                      <p className="text-3xl font-bold text-white">{formatNumber(selectedOrg.aiUsage.requests)}</p>
                      <p className="text-sm text-gray-400">Últimos 30 dias</p>
                    </div>
                    
                    <div className="p-4 rounded-lg glass bg-gradient-to-r from-green-600/10 to-emerald-600/10">
                      <h4 className="text-lg font-bold text-green-400">Eficiência</h4>
                      <p className="text-3xl font-bold text-white">94.2%</p>
                      <p className="text-sm text-gray-400">Taxa de sucesso</p>
                    </div>
                    
                    <div className="p-4 rounded-lg glass bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                      <h4 className="text-lg font-bold text-purple-400">Crescimento</h4>
                      <p className="text-3xl font-bold text-white">+23%</p>
                      <p className="text-sm text-gray-400">vs. mês anterior</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Billing Dialog */}
        <Dialog open={isBillingDialogOpen} onOpenChange={setIsBillingDialogOpen}>
          <DialogContent className="glass bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <CreditCard className="w-6 h-6 text-green-400" />
                <span className="gradient-text">Gerenciamento de Billing</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrg && (
              <div className="space-y-6">
                {/* Billing Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card neon-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Faturamento Atual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-4xl font-bold gradient-text mb-2">{formatCurrency(selectedOrg.revenue)}</p>
                        <p className="text-gray-400">Revenue Mensal</p>
                        <div className="mt-4 p-3 rounded-lg glass bg-green-500/10">
                          <p className="text-green-400 font-semibold">Plano {selectedOrg.plan.toUpperCase()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card neon-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-yellow-400" />
                        Custos de IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Custo Total IA</span>
                          <span className="text-yellow-400 font-bold">${selectedOrg.aiUsage.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Requisições</span>
                          <span className="text-white">{formatNumber(selectedOrg.aiUsage.requests)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Tokens Processados</span>
                          <span className="text-white">{formatNumber(selectedOrg.aiUsage.tokens)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-700/50">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Custo por Requisição</span>
                            <span className="text-cyan-400 font-semibold">
                              ${(selectedOrg.aiUsage.cost / selectedOrg.aiUsage.requests).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Billing Actions */}
                <Card className="glass-card neon-panel">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-cyan-400" />
                      Ações de Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button className="btn-glow bg-gradient-to-r from-green-600 to-emerald-600">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Alterar Plano
                      </Button>
                      <Button className="btn-glow bg-gradient-to-r from-blue-600 to-cyan-600">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Fatura
                      </Button>
                      <Button className="btn-glow bg-gradient-to-r from-purple-600 to-pink-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Histórico
                      </Button>
                      <Button className="btn-glow bg-gradient-to-r from-yellow-600 to-orange-600">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span className="gradient-text">Editar Organização</span>
              </DialogTitle>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="glass bg-gray-800/50 border-gray-600 text-white"
                            data-testid="edit-org-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="glass bg-gray-800/50 border-gray-600 text-white"
                            data-testid="edit-org-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="trading">Trading</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Plano</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-plan">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass bg-gray-800/50 border-gray-600 text-white" data-testid="edit-org-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="active">Ativa</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="suspended">Suspensa</SelectItem>
                            <SelectItem value="inactive">Inativa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="btn-glow bg-gradient-to-r from-cyan-600 to-blue-600 flex-1"
                    data-testid="edit-org-submit"
                  >
                    {editMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
                
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}