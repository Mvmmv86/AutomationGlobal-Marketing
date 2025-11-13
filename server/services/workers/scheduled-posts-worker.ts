/**
 * Scheduled Posts Worker
 *
 * Função: Processar posts agendados e publicá-los automaticamente
 *
 * Execução: Cron job a cada 5 minutos
 * - Busca posts com status='scheduled' e scheduledFor <= NOW
 * - Publica na rede social apropriada
 * - Atualiza status para 'published' ou 'failed'
 * - Salva platformPostId
 * - Retry automático em caso de falha (até 3 tentativas)
 */

import { db } from '../../db';
import { socialPosts, socialAccounts } from '../../../shared/schema';
import { eq, and, lte } from 'drizzle-orm';
import { facebookService } from '../social/facebook-service';
import { instagramService } from '../social/instagram-service';
import { youtubeService } from '../social/youtube-service';

interface ScheduledPost {
  id: string;
  organizationId: string;
  socialAccountId: string;
  platform: 'facebook' | 'instagram' | 'youtube';
  postType: 'post' | 'story' | 'video' | 'reel' | 'short' | 'carousel';
  content: string | null;
  mediaUrls: any;
  hashtags: any;
  scheduledFor: Date;
  retryCount: number;
  metadata: any;
}

export class ScheduledPostsWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Iniciar worker com cron job
   */
  start() {
    console.log('📅 Scheduled Posts Worker - STARTED');
    console.log('⏰ Running every 5 minutes');

    // Executar imediatamente
    this.processScheduledPosts();

    // Executar a cada 5 minutos
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Parar worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📅 Scheduled Posts Worker - STOPPED');
    }
  }

  /**
   * Processar todos os posts agendados
   */
  private async processScheduledPosts() {
    // Evitar execuções paralelas
    if (this.isRunning) {
      console.log('⏭️  Skipping: Worker already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n📅 [Scheduled Posts Worker] Starting...');

      // Buscar posts agendados para agora
      const scheduledPosts = await this.getScheduledPosts();

      if (scheduledPosts.length === 0) {
        console.log('✅ No posts to publish');
        return;
      }

      console.log(`📝 Found ${scheduledPosts.length} posts to publish`);

      let successCount = 0;
      let failureCount = 0;

      // Processar cada post
      for (const post of scheduledPosts) {
        try {
          console.log(`\n📤 Publishing post ${post.id} (${post.platform})...`);

          await this.publishPost(post);

          successCount++;
          console.log(`✅ Post ${post.id} published successfully`);
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Failed to publish post ${post.id}:`, error.message);

          await this.handleFailure(post, error);
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
   * Buscar posts agendados para publicar agora
   */
  private async getScheduledPosts(): Promise<ScheduledPost[]> {
    const now = new Date();

    const posts = await db
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, 'scheduled'),
          lte(socialPosts.scheduledFor, now)
        )
      )
      .limit(50); // Máximo 50 posts por execução

    return posts as ScheduledPost[];
  }

  /**
   * Publicar post na rede social apropriada
   */
  private async publishPost(post: ScheduledPost): Promise<void> {
    // Atualizar status para 'publishing'
    await db
      .update(socialPosts)
      .set({ status: 'publishing' })
      .where(eq(socialPosts.id, post.id));

    let platformPostId: string;

    try {
      // Publicar conforme a plataforma
      switch (post.platform) {
        case 'facebook':
          platformPostId = await this.publishToFacebook(post);
          break;

        case 'instagram':
          platformPostId = await this.publishToInstagram(post);
          break;

        case 'youtube':
          platformPostId = await this.publishToYouTube(post);
          break;

        default:
          throw new Error(`Unsupported platform: ${post.platform}`);
      }

      // Atualizar como publicado
      await db
        .update(socialPosts)
        .set({
          status: 'published',
          platformPostId,
          publishedAt: new Date(),
          errorMessage: null,
        })
        .where(eq(socialPosts.id, post.id));
    } catch (error: any) {
      // Reverter status para 'scheduled' se falhar
      await db
        .update(socialPosts)
        .set({
          status: 'scheduled',
          errorMessage: error.message,
        })
        .where(eq(socialPosts.id, post.id));

      throw error;
    }
  }

  /**
   * Publicar no Facebook
   */
  private async publishToFacebook(post: ScheduledPost): Promise<string> {
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

    if (post.postType === 'video') {
      return await facebookService.publishVideoPost({
        accountId: post.socialAccountId,
        content: post.content || '',
        mediaUrls,
      });
    }

    if (mediaUrls.length > 1) {
      return await facebookService.publishMultiplePhotosPost({
        accountId: post.socialAccountId,
        content: post.content || '',
        mediaUrls,
      });
    }

    if (mediaUrls.length === 1) {
      return await facebookService.publishPhotoPost({
        accountId: post.socialAccountId,
        content: post.content || '',
        mediaUrls,
      });
    }

    return await facebookService.publishTextPost({
      accountId: post.socialAccountId,
      content: post.content || '',
    });
  }

  /**
   * Publicar no Instagram
   */
  private async publishToInstagram(post: ScheduledPost): Promise<string> {
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

    if (mediaUrls.length === 0) {
      throw new Error('Instagram requires at least one media URL');
    }

    const caption = this.buildInstagramCaption(post);

    if (post.postType === 'story') {
      return await instagramService.publishStory({
        accountId: post.socialAccountId,
        caption,
        mediaType: 'STORIES',
        mediaUrls,
      });
    }

    if (post.postType === 'video' || post.postType === 'reel') {
      return await instagramService.publishVideoPost({
        accountId: post.socialAccountId,
        caption,
        mediaType: 'VIDEO',
        mediaUrls,
      });
    }

    if (post.postType === 'carousel' || mediaUrls.length > 1) {
      return await instagramService.publishCarouselPost({
        accountId: post.socialAccountId,
        caption,
        mediaType: 'CAROUSEL_ALBUM',
        mediaUrls,
      });
    }

    return await instagramService.publishPhotoPost({
      accountId: post.socialAccountId,
      caption,
      mediaType: 'IMAGE',
      mediaUrls,
    });
  }

  /**
   * Publicar no YouTube
   */
  private async publishToYouTube(post: ScheduledPost): Promise<string> {
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

    if (mediaUrls.length === 0) {
      throw new Error('YouTube requires a video URL');
    }

    const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];

    return await youtubeService.uploadVideo({
      accountId: post.socialAccountId,
      title: post.metadata?.title || 'Untitled Video',
      description: post.content || '',
      tags: hashtags,
      privacyStatus: post.metadata?.privacyStatus || 'public',
      videoUrl: mediaUrls[0],
      thumbnailUrl: post.metadata?.thumbnailUrl,
    });
  }

  /**
   * Construir caption do Instagram (texto + hashtags)
   */
  private buildInstagramCaption(post: ScheduledPost): string {
    let caption = post.content || '';

    // Adicionar hashtags
    if (post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0) {
      const hashtags = post.hashtags
        .map((tag: string) => (tag.startsWith('#') ? tag : `#${tag}`))
        .join(' ');

      caption = `${caption}\n\n${hashtags}`;
    }

    return caption;
  }

  /**
   * Lidar com falha de publicação
   */
  private async handleFailure(post: ScheduledPost, error: Error): Promise<void> {
    const maxRetries = 3;
    const newRetryCount = post.retryCount + 1;

    if (newRetryCount >= maxRetries) {
      // Máximo de tentativas atingido - marcar como failed
      console.log(`❌ Post ${post.id} failed after ${maxRetries} attempts`);

      await db
        .update(socialPosts)
        .set({
          status: 'failed',
          errorMessage: error.message,
          retryCount: newRetryCount,
        })
        .where(eq(socialPosts.id, post.id));
    } else {
      // Tentar novamente na próxima execução
      console.log(`🔄 Post ${post.id} will retry (attempt ${newRetryCount}/${maxRetries})`);

      await db
        .update(socialPosts)
        .set({
          retryCount: newRetryCount,
          errorMessage: error.message,
        })
        .where(eq(socialPosts.id, post.id));
    }
  }

  /**
   * Publicar post imediatamente (fora do cron)
   */
  async publishNow(postId: string): Promise<void> {
    console.log(`\n📤 [Manual Publish] Post ${postId}`);

    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.status !== 'draft' && post.status !== 'scheduled') {
      throw new Error(`Post is already ${post.status}`);
    }

    await this.publishPost(post as ScheduledPost);
  }
}

// Exportar instância singleton
export const scheduledPostsWorker = new ScheduledPostsWorker();
