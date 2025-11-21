/**
 * Social Auth Routes
 *
 * OAuth callbacks e conexão de contas sociais
 */

import { Router } from 'express';
import { oauthService } from '../../services/social/oauth-service';
import { adAccountService } from '../../services/social/ad-account-service';

const router = Router();

// ==========================================================================
// FACEBOOK / INSTAGRAM OAUTH
// ==========================================================================

/**
 * GET /api/social/facebook/connect
 * Redirecionar para autorização do Facebook
 */
router.get('/facebook/connect', (req, res) => {
  try {
    // State = organizationId para associar a conta correta após callback
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');
    const authUrl = oauthService.getFacebookAuthUrl(state);

    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/facebook/callback
 * Callback do Facebook OAuth
 */
router.get('/facebook/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    // Decodificar state
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // 1. Trocar code por access token
    const { accessToken } = await oauthService.exchangeFacebookCode(code);

    // 2. Obter long-lived token
    const { accessToken: longLivedToken } = await oauthService.getLongLivedToken(accessToken);

    // 3. Listar páginas do usuário
    const pages = await oauthService.getFacebookPages(longLivedToken);

    // 4. Para cada página, verificar se tem Instagram conectado e salvar automaticamente
    const accountsToConnect = [];
    let firstAccountId: number | null = null;

    for (const page of pages) {
      // Salvar conta do Facebook automaticamente
      const fbAccountId = await oauthService.connectFacebookAccount(
        organizationId,
        page.id,
        page.name,
        page.access_token
      );

      if (!firstAccountId) {
        firstAccountId = fbAccountId;
      }

      accountsToConnect.push({
        type: 'facebook',
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        accountId: fbAccountId
      });

      // Verificar Instagram
      const igAccount = await oauthService.getInstagramAccount(page.id, page.access_token);
      if (igAccount) {
        // Salvar conta do Instagram automaticamente
        const igAccountId = await oauthService.connectInstagramAccount(
          organizationId,
          igAccount.id,
          igAccount.username,
          page.access_token,
          page.id
        );

        if (!firstAccountId) {
          firstAccountId = igAccountId;
        }

        accountsToConnect.push({
          type: 'instagram',
          pageId: page.id,
          igUserId: igAccount.id,
          igUsername: igAccount.username,
          pageAccessToken: page.access_token,
          accountId: igAccountId
        });
      }
    }

    // Redirecionar para frontend (callback page) com accountId da primeira conta
    const redirectUrl = `/app/social/callback?success=facebook-connected&platform=facebook&accountId=${firstAccountId}&accounts=${encodeURIComponent(JSON.stringify(accountsToConnect))}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect('/app/social/callback?error=' + encodeURIComponent(error.message));
  }
});

/**
 * POST /api/social/facebook/save-account
 * Salvar conta do Facebook no banco
 */
router.post('/facebook/save-account', async (req, res) => {
  try {
    const { organizationId, pageId, pageName, pageAccessToken } = req.body;

    const accountId = await oauthService.connectFacebookAccount(
      organizationId,
      pageId,
      pageName,
      pageAccessToken
    );

    res.json({ success: true, accountId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/instagram/save-account
 * Salvar conta do Instagram no banco
 */
router.post('/instagram/save-account', async (req, res) => {
  try {
    const { organizationId, igUserId, igUsername, pageAccessToken, pageId } = req.body;

    const accountId = await oauthService.connectInstagramAccount(
      organizationId,
      igUserId,
      igUsername,
      pageAccessToken,
      pageId
    );

    res.json({ success: true, accountId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// META ADS - AD ACCOUNT CONFIGURATION
// ==========================================================================

/**
 * GET /api/social/facebook/ad-accounts
 * Buscar todas as Ad Accounts do usuário conectado
 */
router.get('/facebook/ad-accounts', async (req, res) => {
  try {
    const { socialAccountId } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({ error: 'socialAccountId is required' });
    }

    // Buscar social account para obter o access token
    const { db } = await import('@db');
    const { socialAccounts } = await import('@db/schema');
    const { eq } = await import('drizzle-orm');

    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, parseInt(socialAccountId as string)));

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    // Descriptografar o token
    const { decrypt } = await import('../../lib/encryption');
    const accessToken = decrypt(account.accessToken);

    // Buscar ad accounts
    const adAccounts = await adAccountService.getAdAccounts(accessToken);

    res.json({ success: true, data: adAccounts });
  } catch (error: any) {
    console.error('Error fetching ad accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/social/facebook/select-ad-account
 * Salvar Ad Account selecionada no metadata da social account
 */
router.post('/facebook/select-ad-account', async (req, res) => {
  try {
    const {
      socialAccountId,
      adAccountId,
      adAccountName,
      currency,
      timezone,
      businessId,
      businessName
    } = req.body;

    if (!socialAccountId || !adAccountId || !adAccountName) {
      return res.status(400).json({
        error: 'socialAccountId, adAccountId, and adAccountName are required'
      });
    }

    await adAccountService.saveAdAccountId(
      parseInt(socialAccountId),
      adAccountId,
      adAccountName,
      currency,
      timezone,
      businessId,
      businessName
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving ad account:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/facebook/ad-account-status
 * Verificar status da Ad Account selecionada
 */
router.get('/facebook/ad-account-status', async (req, res) => {
  try {
    const { socialAccountId } = req.query;

    if (!socialAccountId) {
      return res.status(400).json({ error: 'socialAccountId is required' });
    }

    // Buscar social account para obter access token e ad account id
    const { db } = await import('@db');
    const { socialAccounts } = await import('@db/schema');
    const { eq } = await import('drizzle-orm');

    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, parseInt(socialAccountId as string)));

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    // Buscar ad account do metadata
    const adAccountMetadata = await adAccountService.getAdAccountId(parseInt(socialAccountId as string));

    if (!adAccountMetadata) {
      return res.status(404).json({ error: 'Ad Account not configured' });
    }

    // Descriptografar o token
    const { decrypt } = await import('../../lib/encryption');
    const accessToken = decrypt(account.accessToken);

    // Verificar status
    const status = await adAccountService.getAdAccountStatus(
      accessToken,
      adAccountMetadata.adAccountId
    );

    res.json({ success: true, data: { ...status, metadata: adAccountMetadata } });
  } catch (error: any) {
    console.error('Error checking ad account status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================================
// YOUTUBE (GOOGLE) OAUTH
// ==========================================================================

/**
 * GET /api/social/youtube/connect
 * Redirecionar para autorização do Google/YouTube
 */
router.get('/youtube/connect', (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');
    const authUrl = oauthService.getYouTubeAuthUrl(state);

    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/social/youtube/callback
 * Callback do Google OAuth
 */
router.get('/youtube/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    // Decodificar state
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // 1. Trocar code por tokens
    const { accessToken, refreshToken } = await oauthService.exchangeYouTubeCode(code);

    // 2. Obter dados do canal
    const channel = await oauthService.getYouTubeChannel(accessToken);

    // 3. Salvar no banco
    const accountId = await oauthService.connectYouTubeAccount(
      organizationId,
      channel.id,
      channel.snippet.title,
      accessToken,
      refreshToken
    );

    // Redirecionar para frontend (callback page)
    res.redirect(`/app/social/callback?success=youtube-connected&platform=youtube&accountId=${accountId}`);
  } catch (error: any) {
    console.error('YouTube OAuth callback error:', error);
    res.redirect('/app/social/callback?error=' + encodeURIComponent(error.message));
  }
});

export default router;
