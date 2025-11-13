/**
 * Social Auth Routes
 *
 * OAuth callbacks e conexão de contas sociais
 */

import { Router } from 'express';
import { oauthService } from '../../services/social/oauth-service';

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

    // 4. Para cada página, verificar se tem Instagram conectado
    const accountsToConnect = [];

    for (const page of pages) {
      accountsToConnect.push({
        type: 'facebook',
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
      });

      // Verificar Instagram
      const igAccount = await oauthService.getInstagramAccount(page.id, page.access_token);
      if (igAccount) {
        accountsToConnect.push({
          type: 'instagram',
          pageId: page.id,
          igUserId: igAccount.id,
          igUsername: igAccount.username,
          pageAccessToken: page.access_token,
        });
      }
    }

    // Redirecionar para frontend (callback page)
    const redirectUrl = `/app/social/callback?success=facebook-connected&platform=facebook&accounts=${encodeURIComponent(JSON.stringify(accountsToConnect))}`;
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
