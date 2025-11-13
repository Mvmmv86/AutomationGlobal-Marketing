// server/services/automation-service.ts
// Service completo para gerenciamento de automações

import { db } from '../database/drizzle-connection.js';
import { sql } from 'drizzle-orm';

// =====================================================
// TYPES
// =====================================================

export type AutomationType = 'content' | 'email' | 'social' | 'leads' | 'support' | 'sales';
export type AutomationStatus = 'draft' | 'configuring' | 'active' | 'inactive' | 'paused';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface AutomationConfig {
  [key: string]: any; // Configuração flexível por tipo
}

export interface ScheduleConfig {
  type: 'cron' | 'interval';
  value: string; // cron expression ou intervalo em minutos
  timezone?: string;
}

// =====================================================
// AUTOMATION SERVICE
// =====================================================

export class AutomationService {

  // ===== AUTOMATIONS - CRUD =====

  /**
   * Listar automações de uma organização
   */
  async listAutomations(organizationId: string, filters?: {
    status?: AutomationStatus;
    type?: AutomationType;
    isActive?: boolean;
  }) {
    let query = sql`
      SELECT
        a.*,
        u.email as created_by_email,
        u.username as created_by_username,
        (
          SELECT json_build_object(
            'executions_30d', COALESCE(s.executions_30d, 0),
            'successful_30d', COALESCE(s.successful_30d, 0),
            'failed_30d', COALESCE(s.failed_30d, 0),
            'success_rate_30d', COALESCE(s.success_rate_30d, 0),
            'items_processed_30d', COALESCE(s.items_processed_30d, 0),
            'avg_duration_ms_30d', COALESCE(s.avg_duration_ms_30d, 0)
          )
          FROM automation_stats_30d s
          WHERE s.id = a.id
        ) as stats_30d
      FROM automations a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.organization_id = ${organizationId}
    `;

    // Aplicar filtros
    if (filters?.status) {
      query = sql`${query} AND a.status = ${filters.status}`;
    }
    if (filters?.type) {
      query = sql`${query} AND a.type = ${filters.type}`;
    }
    if (filters?.isActive !== undefined) {
      query = sql`${query} AND a.is_active = ${filters.isActive}`;
    }

    query = sql`${query} ORDER BY a.created_at DESC`;

    const result = await db.execute(query);
    return result.rows;
  }

