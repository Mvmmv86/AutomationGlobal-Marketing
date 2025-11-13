// client/src/pages/AudienceDashboard.tsx
// Página principal de gerenciamento de audiência

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Tag,
  Filter,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Activity,
  Search,
  MoreVertical,
  Star,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useContacts,
  useAudienceDashboard,
  useTags,
  useSegments,
  useDeleteContact,
  type Contact
} from '@/hooks/useAudience';

const glassCardClass = "backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]";

export default function AudienceDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');

  // Queries
  const { data: dashboard, isLoading: loadingDashboard } = useAudienceDashboard();
  const { data: contacts, isLoading: loadingContacts } = useContacts({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    tagId: selectedTag || undefined,
    segmentId: selectedSegment || undefined,
    limit: 50,
  });
  const { data: tags } = useTags();
  const { data: segments } = useSegments();
  const deleteContact = useDeleteContact();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      unsubscribed: 'bg-red-500/20 text-red-400 border-red-500/30',
      bounced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <Badge className={cn('border', variants[status] || variants.active)}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      lead: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      customer: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      subscriber: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      prospect: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };

    return (
      <Badge className={cn('border', variants[type] || variants.lead)}>
        {type}
      </Badge>
    );
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            Audiência
          </h1>
          <p className="text-white/60">
            Gerencie contatos, tags e segmentos da sua audiência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/30 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" className="border-white/30 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button className="glass-button-3d gradient-purple-blue">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loadingDashboard && (
        <div className="flex items-center justify-center py-8">
          <div className="text-white/60">Carregando métricas...</div>
        </div>
      )}

      {/* Dashboard Stats */}
      {!loadingDashboard && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={cn(glassCardClass, "p-6")}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Total de Contatos</div>
                <div className="text-2xl font-bold text-white">{dashboard.totalContacts}</div>
              </div>
            </div>
            <div className="text-xs text-white/40">
              {dashboard.activeContacts} ativos
            </div>
          </div>

          <div className={cn(glassCardClass, "p-6")}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Leads</div>
                <div className="text-2xl font-bold text-white">{dashboard.leadsCount}</div>
              </div>
            </div>
            <div className="text-xs text-white/40">
              Score médio: {dashboard.averageLeadScore.toFixed(1)}
            </div>
          </div>

          <div className={cn(glassCardClass, "p-6")}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Clientes</div>
                <div className="text-2xl font-bold text-white">{dashboard.customersCount}</div>
              </div>
            </div>
            <div className="text-xs text-white/40">
              {dashboard.subscribersCount} inscritos
            </div>
          </div>

          <div className={cn(glassCardClass, "p-6")}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Novos (30d)</div>
                <div className="text-2xl font-bold text-white">{dashboard.newContactsLast30Days}</div>
              </div>
            </div>
            <div className="text-xs text-white/40">
              {dashboard.activeContactsLast30Days} ativos
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={cn(glassCardClass, "p-6")}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="unsubscribed">Descadastrado</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="subscriber">Inscrito</SelectItem>
              <SelectItem value="prospect">Prospecto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as tags</SelectItem>
              {tags?.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacts Table */}
      {loadingContacts && (
        <div className="flex items-center justify-center py-8">
          <div className="text-white/60">Carregando contatos...</div>
        </div>
      )}

      {!loadingContacts && contacts && (
        <div className={cn(glassCardClass, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-white/60">Contato</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Email / Telefone</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Empresa</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Score</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Tags</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact: Contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {contact.firstName && contact.lastName
                              ? `${contact.firstName} ${contact.lastName}`
                              : contact.firstName || contact.email}
                          </div>
                          {contact.position && (
                            <div className="text-xs text-white/40">{contact.position}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {contact.company && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Building2 className="w-4 h-4 text-white/40" />
                          {contact.company}
                        </div>
                      )}
                    </td>
                    <td className="p-4">{getTypeBadge(contact.type)}</td>
                    <td className="p-4">{getStatusBadge(contact.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className={cn("w-4 h-4", getLeadScoreColor(contact.leadScore))} />
                        <span className={cn("font-medium", getLeadScoreColor(contact.leadScore))}>
                          {contact.leadScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.id}
                            className="text-xs"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              borderColor: `${tag.color}40`
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {(contact.tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                            +{(contact.tags?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="w-4 h-4 mr-2" />
                            Gerenciar tags
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => deleteContact.mutate(contact.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {contacts.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <div className="text-white/60 mb-2">Nenhum contato encontrado</div>
              <div className="text-sm text-white/40">
                Tente ajustar os filtros ou adicione novos contatos
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cn(glassCardClass, "p-6")}>
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Tags</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {dashboard?.totalTags || 0}
          </div>
          <div className="text-sm text-white/60">
            Organize seus contatos por categorias
          </div>
        </div>

        <div className={cn(glassCardClass, "p-6")}>
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Segmentos</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {dashboard?.totalSegments || 0}
          </div>
          <div className="text-sm text-white/60">
            Crie grupos dinâmicos de audiência
          </div>
        </div>

        <div className={cn(glassCardClass, "p-6")}>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Engajamento</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {dashboard?.activeContactsLast30Days || 0}
          </div>
          <div className="text-sm text-white/60">
            Contatos ativos nos últimos 30 dias
          </div>
        </div>
      </div>
    </div>
  );
}
