// server/services/audience-service.ts
// Service completo para gerenciamento de audiência e segmentação

import { db } from '../database/drizzle-connection.js';
import { sql } from 'drizzle-orm';

// =====================================================
// TYPES
// =====================================================

export type ContactType = 'lead' | 'customer' | 'subscriber' | 'prospect';
export type ContactStatus = 'active' | 'inactive' | 'unsubscribed' | 'bounced' | 'blocked';
export type ActivityType = 'email_sent' | 'email_opened' | 'email_clicked' | 'page_visited' |
  'form_submitted' | 'campaign_joined' | 'purchase' | 'social_interaction' | 'note_added' | 'custom';
export type SegmentType = 'static' | 'dynamic';

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  type?: ContactType;
  status?: ContactStatus;
  company?: string;
  jobTitle?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  language?: string;
  leadSource?: string;
  leadScore?: number;
  lifecycleStage?: string;
  customFields?: any;
  preferences?: any;
  socialProfiles?: any;
  notes?: string;
}

export interface SegmentData {
  name: string;
  description?: string;
  type: SegmentType;
  conditions?: any; // Array de condições para segmentos dinâmicos
}

export interface ActivityData {
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: any;
  campaignId?: string;
  automationId?: string;
  occurredAt?: Date;
}

// =====================================================
// AUDIENCE SERVICE
// =====================================================

export class AudienceService {

  // ===== CONTACTS - CRUD =====

  /**
   * Listar contatos de uma organização
   */
  async listContacts(organizationId: string, filters?: {
    status?: ContactStatus;
    type?: ContactType;
    search?: string; // Busca em email, nome, empresa
    tagId?: string;
    segmentId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = sql`
      SELECT
        c.*,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
          FROM tags t
          INNER JOIN contact_tags ct ON t.id = ct.tag_id
          WHERE ct.contact_id = c.id
        ) as tags,
        (
          SELECT COUNT(*)
          FROM contact_activities ca
          WHERE ca.contact_id = c.id
          AND ca.occurred_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as activities_30d
      FROM contacts c
      WHERE c.organization_id = ${organizationId}
    `;

    // Filtro por status
    if (filters?.status) {
      query = sql`${query} AND c.status = ${filters.status}`;
    }

    // Filtro por tipo
    if (filters?.type) {
      query = sql`${query} AND c.type = ${filters.type}`;
    }

    // Busca por texto
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = sql`${query} AND (
        c.email ILIKE ${searchTerm}
        OR c.first_name ILIKE ${searchTerm}
        OR c.last_name ILIKE ${searchTerm}
        OR c.company ILIKE ${searchTerm}
      )`;
    }

    // Filtro por tag
    if (filters?.tagId) {
      query = sql`${query} AND EXISTS (
        SELECT 1 FROM contact_tags ct
        WHERE ct.contact_id = c.id AND ct.tag_id = ${filters.tagId}
      )`;
    }

    // Filtro por segmento
    if (filters?.segmentId) {
      query = sql`${query} AND EXISTS (
        SELECT 1 FROM segment_contacts sc
        WHERE sc.contact_id = c.id AND sc.segment_id = ${filters.segmentId}
      )`;
    }

    query = sql`${query} ORDER BY c.created_at DESC`;

    // Paginação
    if (filters?.limit) {
      query = sql`${query} LIMIT ${filters.limit}`;
    }
    if (filters?.offset) {
      query = sql`${query} OFFSET ${filters.offset}`;
    }

    const result = await db.execute(query);
    console.log('[AUDIENCE-SERVICE] listContacts result:', { isArray: Array.isArray(result), length: Array.isArray(result) ? result.length : 0 });
    return Array.isArray(result) ? result : [];
  }

  /**
   * Obter um contato por ID
   */
  async getContact(contactId: string, organizationId: string) {
    const result = await db.execute(sql`
      SELECT
        c.*,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
          FROM tags t
          INNER JOIN contact_tags ct ON t.id = ct.tag_id
          WHERE ct.contact_id = c.id
        ) as tags,
        (
          SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'type', s.type))
          FROM segments s
          INNER JOIN segment_contacts sc ON s.id = sc.segment_id
          WHERE sc.contact_id = c.id
        ) as segments
      FROM contacts c
      WHERE c.id = ${contactId}
      AND c.organization_id = ${organizationId}
    `);

    if (result.length === 0) {
      throw new Error('Contato não encontrado');
    }

    return result[0];
  }