  /**
   * Obter uma automação por ID
   */
  async getAutomation(automationId: string, organizationId: string) {
    const result = await db.execute(sql`
      SELECT
        a.*,
        u.email as created_by_email,
        u.username as created_by_username,
        (
          SELECT json_build_object(
            'executions_30d', COALESCE(s.executions_30d, 0),
            'successful_30d', COALESCE(s.successful_30d, 0),
            'failed_30d', COALESCE(s.failed_30d, 0),
            'success_rate_30d', COALESCE(s.success_rate_30d, 0),
            'items_processed_30d', COALESCE(s.items_processed_30d, 0),
            'avg_duration_ms_30d', COALESCE(s.avg_duration_ms_30d, 0)
          )
          FROM automation_stats_30d s
          WHERE s.id = a.id
        ) as stats_30d
      FROM automations a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ${automationId}
      AND a.organization_id = ${organizationId}
    `);

    if (result.rows.length === 0) {
      throw new Error('Automação não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Criar nova automação
   */
  async createAutomation(data: {
    organizationId: string;
    name: string;
    description?: string;
    type: AutomationType;
    config: AutomationConfig;
    scheduleEnabled?: boolean;
    scheduleConfig?: ScheduleConfig;
    createdBy: string;
  }) {
    const result = await db.execute(sql`
      INSERT INTO automations (
        organization_id,
        name,
        description,
        type,
        status,
        config,
        schedule_enabled,
        schedule_config,
        created_by
      )
      VALUES (
        ${data.organizationId},
        ${data.name},
        ${data.description || null},
        ${data.type},
        'draft',
        ${JSON.stringify(data.config)}::jsonb,
        ${data.scheduleEnabled || false},
        ${data.scheduleConfig ? JSON.stringify(data.scheduleConfig) : null}::jsonb,
        ${data.createdBy}
      )
      RETURNING *
    `);

    return result.rows[0];
  }

  /**
   * Atualizar automação
   */
  async updateAutomation(
    automationId: string,
    organizationId: string,
    data: Partial<{
      name: string;
      description: string;
      status: AutomationStatus;
      config: AutomationConfig;
      scheduleEnabled: boolean;
      scheduleConfig: ScheduleConfig;
      isActive: boolean;
    }>
  ) {
    // Construir query dinamicamente baseado nos campos fornecidos
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
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.config !== undefined) {
      updates.push(`config = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(data.config));
    }
    if (data.scheduleEnabled !== undefined) {
      updates.push(`schedule_enabled = $${paramIndex++}`);
      values.push(data.scheduleEnabled);
    }
    if (data.scheduleConfig !== undefined) {
      updates.push(`schedule_config = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(data.scheduleConfig));
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    updates.push(`updated_at = NOW()`);

    values.push(automationId, organizationId);

    const result = await db.execute(sql.raw(`
      UPDATE automations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++}
      AND organization_id = $${paramIndex++}
      RETURNING *
    `, values));

    if (result.rows.length === 0) {
      throw new Error('Automação não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Deletar automação
   */
  async deleteAutomation(automationId: string, organizationId: string) {
    const result = await db.execute(sql`
      DELETE FROM automations
      WHERE id = ${automationId}
      AND organization_id = ${organizationId}
      RETURNING id
    `);

    if (result.rows.length === 0) {
      throw new Error('Automação não encontrada');
    }

    return { success: true };
  }

  // ===== AUTOMATION CONTROL =====

  /**
   * Ativar automação
   */
  async activateAutomation(automationId: string, organizationId: string) {
    const result = await db.execute(sql`
      UPDATE automations
      SET
        is_active = true,
        status = 'active',
        updated_at = NOW()
      WHERE id = ${automationId}
      AND organization_id = ${organizationId}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      throw new Error('Automação não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Pausar automação
   */
  async pauseAutomation(automationId: string, organizationId: string) {
    const result = await db.execute(sql`
      UPDATE automations
      SET
        is_active = false,
        status = 'paused',
        updated_at = NOW()
      WHERE id = ${automationId}
      AND organization_id = ${organizationId}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      throw new Error('Automação não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Executar automação manualmente
   */
  async executeAutomation(
    automationId: string,
    organizationId: string,
    userId: string,
    inputData?: any
  ) {
    // Buscar automação
    const automation = await this.getAutomation(automationId, organizationId);

    // Criar execução
    const execution = await db.execute(sql`
      INSERT INTO automation_executions (
        automation_id,
        status,
        triggered_by,
        triggered_by_user_id,
        input_data
      )
      VALUES (
        ${automationId},
        'pending',
        'manual',
        ${userId},
        ${inputData ? JSON.stringify(inputData) : null}::jsonb
      )
      RETURNING *
    `);

    // TODO: Aqui você adicionaria a lógica real de execução
    // Por enquanto, vamos simular uma execução bem-sucedida

    // Atualizar execução como em andamento
    await db.execute(sql`
      UPDATE automation_executions
      SET status = 'running'
      WHERE id = ${execution.rows[0].id}
    `);

    // Log de início
    await this.createExecutionLog(
      execution.rows[0].id,
      'info',
      `Automação iniciada manualmente por usuário ${userId}`
    );

    return {
      executionId: execution.rows[0].id,
      automation,
      status: 'running',
      message: 'Automação iniciada com sucesso'
    };
  }

  // ===== EXECUTIONS =====

  /**
   * Listar execuções de uma automação
   */
  async listExecutions(
    automationId: string,
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: ExecutionStatus;
    }
  ) {
    // Verificar se automação pertence à organização
    await this.getAutomation(automationId, organizationId);

    let query = sql`
      SELECT
        e.*,
        u.email as triggered_by_email,
        u.username as triggered_by_username
      FROM automation_executions e
      LEFT JOIN users u ON e.triggered_by_user_id = u.id
      WHERE e.automation_id = ${automationId}
    `;

    if (options?.status) {
      query = sql`${query} AND e.status = ${options.status}`;
    }

    query = sql`${query} ORDER BY e.started_at DESC`;

    if (options?.limit) {
      query = sql`${query} LIMIT ${options.limit}`;
    }
    if (options?.offset) {
      query = sql`${query} OFFSET ${options.offset}`;
    }

    const result = await db.execute(query);
    return result.rows;
  }

  /**
   * Obter execução específica
   */
  async getExecution(executionId: string) {
    const result = await db.execute(sql`
      SELECT
        e.*,
        u.email as triggered_by_email,
        u.username as triggered_by_username
      FROM automation_executions e
      LEFT JOIN users u ON e.triggered_by_user_id = u.id
      WHERE e.id = ${executionId}
    `);

    if (result.rows.length === 0) {
      throw new Error('Execução não encontrada');
    }

    return result.rows[0];
  }

  /**
   * Atualizar status de execução
   */
  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    data?: {
      itemsProcessed?: number;
      itemsSuccessful?: number;
      itemsFailed?: number;
      outputData?: any;
      errorMessage?: string;
      errorStack?: string;
    }
  ) {
    const updates: string[] = [`status = '${status}'`];

    if (data?.itemsProcessed !== undefined) {
      updates.push(`items_processed = ${data.itemsProcessed}`);
    }
    if (data?.itemsSuccessful !== undefined) {
      updates.push(`items_successful = ${data.itemsSuccessful}`);
    }
    if (data?.itemsFailed !== undefined) {
      updates.push(`items_failed = ${data.itemsFailed}`);
    }
    if (data?.outputData) {
      updates.push(`output_data = '${JSON.stringify(data.outputData)}'::jsonb`);
    }
    if (data?.errorMessage) {
      updates.push(`error_message = '${data.errorMessage.replace(/'/g, "''")}'`);
    }
    if (data?.errorStack) {
      updates.push(`error_stack = '${data.errorStack.replace(/'/g, "''")}'`);
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.push(`completed_at = NOW()`);
      updates.push(`duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000`);
    }

    const result = await db.execute(sql.raw(`
      UPDATE automation_executions
      SET ${updates.join(', ')}
      WHERE id = '${executionId}'
      RETURNING *
    `));

    return result.rows[0];
  }

  // ===== LOGS =====

  /**
   * Criar log de execução
   */
  async createExecutionLog(
    executionId: string,
    level: LogLevel,
    message: string,
    data?: any,
    stepName?: string,
    stepIndex?: number
  ) {
    const result = await db.execute(sql`
      INSERT INTO automation_logs (
        execution_id,
        level,
        message,
        data,
        step_name,
        step_index
      )
      VALUES (
        ${executionId},
        ${level},
        ${message},
        ${data ? JSON.stringify(data) : null}::jsonb,
        ${stepName || null},
        ${stepIndex || null}
      )
      RETURNING *
    `);

    return result.rows[0];
  }

  /**
   * Listar logs de uma execução
   */
  async listExecutionLogs(executionId: string, options?: {
    limit?: number;
    level?: LogLevel;
  }) {
    let query = sql`
      SELECT *
      FROM automation_logs
      WHERE execution_id = ${executionId}
    `;

    if (options?.level) {
      query = sql`${query} AND level = ${options.level}`;
    }

    query = sql`${query} ORDER BY created_at ASC`;

    if (options?.limit) {
      query = sql`${query} LIMIT ${options.limit}`;
    }

    const result = await db.execute(query);
    return result.rows;
  }

  // ===== MÉTRICAS =====

  /**
   * Obter métricas de uma automação
   */
  async getAutomationMetrics(automationId: string, days: number = 30) {
    const result = await db.execute(sql`
      SELECT *
      FROM automation_metrics
      WHERE automation_id = ${automationId}
      AND date >= CURRENT_DATE - INTERVAL '${sql.raw(days.toString())} days'
      ORDER BY date DESC
    `);

    return result.rows;
  }

  /**
   * Obter estatísticas gerais de uma organização
   */
  async getOrganizationStats(organizationId: string) {
    const result = await db.execute(sql`
      SELECT *
      FROM organization_automation_dashboard
      WHERE organization_id = ${organizationId}
    `);

    if (result.rows.length === 0) {
      return {
        organization_id: organizationId,
        total_automations: 0,
        active_automations: 0,
        draft_automations: 0,
        executions_today: 0,
        successful_today: 0,
        executions_7d: 0,
        overall_success_rate: 0,
        time_saved_minutes_30d: 0
      };
    }

    return result.rows[0];
  }
}

// Exportar instância singleton
export const automationService = new AutomationService();
