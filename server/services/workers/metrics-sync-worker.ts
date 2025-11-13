/**
 * Metrics Sync Worker
 *
 * Função: Sincronizar métricas das redes sociais automaticamente
 *
 * Execução: Cron job a cada 1 hora
 * - Para cada conta social ativa
 * - Coletar métricas dos últimos posts
 * - Coletar métricas da conta/página/canal
 * - Coletar comentários
 * - Salvar tudo no banco
 * - Criar logs de sincronização
 */

import { db } from '../../db';
import { socialAccounts } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { facebookService } from '../social/facebook-service';
import { instagramService } from '../social/instagram-service';
import { youtubeService } from '../social/youtube-service';

interface SyncAccount {
  id: string;
  organizationId: string;
  platform: 'facebook' | 'instagram' | 'youtube';
  accountName: string;
  lastSyncAt: Date | null;
}

export class MetricsSyncWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Iniciar worker com cron job
   */
  start() {
    console.log('📊 Metrics Sync Worker - STARTED');
    console.log('⏰ Running every 1 hour');

    // Executar imediatamente
    this.syncAllAccounts();

    // Executar a cada 1 hora
    this.intervalId = setInterval(() => {
      this.syncAllAccounts();
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Parar worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📊 Metrics Sync Worker - STOPPED');
    }
  }

  /**
   * Sincronizar todas as contas ativas
   */
  private async syncAllAccounts() {
    // Evitar execuções paralelas
    if (this.isRunning) {
      console.log('⏭️  Skipping: Worker already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n📊 [Metrics Sync Worker] Starting...');

      // Buscar todas as contas ativas
      const accounts = await this.getActiveAccounts();

      if (accounts.length === 0) {
        console.log('✅ No active accounts to sync');
        return;
      }

      console.log(`🔄 Found ${accounts.length} active accounts`);

      let successCount = 0;
      let failureCount = 0;

      // Sincronizar cada conta
      for (const account of accounts) {
        try {
          console.log(`\n🔄 Syncing ${account.platform} account: ${account.accountName}`);

          const result = await this.syncAccount(account);

          successCount++;
          console.log(`✅ ${account.platform}: ${result.itemsProcessed} items processed`);

          if (result.errors.length > 0) {
            console.warn(`⚠️  ${result.errors.length} errors during sync`);
          }
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Failed to sync ${account.platform} account:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Failed: ${failureCount}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
    } catch (error: any) {
      console.error('❌ Worker error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Buscar todas as contas ativas
   */
  private async getActiveAccounts(): Promise<SyncAccount[]> {
    const accounts = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.isActive, true));

    return accounts as SyncAccount[];
  }

  /**
   * Sincronizar uma conta específica
   */
  private async syncAccount(account: SyncAccount): Promise<{
    success: boolean;
    itemsProcessed: number;
    errors: any[];
  }> {
    try {
      // Sincronizar conforme a plataforma
      let result: { success: boolean; itemsProcessed: number; errors: any[] };

      switch (account.platform) {
        case 'facebook':
          result = await facebookService.syncAccount(account.id);
          break;

        case 'instagram':
          result = await instagramService.syncAccount(account.id);
          break;

        case 'youtube':
          result = await youtubeService.syncAccount(account.id);
          break;

        default:
          throw new Error(`Unsupported platform: ${account.platform}`);
      }

      // Atualizar lastSyncAt
      await db
        .update(socialAccounts)
        .set({ lastSyncAt: new Date() })
        .where(eq(socialAccounts.id, account.id));

      return result;
    } catch (error: any) {
      console.error(`Sync failed for ${account.platform}:`, error.message);

      return {
        success: false,
        itemsProcessed: 0,
        errors: [{ error: error.message }],
      };
    }
  }

  /**
   * Sincronizar uma conta específica imediatamente (fora do cron)
   */
  async syncAccountNow(accountId: string): Promise<void> {
    console.log(`\n🔄 [Manual Sync] Account ${accountId}`);

    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.isActive) {
      throw new Error('Account is not active');
    }

    await this.syncAccount(account as SyncAccount);
  }

  /**
   * Sincronizar todas as contas de uma organização
   */
  async syncOrganizationAccounts(organizationId: string): Promise<void> {
    console.log(`\n🔄 [Sync Organization] ${organizationId}`);

    const accounts = await db
      .select()
      .from(socialAccounts)
      .where(
        eq(socialAccounts.organizationId, organizationId)
      );

    if (accounts.length === 0) {
      console.log('✅ No accounts found for this organization');
      return;
    }

    console.log(`🔄 Syncing ${accounts.length} accounts...`);

    for (const account of accounts) {
      if (!account.isActive) {
        console.log(`⏭️  Skipping inactive account: ${account.accountName}`);
        continue;
      }

      try {
        await this.syncAccount(account as SyncAccount);
        console.log(`✅ Synced: ${account.accountName}`);
      } catch (error: any) {
        console.error(`❌ Failed to sync ${account.accountName}:`, error.message);
      }
    }
  }

  /**
   * Obter estatísticas de sincronização
   */
  async getSyncStats(): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    lastSyncedAccounts: number;
    neverSyncedAccounts: number;
  }> {
    const allAccounts = await db.select().from(socialAccounts);

    const activeAccounts = allAccounts.filter(a => a.isActive);
    const lastSyncedAccounts = activeAccounts.filter(
      a => a.lastSyncAt && Date.now() - a.lastSyncAt.getTime() < 2 * 60 * 60 * 1000 // Últimas 2 horas
    );
    const neverSyncedAccounts = activeAccounts.filter(a => !a.lastSyncAt);

    return {
      totalAccounts: allAccounts.length,
      activeAccounts: activeAccounts.length,
      lastSyncedAccounts: lastSyncedAccounts.length,
      neverSyncedAccounts: neverSyncedAccounts.length,
    };
  }
}

// Exportar instância singleton
export const metricsSyncWorker = new MetricsSyncWorker();
