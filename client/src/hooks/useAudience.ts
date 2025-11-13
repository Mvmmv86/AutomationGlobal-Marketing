// client/src/hooks/useAudience.ts
// React Query hooks para Audience API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const API_BASE = '/api/audience';

// Types
export interface Contact {
  id: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  website?: string;
  type: 'lead' | 'customer' | 'subscriber' | 'prospect';
  status: 'active' | 'inactive' | 'unsubscribed' | 'bounced' | 'blocked';
  leadScore: number;
  tags?: Tag[];
  customFields?: Record<string, any>;
  preferences?: Record<string, any>;
  source?: string;
  lastActivityAt?: string;
  totalEmailsSent?: number;
  totalEmailsOpened?: number;
  totalEmailsClicked?: number;
  totalPageViews?: number;
  averageSessionDuration?: number;
  conversionValue?: number;
  activities30d?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  organizationId: string;
  name: string;
  color?: string;
  description?: string;
  contactsCount: number;
  createdAt: string;
}

export interface Segment {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic';
  conditions?: any;
  contactsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  contactId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  occurredAt: string;
}

export interface AudienceDashboard {
  totalContacts: number;
  activeContacts: number;
  leadsCount: number;
  customersCount: number;
  subscribersCount: number;
  prospectsCount: number;
  unsubscribedCount: number;
  averageLeadScore: number;
  totalTags: number;
  totalSegments: number;
  newContactsLast30Days: number;
  activeContactsLast30Days: number;
}

// Hooks para Contacts
export function useContacts(filters?: {
  status?: string;
  type?: string;
  search?: string;
  tagId?: string;
  segmentId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tagId) params.append('tagId', filters.tagId);
      if (filters?.segmentId) params.append('segmentId', filters.segmentId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${API_BASE}/contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      return data.data.contacts as Contact[];
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/contacts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contact');
      const data = await response.json();
      return data.data.contact as Contact;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const response = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['audience-dashboard'] });
      toast({
        title: 'Contato criado',
        description: 'O contato foi adicionado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar contato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const response = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
      toast({
        title: 'Contato atualizado',
        description: 'As alterações foram salvas com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar contato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['audience-dashboard'] });
      toast({
        title: 'Contato excluído',
        description: 'O contato foi removido com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir contato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hooks para Tags
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tags`);
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      return data.data.tags as Tag[];
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tag: Partial<Tag>) => {
      const response = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });
      if (!response.ok) throw new Error('Failed to create tag');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag criada',
        description: 'A tag foi adicionada com sucesso',
      });
    },
  });
}

export function useAddTagToContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const response = await fetch(`${API_BASE}/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (!response.ok) throw new Error('Failed to add tag');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag adicionada',
        description: 'A tag foi associada ao contato',
      });
    },
  });
}

export function useRemoveTagFromContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const response = await fetch(`${API_BASE}/contacts/${contactId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (!response.ok) throw new Error('Failed to remove tag');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag removida',
        description: 'A tag foi removida do contato',
      });
    },
  });
}

// Hooks para Segments
export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/segments`);
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      return data.data.segments as Segment[];
    },
  });
}

export function useSegment(id: string) {
  return useQuery({
    queryKey: ['segment', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/segments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch segment');
      const data = await response.json();
      return data.data.segment as Segment;
    },
    enabled: !!id,
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (segment: Partial<Segment>) => {
      const response = await fetch(`${API_BASE}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segment),
      });
      if (!response.ok) throw new Error('Failed to create segment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({
        title: 'Segmento criado',
        description: 'O segmento foi adicionado com sucesso',
      });
    },
  });
}

// Hooks para Activities
export function useContactActivities(contactId: string) {
  return useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/contacts/${contactId}/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      return data.data.activities as Activity[];
    },
    enabled: !!contactId,
  });
}

// Hook para Dashboard
export function useAudienceDashboard() {
  return useQuery({
    queryKey: ['audience-dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      return data.data.dashboard as AudienceDashboard;
    },
  });
}

// Hook para Bulk Import
export function useBulkImportContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contacts: Partial<Contact>[]) => {
      const response = await fetch(`${API_BASE}/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });
      if (!response.ok) throw new Error('Failed to import contacts');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['audience-dashboard'] });
      toast({
        title: 'Importação concluída',
        description: `${data.data.imported} contatos importados com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
