import { db } from '../../db';
import { socialAccounts } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business?: {
    id: string;
    name: string;
  };
}

interface AdAccountMetadata {
  adAccountId: string;
  adAccountName: string;
  currency: string;
  timezone: string;
  businessId?: string;
  businessName?: string;
}

export class AdAccountService {
  private baseUrl = 'https://graph.facebook.com/v24.0';

  /**
   * Buscar todas as Ad Accounts do usuário
   * Endpoint: GET /{user-id}/adaccounts
   */
  async getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name,business{id,name}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Failed to fetch ad accounts'}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  /**
   * Salvar Ad Account ID escolhida no metadata da social_account
   */
  async saveAdAccountId(
    socialAccountId: number,
    adAccountId: string,
    adAccountName: string,
    currency: string,
    timezone: string,
    businessId?: string,
    businessName?: string
  ): Promise<void> {
    try {
      // Buscar conta atual para preservar metadata existente
      const [account] = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.id, socialAccountId));

      if (!account) {
        throw new Error('Social account not found');
      }

      // Preservar metadata existente e adicionar ad_account
      const currentMetadata = (account.metadata as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        ad_account: {
          adAccountId,
          adAccountName,
          currency,
          timezone,
          businessId,
          businessName,
          configuredAt: new Date().toISOString()
        } as AdAccountMetadata
      };

      await db
        .update(socialAccounts)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(eq(socialAccounts.id, socialAccountId));

      console.log(`Ad Account ${adAccountId} saved for social account ${socialAccountId}`);
    } catch (error) {
      console.error('Error saving ad account:', error);
      throw error;
    }
  }

  /**
   * Recuperar Ad Account ID do metadata
   */
  async getAdAccountId(socialAccountId: number): Promise<AdAccountMetadata | null> {
    try {
      const [account] = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.id, socialAccountId));

      if (!account || !account.metadata) {
        return null;
      }

      const metadata = account.metadata as any;
      return metadata.ad_account || null;
    } catch (error) {
      console.error('Error getting ad account:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário tem permissões adequadas na Ad Account
   * Endpoint: GET /{ad-account-id}?fields=users
   */
  async checkAdAccountPermissions(
    accessToken: string,
    adAccountId: string
  ): Promise<{
    hasAccess: boolean;
    role?: string;
    tasks?: string[];
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}?fields=users{id,role,tasks}&access_token=${accessToken}`
      );

      if (!response.ok) {
        return { hasAccess: false };
      }

      const result = await response.json();
      const users = result.users?.data || [];

      // Buscar permissões do usuário atual
      const meResponse = await fetch(`${this.baseUrl}/me?access_token=${accessToken}`);
      const meData = await meResponse.json();
      const currentUser = users.find((u: any) => u.id === meData.id);

      if (!currentUser) {
        return { hasAccess: false };
      }

      return {
        hasAccess: true,
        role: currentUser.role,
        tasks: currentUser.tasks || []
      };
    } catch (error) {
      console.error('Error checking ad account permissions:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Verificar status da Ad Account (ativa, desativada, etc)
   */
  async getAdAccountStatus(
    accessToken: string,
    adAccountId: string
  ): Promise<{
    accountId: string;
    accountStatus: number;
    disableReason?: string;
    isActive: boolean;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}?fields=account_id,account_status,disable_reason&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ad account status');
      }

      const result = await response.json();

      // account_status valores:
      // 1 = ACTIVE
      // 2 = DISABLED
      // 3 = UNSETTLED
      // 7 = PENDING_RISK_REVIEW
      // 8 = PENDING_SETTLEMENT
      // 9 = IN_GRACE_PERIOD
      // 100 = PENDING_CLOSURE
      // 101 = CLOSED
      // 201 = ANY_ACTIVE
      // 202 = ANY_CLOSED

      return {
        accountId: result.account_id,
        accountStatus: result.account_status,
        disableReason: result.disable_reason,
        isActive: result.account_status === 1
      };
    } catch (error) {
      console.error('Error getting ad account status:', error);
      throw error;
    }
  }
}

export const adAccountService = new AdAccountService();
