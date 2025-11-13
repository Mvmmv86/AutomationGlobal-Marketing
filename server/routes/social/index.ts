/**
 * Social Media Routes
 *
 * Gerenciamento de contas, posts, métricas e sincronização
 */

import { Router } from 'express';
import { db } from '../../db';
import { socialAccounts, socialPosts, socialMetrics, socialComments } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { scheduledPostsWorker } from '../../services/workers/scheduled-posts-worker';
import { metricsSyncWorker } from '../../services/workers/metrics-sync-worker';

const router = Router();

// ==========================================================================
// CONTAS SOCIAIS (SOCIAL ACCOUNTS)
// ==========================================================================

/**
 * GET /api/social/accounts
 * Listar todas as contas sociais da organização
 */
router.get('/accounts', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const accounts = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.organizationId, organizationId));

    // Remover tokens sensíveis antes de retornar
    const safeAccounts = accounts.map(account => ({
      ...account,
      accessToken: undefined,
      refreshToken: undefined,
    }));

    res.json({ accounts: safeAccounts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/accounts/:id
 * Obter detalhes de uma conta específica
 */
router.get('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .limit(1);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remover tokens sensíveis
    const safeAccount = {
      ...account,
      accessToken: undefined,
      refreshToken: undefined,
    };

    res.json({ account: safeAccount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/social/accounts/:id
 * Desconectar/deletar conta social
 */
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(socialAccounts)
      .where(eq(socialAccounts.id, id));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/social/accounts/:id/toggle
 * Ativar/desativar conta
 */
router.patch('/accounts/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await db
      .update(socialAccounts)
      .set({ isActive })
      .where(eq(socialAccounts.id, id));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// POSTS
// ==========================================================================

/**
 * GET /api/social/posts
 * Listar posts da organização
 */
router.get('/posts', async (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    const status = req.query.status as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    let query = db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.organizationId, organizationId));

    if (status) {
      query = query.where(eq(socialPosts.status, status as any));
    }

    const posts = await query.orderBy(desc(socialPosts.createdAt)).limit(100);

    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/posts/:id
 * Obter detalhes de um post específico
 */
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, id))
      .limit(1);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/posts
 * Criar novo post
 */
router.post('/posts', async (req, res) => {
  try {
    const {
      organizationId,
      socialAccountId,
      platform,
      postType,
      content,
      mediaUrls,
      hashtags,
      scheduledFor,
      createdBy,
      metadata,
    } = req.body;

    const [post] = await db
      .insert(socialPosts)
      .values({
        organizationId,
        socialAccountId,
        platform,
        postType,
        content,
        mediaUrls,
        hashtags,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'scheduled' : 'draft',
        createdBy,
        metadata,
      })
      .returning();

    res.json({ post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/social/posts/:id
 * Atualizar post
 */
router.patch('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [post] = await db
      .update(socialPosts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, id))
      .returning();

    res.json({ post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/social/posts/:id
 * Deletar post
 */
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(socialPosts)
      .where(eq(socialPosts.id, id));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/posts/:id/publish
 * Publicar post imediatamente
 */
router.post('/posts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    await scheduledPostsWorker.publishNow(id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// MÉTRICAS
// ==========================================================================

/**
 * GET /api/social/metrics/account/:accountId
 * Obter métricas de uma conta
 */
router.get('/metrics/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const metrics = await db
      .select()
      .from(socialMetrics)
      .where(
        and(
          eq(socialMetrics.socialAccountId, accountId),
          eq(socialMetrics.socialPostId, null) // Métricas da conta, não de posts
        )
      )
      .orderBy(desc(socialMetrics.collectedAt))
      .limit(100);

    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/metrics/post/:postId
 * Obter métricas de um post
 */
router.get('/metrics/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const metrics = await db
      .select()
      .from(socialMetrics)
      .where(eq(socialMetrics.socialPostId, postId))
      .orderBy(desc(socialMetrics.collectedAt));

    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// COMENTÁRIOS
// ==========================================================================

/**
 * GET /api/social/comments/post/:postId
 * Obter comentários de um post
 */
router.get('/comments/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await db
      .select()
      .from(socialComments)
      .where(eq(socialComments.socialPostId, postId))
      .orderBy(desc(socialComments.collectedAt));

    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// SINCRONIZAÇÃO
// ==========================================================================

/**
 * POST /api/social/sync/account/:accountId
 * Sincronizar uma conta específica
 */
router.post('/sync/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Executar em background (não bloquear response)
    metricsSyncWorker.syncAccountNow(accountId).catch(console.error);

    res.json({ success: true, message: 'Sync started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/sync/organization/:organizationId
 * Sincronizar todas as contas de uma organização
 */
router.post('/sync/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Executar em background
    metricsSyncWorker.syncOrganizationAccounts(organizationId).catch(console.error);

    res.json({ success: true, message: 'Sync started for all accounts' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/sync/stats
 * Obter estatísticas de sincronização
 */
router.get('/sync/stats', async (req, res) => {
  try {
    const stats = await metricsSyncWorker.getSyncStats();

    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
