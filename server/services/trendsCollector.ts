import googleTrends from 'google-trends-api';
import { google } from 'googleapis';
import snoowrap from 'snoowrap';
import axios from 'axios';
import type { TrendingTopic, BlogNiche } from '@shared/schema';

interface TrendData {
  term: string;
  source: string;
  sourceType: string;
  score: number;
  metadata: any;
}

export class TrendsCollectorService {
  private youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY });
  private reddit?: snoowrap;

  constructor() {
    // Initialize Reddit client if credentials exist
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      this.reddit = new snoowrap({
        userAgent: 'Automation Global Blog Bot v1.0',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        username: process.env.REDDIT_USERNAME || '',
        password: process.env.REDDIT_PASSWORD || ''
      });
    }
  }

  /**
   * Coleta trends do Google Trends
   */
  async collectGoogleTrends(niche: BlogNiche): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];
      
      // Google Trends by region
      const results = await googleTrends.dailyTrends({
        trendDate: new Date(),
        geo: niche.region || 'BR',
      });

      const parsedResults = JSON.parse(results);
      const trendingSearches = parsedResults.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

      for (const trend of trendingSearches.slice(0, 10)) {
        // Filtrar por keywords do nicho
        const isRelevant = this.isRelevantToNiche(trend.title?.query, niche.keywords as string[]);
        
        if (isRelevant) {
          trends.push({
            term: trend.title?.query || '',
            source: 'google_trends',
            sourceType: 'daily_trends',
            score: Math.floor(trend.formattedTraffic ? parseInt(trend.formattedTraffic.replace(/\D/g, '')) / 1000 : 50),
            metadata: {
              traffic: trend.formattedTraffic,
              relatedQueries: trend.relatedQueries || [],
              articles: trend.articles || []
            }
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('Erro ao coletar Google Trends:', error);
      return [];
    }
  }

  /**
   * Coleta vídeos populares do YouTube
   */
  async collectYouTubeTrends(niche: BlogNiche): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];
      
      if (!process.env.YOUTUBE_API_KEY) {
        console.warn('YouTube API Key não configurada');
        return [];
      }

      // Buscar vídeos populares relacionados ao nicho
      const keywords = (niche.keywords as string[]) || [];
      
      for (const keyword of keywords.slice(0, 3)) {
        const response = await this.youtube.search.list({
          part: ['snippet'],
          q: keyword,
          type: ['video'],
          order: 'relevance',
          publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Última semana
          maxResults: 5,
          regionCode: niche.region || 'BR'
        });

        const videos = response.data.items || [];
        
        for (const video of videos) {
          trends.push({
            term: video.snippet?.title || '',
            source: 'youtube',
            sourceType: 'search_popular',
            score: 70, // Score fixo para vídeos do YouTube
            metadata: {
              videoId: video.id?.videoId,
              channelTitle: video.snippet?.channelTitle,
              description: video.snippet?.description,
              publishedAt: video.snippet?.publishedAt,
              thumbnails: video.snippet?.thumbnails
            }
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('Erro ao coletar YouTube trends:', error);
      return [];
    }
  }

  /**
   * Coleta posts populares do Reddit
   */
  async collectRedditTrends(niche: BlogNiche): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];
      
      if (!this.reddit) {
        console.warn('Reddit API não configurado');
        return [];
      }

      // Subreddits relacionados ao nicho
      const subreddits = this.getSubredditsForNiche(niche.slug);
      
      for (const subreddit of subreddits.slice(0, 3)) {
        try {
          const posts = await this.reddit.getSubreddit(subreddit).getHot({ limit: 10 });
          
          for (const post of posts) {
            // Filtrar por relevância
            const isRelevant = this.isRelevantToNiche(post.title, niche.keywords as string[]);
            
            if (isRelevant && post.score > 100) {
              trends.push({
                term: post.title,
                source: 'reddit',
                sourceType: 'hot_posts',
                score: Math.min(Math.floor(post.score / 10), 100), // Converter score do Reddit
                metadata: {
                  subreddit: post.subreddit.display_name,
                  author: post.author.name,
                  url: post.url,
                  permalink: `https://reddit.com${post.permalink}`,
                  ups: post.ups,
                  comments: post.num_comments,
                  created: post.created_utc
                }
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar posts de r/${subreddit}:`, error);
        }
      }

      return trends;
    } catch (error) {
      console.error('Erro ao coletar Reddit trends:', error);
      return [];
    }
  }

  /**
   * Coleta trends de todas as fontes
   */
  async collectAllTrends(niche: BlogNiche): Promise<TrendData[]> {
    const allTrends: TrendData[] = [];

    // Executar coletas em paralelo
    const [googleTrends, youtubeTrends, redditTrends] = await Promise.allSettled([
      this.collectGoogleTrends(niche),
      this.collectYouTubeTrends(niche),
      this.collectRedditTrends(niche)
    ]);

    // Adicionar resultados bem-sucedidos
    if (googleTrends.status === 'fulfilled') {
      allTrends.push(...googleTrends.value);
    }
    if (youtubeTrends.status === 'fulfilled') {
      allTrends.push(...youtubeTrends.value);
    }
    if (redditTrends.status === 'fulfilled') {
      allTrends.push(...redditTrends.value);
    }

    // Remover duplicatas e ordenar por score
    const uniqueTrends = this.deduplicateTrends(allTrends);
    return uniqueTrends.sort((a, b) => b.score - a.score);
  }

  /**
   * Verifica se um termo é relevante para o nicho
   */
  private isRelevantToNiche(term: string, keywords: string[]): boolean {
    if (!term || !keywords?.length) return false;
    
    const termLower = term.toLowerCase();
    return keywords.some(keyword => 
      termLower.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(termLower)
    );
  }

  /**
   * Remove trends duplicados
   */
  private deduplicateTrends(trends: TrendData[]): TrendData[] {
    const seen = new Set<string>();
    return trends.filter(trend => {
      const key = trend.term.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Mapeia subreddits por nicho
   */
  private getSubredditsForNiche(nicheSlug: string): string[] {
    const subredditMap: { [key: string]: string[] } = {
      'tecnologia': ['technology', 'programming', 'artificial', 'MachineLearning', 'brasil'],
      'cripto': ['CryptoCurrency', 'Bitcoin', 'ethereum', 'DeFi', 'NFT'],
      'marketing': ['marketing', 'entrepreneur', 'socialmedia', 'digital_marketing'],
      'games': ['gaming', 'pcgaming', 'NintendoSwitch', 'PS5', 'Xbox'],
      'finance': ['investing', 'stocks', 'personalfinance', 'wallstreetbets']
    };

    return subredditMap[nicheSlug] || ['technology', 'worldnews'];
  }
}