  /**
   * Criar novo contato
   */
  async createContact(organizationId: string, data: ContactData, createdBy: string) {
    const result = await db.execute(sql`
      INSERT INTO contacts (
        organization_id,
        email,
        first_name,
        last_name,
        phone,
        type,
        status,
        company,
        job_title,
        industry,
        country,
        state,
        city,
        timezone,
        language,
        lead_source,
        lead_score,
        lifecycle_stage,
        custom_fields,
        preferences,
        social_profiles,
        notes,
        created_by
      )
      VALUES (
        ${organizationId},
        ${data.email},
        ${data.firstName || null},
        ${data.lastName || null},
        ${data.phone || null},
        ${data.type || 'lead'},
        ${data.status || 'active'},
        ${data.company || null},
        ${data.jobTitle || null},
        ${data.industry || null},
        ${data.country || null},
        ${data.state || null},
        ${data.city || null},
        ${data.timezone || null},
        ${data.language || 'pt-BR'},
        ${data.leadSource || null},
        ${data.leadScore || 0},
        ${data.lifecycleStage || null},
        ${data.customFields ? JSON.stringify(data.customFields) : '{}'}::jsonb,
        ${data.preferences ? JSON.stringify(data.preferences) : '{}'}::jsonb,
        ${data.socialProfiles ? JSON.stringify(data.socialProfiles) : null}::jsonb,
        ${data.notes || null},
        ${createdBy}
      )
      RETURNING *
    `);

    console.log('[AUDIENCE-SERVICE] createContact result:', { isArray: Array.isArray(result), length: Array.isArray(result) ? result.length : 0, firstItem: result[0] });
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Falha ao criar contato - nenhum dado retornado');
    }
    return result[0];
  }

  /**
   * Atualizar contato
   */
  async updateContact(contactId: string, organizationId: string, data: Partial<ContactData>) {
    const setClauses: any[] = [];

    // Construir cláusulas SET dinamicamente usando template literals do Drizzle
    if (data.email !== undefined) {
      setClauses.push(sql`email = ${data.email}`);
    }
    if (data.firstName !== undefined) {
      setClauses.push(sql`first_name = ${data.firstName}`);
    }
    if (data.lastName !== undefined) {
      setClauses.push(sql`last_name = ${data.lastName}`);
    }
    if (data.phone !== undefined) {
      setClauses.push(sql`phone = ${data.phone}`);
    }
    if (data.type !== undefined) {
      setClauses.push(sql`type = ${data.type}`);
    }
    if (data.status !== undefined) {
      setClauses.push(sql`status = ${data.status}`);
    }
    if (data.company !== undefined) {
      setClauses.push(sql`company = ${data.company}`);
    }
    if (data.jobTitle !== undefined) {
      setClauses.push(sql`job_title = ${data.jobTitle}`);
    }
    if (data.industry !== undefined) {
      setClauses.push(sql`industry = ${data.industry}`);
    }
    if (data.country !== undefined) {
      setClauses.push(sql`country = ${data.country}`);
    }
    if (data.state !== undefined) {
      setClauses.push(sql`state = ${data.state}`);
    }
    if (data.city !== undefined) {
      setClauses.push(sql`city = ${data.city}`);
    }
    if (data.leadScore !== undefined) {
      setClauses.push(sql`lead_score = ${data.leadScore}`);
    }
    if (data.lifecycleStage !== undefined) {
      setClauses.push(sql`lifecycle_stage = ${data.lifecycleStage}`);
    }
    if (data.customFields !== undefined) {
      setClauses.push(sql`custom_fields = ${JSON.stringify(data.customFields)}::jsonb`);
    }
    if (data.preferences !== undefined) {
      setClauses.push(sql`preferences = ${JSON.stringify(data.preferences)}::jsonb`);
    }
    if (data.notes !== undefined) {
      setClauses.push(sql`notes = ${data.notes}`);
    }

    // Sempre atualiza updated_at
    setClauses.push(sql`updated_at = NOW()`);

    // Construir query usando template literals do Drizzle
    const result = await db.execute(sql`
      UPDATE contacts
      SET ${sql.join(setClauses, sql`, `)}
      WHERE id = ${contactId}
      AND organization_id = ${organizationId}
      RETURNING *
    `);

    if (result.length === 0) {
      throw new Error('Contato não encontrado');
    }

    return result[0];
  }

  /**
   * Deletar contato
   */
  async deleteContact(contactId: string, organizationId: string) {
    const result = await db.execute(sql`
      DELETE FROM contacts
      WHERE id = ${contactId}
      AND organization_id = ${organizationId}
      RETURNING id
    `);

    if (result.length === 0) {
      throw new Error('Contato não encontrado');
    }

    return { success: true };
  }

  // ===== CONTACT TAGS =====

  /**
   * Adicionar tag a um contato
   */
  async addTagToContact(contactId: string, tagId: string) {
    const result = await db.execute(sql`
      INSERT INTO contact_tags (contact_id, tag_id)
      VALUES (${contactId}, ${tagId})
      ON CONFLICT (contact_id, tag_id) DO NOTHING
      RETURNING *
    `);

    return result[0];
  }

  /**
   * Remover tag de um contato
   */
  async removeTagFromContact(contactId: string, tagId: string) {
    await db.execute(sql`
      DELETE FROM contact_tags
      WHERE contact_id = ${contactId}
      AND tag_id = ${tagId}
    `);

    return { success: true };
  }

  // ===== TAGS - CRUD =====

  /**
   * Listar tags
   */
  async listTags(organizationId: string) {
    const result = await db.execute(sql`
      SELECT *
      FROM tags
      WHERE organization_id = ${organizationId}
      ORDER BY name ASC
    `);

    console.log('[AUDIENCE-SERVICE] listTags result:', { hasRows: !!result, rowCount: result?.length, resultKeys: Object.keys(result) });
    return result || [];
  }

  /**
   * Criar tag
   */
  async createTag(organizationId: string, data: { name: string; color?: string; description?: string }) {
    const result = await db.execute(sql`
      INSERT INTO tags (organization_id, name, color, description)
      VALUES (${organizationId}, ${data.name}, ${data.color || null}, ${data.description || null})
      RETURNING *
    `);

    console.log('[AUDIENCE-SERVICE] createTag result:', { hasRows: !!result, rowCount: result?.length, resultKeys: Object.keys(result), firstRow: result?.[0] });
    if (!result || result.length === 0) {
      throw new Error('Falha ao criar tag - nenhum dado retornado');
    }
    return result[0];
  }

  /**
   * Atualizar tag
   */
  async updateTag(tagId: string, organizationId: string, data: { name?: string; color?: string; description?: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    updates.push(`updated_at = NOW()`);

    values.push(tagId, organizationId);

    const result = await db.execute(sql.raw(`
      UPDATE tags
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++}
      AND organization_id = $${paramIndex++}
      RETURNING *
    `, values));

    if (result.length === 0) {
      throw new Error('Tag não encontrada');
    }

    return result[0];
  }

  /**
   * Deletar tag
   */
  async deleteTag(tagId: string, organizationId: string) {
    const result = await db.execute(sql`
      DELETE FROM tags
      WHERE id = ${tagId}
      AND organization_id = ${organizationId}
      RETURNING id
    `);

    if (result.length === 0) {
      throw new Error('Tag não encontrada');
    }

    return { success: true };
  }

  // ===== SEGMENTS - CRUD =====

  /**
   * Listar segmentos
   */
  async listSegments(organizationId: string) {
    const result = await db.execute(sql`
      SELECT
        s.*,
        (
          SELECT COUNT(*)
          FROM segment_contacts sc
          WHERE sc.segment_id = s.id
        ) as contacts_count
      FROM segments s
      WHERE s.organization_id = ${organizationId}
      ORDER BY s.created_at DESC
    `);

    console.log('[AUDIENCE-SERVICE] listSegments result:', { hasRows: !!result, rowCount: result?.length, resultKeys: Object.keys(result) });
    return result || [];
  }

  /**
   * Obter segmento
   */
  async getSegment(segmentId: string, organizationId: string) {
    const result = await db.execute(sql`
      SELECT *
      FROM segment_stats
      WHERE id = ${segmentId}
      AND organization_id = ${organizationId}
    `);

    if (result.length === 0) {
      throw new Error('Segmento não encontrado');
    }

    return result[0];
  }

  /**
   * Criar segmento
   */
  async createSegment(organizationId: string, data: SegmentData, createdBy: string) {
    const result = await db.execute(sql`
      INSERT INTO segments (organization_id, name, description, type, conditions, created_by)
      VALUES (
        ${organizationId},
        ${data.name},
        ${data.description || null},
        ${data.type},
        ${data.conditions ? JSON.stringify(data.conditions) : null}::jsonb,
        ${createdBy}
      )
      RETURNING *
    `);

    console.log('[AUDIENCE-SERVICE] createSegment result:', { hasRows: !!result, rowCount: result?.length, resultKeys: Object.keys(result), firstRow: result?.[0] });
    if (!result || result.length === 0) {
      throw new Error('Falha ao criar segmento - nenhum dado retornado');
    }
    return result[0];
  }

  /**
   * Atualizar segmento
   */
  async updateSegment(segmentId: string, organizationId: string, data: Partial<SegmentData>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.conditions !== undefined) {
      updates.push(`conditions = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(data.conditions));
    }

    updates.push(`updated_at = NOW()`);

    values.push(segmentId, organizationId);

    const result = await db.execute(sql.raw(`
      UPDATE segments
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++}
      AND organization_id = $${paramIndex++}
      RETURNING *
    `, values));

    if (result.length === 0) {
      throw new Error('Segmento não encontrado');
    }

    return result[0];
  }

  /**
   * Deletar segmento
   */
  async deleteSegment(segmentId: string, organizationId: string) {
    const result = await db.execute(sql`
      DELETE FROM segments
      WHERE id = ${segmentId}
      AND organization_id = ${organizationId}
      RETURNING id
    `);

    if (result.length === 0) {
      throw new Error('Segmento não encontrado');
    }

    return { success: true };
  }

  /**
   * Adicionar contato a um segmento
   */
  async addContactToSegment(segmentId: string, contactId: string, automatically: boolean = false) {
    const result = await db.execute(sql`
      INSERT INTO segment_contacts (segment_id, contact_id, added_automatically)
      VALUES (${segmentId}, ${contactId}, ${automatically})
      ON CONFLICT (segment_id, contact_id) DO NOTHING
      RETURNING *
    `);

    return result[0];
  }

  /**
   * Remover contato de um segmento
   */
  async removeContactFromSegment(segmentId: string, contactId: string) {
    await db.execute(sql`
      DELETE FROM segment_contacts
      WHERE segment_id = ${segmentId}
      AND contact_id = ${contactId}
    `);

    return { success: true };
  }

  /**
   * Listar contatos de um segmento
   */
  async getSegmentContacts(segmentId: string, organizationId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    // Verificar se segmento pertence à organização
    await this.getSegment(segmentId, organizationId);

    let query = sql`
      SELECT
        c.*,
        sc.added_automatically,
        sc.created_at as added_at
      FROM contacts c
      INNER JOIN segment_contacts sc ON c.id = sc.contact_id
      WHERE sc.segment_id = ${segmentId}
      ORDER BY sc.created_at DESC
    `;

    if (options?.limit) {
      query = sql`${query} LIMIT ${options.limit}`;
    }
    if (options?.offset) {
      query = sql`${query} OFFSET ${options.offset}`;
    }

    const result = await db.execute(query);
    return result;
  }

  // ===== ACTIVITIES =====

  /**
   * Criar atividade para um contato
   */
  async createActivity(contactId: string, organizationId: string, data: ActivityData) {
    const result = await db.execute(sql`
      INSERT INTO contact_activities (
        contact_id,
        organization_id,
        type,
        title,
        description,
        metadata,
        campaign_id,
        automation_id,
        occurred_at
      )
      VALUES (
        ${contactId},
        ${organizationId},
        ${data.type},
        ${data.title},
        ${data.description || null},
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        ${data.campaignId || null},
        ${data.automationId || null},
        ${data.occurredAt || new Date()}
      )
      RETURNING *
    `);

    return result[0];
  }

  /**
   * Listar atividades de um contato
   */
  async listContactActivities(contactId: string, options?: {
    type?: ActivityType;
    limit?: number;
    offset?: number;
  }) {
    let query = sql`
      SELECT *
      FROM contact_activities
      WHERE contact_id = ${contactId}
    `;

    if (options?.type) {
      query = sql`${query} AND type = ${options.type}`;
    }

    query = sql`${query} ORDER BY occurred_at DESC`;

    if (options?.limit) {
      query = sql`${query} LIMIT ${options.limit}`;
    }
    if (options?.offset) {
      query = sql`${query} OFFSET ${options.offset}`;
    }

    const result = await db.execute(query);
    return result;
  }

  // ===== DASHBOARD & STATS =====

  /**
   * Obter dashboard de audiência da organização
   */
  async getAudienceDashboard(organizationId: string) {
    const result = await db.execute(sql`
      SELECT *
      FROM audience_dashboard
      WHERE organization_id = ${organizationId}
    `);

    if (!result || result.length === 0) {
      return {
        organization_id: organizationId,
        total_contacts: 0,
        active_contacts: 0,
        leads_count: 0,
        customers_count: 0,
        unsubscribed_count: 0,
        avg_lead_score: 0,
        total_emails_sent: 0,
        total_emails_opened: 0,
        total_emails_clicked: 0,
        email_open_rate: 0,
        total_segments: 0,
        active_segments: 0,
        total_tags: 0,
        activities_30d: 0
      };
    }

    return result[0];
  }

  /**
   * Importar contatos em lote (CSV)
   */
  async bulkImportContacts(organizationId: string, contacts: ContactData[], createdBy: string) {
    const imported: any[] = [];
    const errors: any[] = [];

    for (const contact of contacts) {
      try {
        const result = await this.createContact(organizationId, contact, createdBy);
        imported.push(result);
      } catch (error: any) {
        errors.push({
          email: contact.email,
          error: error.message
        });
      }
    }

    return {
      imported: imported.length,
      errors: errors.length,
      total: contacts.length,
      details: { imported, errors }
    };
  }
}

// Exportar instância singleton
export const audienceService = new AudienceService();
