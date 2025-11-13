// server/services/ai-management-service.ts
// Service para gerenciamento completo de IA: Providers, Quotas, Usage, Load Balancing

import { db } from '../db/index.js';
import { sql, eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import crypto from 'crypto';

// =====================================================
// ENCRYPTION: Para API Keys
// =====================================================

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =====================================================
// PROVIDERS: Gerenciamento de Provedores de IA
// =====================================================

export class AIManagementService {

  // ===== PROVIDERS =====

  async listProviders() {
    const result = await db.execute(sql`
      SELECT
        p.*,
        (
          SELECT json_agg(m.*)
          FROM ai_models m
          WHERE m.provider_id = p.id
          AND m.is_active = true
        ) as models,
        w.weight,
        w.priority,
        w.fallback_order
      FROM ai_providers p
      LEFT JOIN ai_provider_weights w ON p.id = w.provider_id
      ORDER BY p.created_at DESC
    `);

    if (!result.rows || result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      ...row,
      apiKey: '••••••••••••••••••••', // Nunca retornar API key decriptografada
      models: row.models || []
    }));
  }

  async getProvider(providerId: string) {
    const result = await db.execute(sql`
      SELECT
        p.*,
        (
          SELECT json_agg(m.*)
          FROM ai_models m
          WHERE m.provider_id = p.id
        ) as models
      FROM ai_providers p
      WHERE p.id = ${providerId}
    `);

    if (result.rows.length === 0) {
      throw new Error('Provider not found');
    }

    const provider = result.rows[0] as any;

    return {
      ...provider,
      apiKey: '••••••••••••••••••••', // Mascarar API key
      models: provider.models || []
    };
  }

  async createProvider(data: {
    name: string;
    type: 'openai' | 'anthropic' | 'custom';
    apiKey: string;
    rateLimitRequestsPerMinute?: number;
    rateLimitTokensPerMinute?: number;
    rateLimitDailyLimit?: number;
    costInputPer1kTokens?: number;
    costOutputPer1kTokens?: number;
    costPerRequest?: number;
    config?: any;
    weight?: number;
    priority?: number;
  }, createdBy: string) {
    // Criptografar API key
    const encryptedApiKey = encryptApiKey(data.apiKey);

    // Criar provider
    const providerResult = await db.execute(sql`
      INSERT INTO ai_providers (
        name,
        type,
        api_key_encrypted,
        rate_limit_requests_per_minute,
        rate_limit_tokens_per_minute,
        rate_limit_daily_limit,
        cost_input_per_1k_tokens,
        cost_output_per_1k_tokens,
        cost_per_request,
        config,
        created_by
      ) VALUES (
        ${data.name},
        ${data.type},
        ${encryptedApiKey},
        ${data.rateLimitRequestsPerMinute || 3500},
        ${data.rateLimitTokensPerMinute || 90000},
        ${data.rateLimitDailyLimit || 1000000},
        ${data.costInputPer1kTokens || 0.03},
        ${data.costOutputPer1kTokens || 0.06},
        ${data.costPerRequest || 0.001},
        ${JSON.stringify(data.config || {})},
        ${createdBy}
      )
      RETURNING *
    `);

    const provider = providerResult.rows[0] as any;

    // Criar weight do provider
    await db.execute(sql`
      INSERT INTO ai_provider_weights (
        provider_id,
        weight,
        priority
      ) VALUES (
        ${provider.id},
        ${data.weight || 100},
        ${data.priority || 0}
      )
    `);

    return {
      ...provider,
      apiKey: '••••••••••••••••••••'
    };
  }

  async updateProvider(providerId: string, data: {
    name?: string;
    status?: 'active' | 'inactive' | 'error';
    apiKey?: string;
    rateLimitRequestsPerMinute?: number;
    rateLimitTokensPerMinute?: number;
    rateLimitDailyLimit?: number;
    costInputPer1kTokens?: number;
    costOutputPer1kTokens?: number;
    costPerRequest?: number;
    config?: any;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (data.apiKey) {
      updates.push(`api_key_encrypted = $${paramIndex++}`);
      values.push(encryptApiKey(data.apiKey));
    }

    if (data.rateLimitRequestsPerMinute !== undefined) {
      updates.push(`rate_limit_requests_per_minute = $${paramIndex++}`);
      values.push(data.rateLimitRequestsPerMinute);
    }

    if (data.rateLimitTokensPerMinute !== undefined) {
      updates.push(`rate_limit_tokens_per_minute = $${paramIndex++}`);
      values.push(data.rateLimitTokensPerMinute);
    }

    if (data.rateLimitDailyLimit !== undefined) {
      updates.push(`rate_limit_daily_limit = $${paramIndex++}`);
      values.push(data.rateLimitDailyLimit);
    }

    if (data.costInputPer1kTokens !== undefined) {
      updates.push(`cost_input_per_1k_tokens = $${paramIndex++}`);
      values.push(data.costInputPer1kTokens);
    }

    if (data.costOutputPer1kTokens !== undefined) {
      updates.push(`cost_output_per_1k_tokens = $${paramIndex++}`);
      values.push(data.costOutputPer1kTokens);
    }

    if (data.costPerRequest !== undefined) {
      updates.push(`cost_per_request = $${paramIndex++}`);
      values.push(data.costPerRequest);
    }

    if (data.config) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(data.config));
    }

    updates.push(`updated_at = NOW()`);

    values.push(providerId);

    const result = await db.execute(sql.raw(`
      UPDATE ai_providers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values));

    if (result.rows.length === 0) {
      throw new Error('Provider not found');
    }

    return {
      ...(result.rows[0] as any),
      apiKey: '••••••••••••••••••••'
    };
  }

  async deleteProvider(providerId: string) {
    await db.execute(sql`
      DELETE FROM ai_providers
      WHERE id = ${providerId}
    `);

    return { success: true };
  }

  async pingProvider(providerId: string) {
    // Atualizar last_ping_at
    await db.execute(sql`
      UPDATE ai_providers
      SET last_ping_at = NOW()
      WHERE id = ${providerId}
    `);

    return { success: true, timestamp: new Date() };
  }

  // ===== MODELS =====

  async listModels(providerId?: string) {
    if (providerId) {
      const result = await db.execute(sql`
        SELECT * FROM ai_models
        WHERE provider_id = ${providerId}
        ORDER BY popularity_score DESC
      `);

      return result.rows;
    }

    const result = await db.execute(sql`
      SELECT
        m.*,
        p.name as provider_name,
        p.type as provider_type
      FROM ai_models m
      JOIN ai_providers p ON m.provider_id = p.id
      ORDER BY m.popularity_score DESC
    `);

    return result.rows;
  }

  async createModel(data: {
    providerId: string;
    name: string;
    identifier: string;
    type: 'text' | 'chat' | 'image' | 'audio' | 'embedding';
    maxTokens?: number;
    supportsStreaming?: boolean;
    supportsFunctions?: boolean;
    costPer1kTokens?: number;
    costInputPer1kTokens?: number;
    costOutputPer1kTokens?: number;
  }) {
    const result = await db.execute(sql`
      INSERT INTO ai_models (
        provider_id,
        name,
        identifier,
        type,
        max_tokens,
        supports_streaming,
        supports_functions,
        cost_per_1k_tokens,
        cost_input_per_1k_tokens,
        cost_output_per_1k_tokens
      ) VALUES (
        ${data.providerId},
        ${data.name},
        ${data.identifier},
        ${data.type},
        ${data.maxTokens || 4096},
        ${data.supportsStreaming !== undefined ? data.supportsStreaming : true},
        ${data.supportsFunctions !== undefined ? data.supportsFunctions : false},
        ${data.costPer1kTokens},
        ${data.costInputPer1kTokens},
        ${data.costOutputPer1kTokens}
      )
      RETURNING *
    `);

    return result.rows[0];
  }

  async updateModel(modelId: string, data: {
    name?: string;
    isActive?: boolean;
    maxTokens?: number;
    costPer1kTokens?: number;
    costInputPer1kTokens?: number;
    costOutputPer1kTokens?: number;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (data.maxTokens !== undefined) {
      updates.push(`max_tokens = $${paramIndex++}`);
      values.push(data.maxTokens);
    }

    if (data.costPer1kTokens !== undefined) {
      updates.push(`cost_per_1k_tokens = $${paramIndex++}`);
      values.push(data.costPer1kTokens);
    }

    if (data.costInputPer1kTokens !== undefined) {
      updates.push(`cost_input_per_1k_tokens = $${paramIndex++}`);
      values.push(data.costInputPer1kTokens);
    }

    if (data.costOutputPer1kTokens !== undefined) {
      updates.push(`cost_output_per_1k_tokens = $${paramIndex++}`);
      values.push(data.costOutputPer1kTokens);
    }

    updates.push(`updated_at = NOW()`);
    values.push(modelId);

    const result = await db.execute(sql.raw(`
      UPDATE ai_models
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values));

    if (result.rows.length === 0) {
      throw new Error('Model not found');
    }

    return result.rows[0];
  }

  async deleteModel(modelId: string) {
    await db.execute(sql`
      DELETE FROM ai_models
      WHERE id = ${modelId}
    `);

    return { success: true };
  }

  // ===== QUOTAS =====

  async getOrganizationQuota(organizationId: string) {
    const result = await db.execute(sql`
      SELECT * FROM ai_organization_quotas
      WHERE organization_id = ${organizationId}
    `);

    if (result.rows.length === 0) {
      // Criar quota padrão
      return this.createOrganizationQuota(organizationId);
    }

    return result.rows[0];
  }

  async createOrganizationQuota(organizationId: string, data?: {
    monthlyLimitRequests?: number;
    monthlyLimitTokens?: number;
    monthlyLimitCost?: number;
    dailyLimitRequests?: number;
    dailyLimitTokens?: number;
    dailyLimitCost?: number;
    overageAllowed?: boolean;
  }) {
    const result = await db.execute(sql`
      INSERT INTO ai_organization_quotas (
        organization_id,
        monthly_limit_requests,
        monthly_limit_tokens,
        monthly_limit_cost,
        daily_limit_requests,
        daily_limit_tokens,
        daily_limit_cost,
        overage_allowed
      ) VALUES (
        ${organizationId},
        ${data?.monthlyLimitRequests || 10000},
        ${data?.monthlyLimitTokens || 1000000},
        ${data?.monthlyLimitCost || 100.00},
        ${data?.dailyLimitRequests || 1000},
        ${data?.dailyLimitTokens || 100000},
        ${data?.dailyLimitCost || 10.00},
        ${data?.overageAllowed !== undefined ? data.overageAllowed : false}
      )
      ON CONFLICT (organization_id) DO UPDATE
      SET
        monthly_limit_requests = EXCLUDED.monthly_limit_requests,
        monthly_limit_tokens = EXCLUDED.monthly_limit_tokens,
        monthly_limit_cost = EXCLUDED.monthly_limit_cost,
        daily_limit_requests = EXCLUDED.daily_limit_requests,
        daily_limit_tokens = EXCLUDED.daily_limit_tokens,
        daily_limit_cost = EXCLUDED.daily_limit_cost,
        overage_allowed = EXCLUDED.overage_allowed
      RETURNING *
    `);

    return result.rows[0];
  }

  async updateOrganizationQuota(organizationId: string, data: {
    monthlyLimitRequests?: number;
    monthlyLimitTokens?: number;
    monthlyLimitCost?: number;
    dailyLimitRequests?: number;
    dailyLimitTokens?: number;
    dailyLimitCost?: number;
    overageAllowed?: boolean;
    alertAtPercentage?: number;
  }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.monthlyLimitRequests !== undefined) {
      updates.push(`monthly_limit_requests = $${paramIndex++}`);
      values.push(data.monthlyLimitRequests);
    }

    if (data.monthlyLimitTokens !== undefined) {
      updates.push(`monthly_limit_tokens = $${paramIndex++}`);
      values.push(data.monthlyLimitTokens);
    }

    if (data.monthlyLimitCost !== undefined) {
      updates.push(`monthly_limit_cost = $${paramIndex++}`);
      values.push(data.monthlyLimitCost);
    }

    if (data.dailyLimitRequests !== undefined) {
      updates.push(`daily_limit_requests = $${paramIndex++}`);
      values.push(data.dailyLimitRequests);
    }

    if (data.dailyLimitTokens !== undefined) {
      updates.push(`daily_limit_tokens = $${paramIndex++}`);
      values.push(data.dailyLimitTokens);
    }

    if (data.dailyLimitCost !== undefined) {
      updates.push(`daily_limit_cost = $${paramIndex++}`);
      values.push(data.dailyLimitCost);
    }

    if (data.overageAllowed !== undefined) {
      updates.push(`overage_allowed = $${paramIndex++}`);
      values.push(data.overageAllowed);
    }

    if (data.alertAtPercentage !== undefined) {
      updates.push(`alert_at_percentage = $${paramIndex++}`);
      values.push(data.alertAtPercentage);
    }

    updates.push(`updated_at = NOW()`);
    values.push(organizationId);

    const result = await db.execute(sql.raw(`
      UPDATE ai_organization_quotas
      SET ${updates.join(', ')}
      WHERE organization_id = $${paramIndex}
      RETURNING *
    `, values));

    if (result.rows.length === 0) {
      throw new Error('Quota not found');
    }

    return result.rows[0];
  }

  async listAllQuotas() {
    const result = await db.execute(sql`
      SELECT
        q.*,
        o.name as organization_name,
        o.subscription_plan
      FROM ai_organization_quotas q
      JOIN organizations o ON q.organization_id = o.id
      ORDER BY q.current_month_cost DESC
    `);

    return result.rows;
  }

  // ===== USAGE STATS =====

  async getUsageStats(filters?: {
    organizationId?: string;
    providerId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let whereConditions = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.organizationId) {
      whereConditions.push(`organization_id = $${paramIndex++}`);
      values.push(filters.organizationId);
    }

    if (filters?.providerId) {
      whereConditions.push(`provider_id = $${paramIndex++}`);
      values.push(filters.providerId);
    }

    if (filters?.modelId) {
      whereConditions.push(`model_id = $${paramIndex++}`);
      values.push(filters.modelId);
    }

    if (filters?.startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      values.push(filters.endDate);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const result = await db.execute(sql.raw(`
      SELECT
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost,
        AVG(response_time_ms) as avg_response_time,
        (COUNT(CASE WHEN status = 'success' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100) as success_rate
      FROM ai_usage_logs
      ${whereClause}
    `, values));

    return result.rows[0];
  }

  async getUsageByProvider(organizationId?: string, days: number = 30) {
    const result = await db.execute(sql.raw(`
      SELECT
        p.id,
        p.name,
        p.type,
        COUNT(l.id) as total_requests,
        SUM(l.total_tokens) as total_tokens,
        SUM(l.total_cost) as total_cost
      FROM ai_providers p
      LEFT JOIN ai_usage_logs l ON p.id = l.provider_id
        AND l.created_at >= NOW() - INTERVAL '${days} days'
        ${organizationId ? `AND l.organization_id = '${organizationId}'` : ''}
      GROUP BY p.id, p.name, p.type
      ORDER BY total_cost DESC NULLS LAST
    `));

    return result.rows;
  }

  async getUsageByOrganization(days: number = 30) {
    const result = await db.execute(sql.raw(`
      SELECT * FROM ai_usage_stats_by_org
    `));

    return result.rows;
  }

  // ===== LOAD BALANCING =====

  async getLoadBalancingConfig() {
    const result = await db.execute(sql`
      SELECT * FROM ai_load_balancing_config
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      throw new Error('Load balancing config not found');
    }

    return result.rows[0];
  }

  async updateLoadBalancingConfig(data: {
    strategy?: string;
    healthCheckIntervalSeconds?: number;
    failoverThreshold?: number;
    autoScalingEnabled?: boolean;
    config?: any;
  }, updatedBy: string) {
    const result = await db.execute(sql`
      UPDATE ai_load_balancing_config
      SET
        strategy = COALESCE(${data.strategy}, strategy),
        health_check_interval_seconds = COALESCE(${data.healthCheckIntervalSeconds}, health_check_interval_seconds),
        failover_threshold = COALESCE(${data.failoverThreshold}, failover_threshold),
        auto_scaling_enabled = COALESCE(${data.autoScalingEnabled}, auto_scaling_enabled),
        config = COALESCE(${data.config ? JSON.stringify(data.config) : null}, config),
        updated_at = NOW(),
        updated_by = ${updatedBy}
      WHERE id = (SELECT id FROM ai_load_balancing_config ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `);

    return result.rows[0];
  }

  async getProviderWeights() {
    const result = await db.execute(sql`
      SELECT
        w.*,
        p.name as provider_name,
        p.type as provider_type,
        p.status
      FROM ai_provider_weights w
      JOIN ai_providers p ON w.provider_id = p.id
      ORDER BY w.priority DESC, w.weight DESC
    `);

    return result.rows;
  }

  async updateProviderWeight(providerId: string, data: {
    weight?: number;
    priority?: number;
    isActive?: boolean;
    fallbackOrder?: number;
  }) {
    const result = await db.execute(sql`
      INSERT INTO ai_provider_weights (provider_id, weight, priority, is_active, fallback_order)
      VALUES (
        ${providerId},
        ${data.weight || 100},
        ${data.priority || 0},
        ${data.isActive !== undefined ? data.isActive : true},
        ${data.fallbackOrder || 999}
      )
      ON CONFLICT (provider_id) DO UPDATE
      SET
        weight = EXCLUDED.weight,
        priority = EXCLUDED.priority,
        is_active = EXCLUDED.is_active,
        fallback_order = EXCLUDED.fallback_order,
        updated_at = NOW()
      RETURNING *
    `);

    return result.rows[0];
  }

  // ===== LOGGING =====

  async logUsage(data: {
    organizationId: string;
    userId?: string;
    providerId: string;
    modelId: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    responseTimeMs: number;
    status: 'success' | 'error' | 'timeout' | 'rate_limited';
    errorMessage?: string;
    errorCode?: string;
    requestMetadata?: any;
    responseMetadata?: any;
  }) {
    const totalTokens = data.inputTokens + data.outputTokens;
    const totalCost = data.inputCost + data.outputCost;

    // Inserir log
    await db.execute(sql`
      INSERT INTO ai_usage_logs (
        organization_id,
        user_id,
        provider_id,
        model_id,
        request_id,
        endpoint,
        method,
        input_tokens,
        output_tokens,
        total_tokens,
        input_cost,
        output_cost,
        total_cost,
        response_time_ms,
        status,
        error_message,
        error_code,
        request_metadata,
        response_metadata
      ) VALUES (
        ${data.organizationId},
        ${data.userId},
        ${data.providerId},
        ${data.modelId},
        ${data.requestId},
        ${data.endpoint},
        ${data.method},
        ${data.inputTokens},
        ${data.outputTokens},
        ${totalTokens},
        ${data.inputCost},
        ${data.outputCost},
        ${totalCost},
        ${data.responseTimeMs},
        ${data.status},
        ${data.errorMessage},
        ${data.errorCode},
        ${data.requestMetadata ? JSON.stringify(data.requestMetadata) : null},
        ${data.responseMetadata ? JSON.stringify(data.responseMetadata) : null}
      )
    `);

    // Atualizar quota da organização
    await db.execute(sql`
      UPDATE ai_organization_quotas
      SET
        current_month_requests = current_month_requests + 1,
        current_month_tokens = current_month_tokens + ${totalTokens},
        current_month_cost = current_month_cost + ${totalCost},
        current_day_requests = current_day_requests + 1,
        current_day_tokens = current_day_tokens + ${totalTokens},
        current_day_cost = current_day_cost + ${totalCost}
      WHERE organization_id = ${data.organizationId}
    `);

    // Atualizar estatísticas do modelo
    await db.execute(sql`
      UPDATE ai_models
      SET
        total_requests = total_requests + 1,
        total_tokens = total_tokens + ${totalTokens},
        popularity_score = LEAST(popularity_score + 1, 100)
      WHERE id = ${data.modelId}
    `);

    return { success: true };
  }
}

export const aiManagementService = new AIManagementService();
