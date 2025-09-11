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
   * Coleta trends do Google Trends - Com fallback para busca alternativa
   */
  async collectGoogleTrends(niche: BlogNiche): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];
      
      // Tentar Google Trends primeiro
      try {
        const results = await googleTrends.dailyTrends({
          trendDate: new Date(),
          geo: niche.region || 'BR',
        });

        // Verificar se é JSON válido
        if (results && results.startsWith('{')) {
          const parsedResults = JSON.parse(results);
          const trendingSearches = parsedResults.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

          for (const trend of trendingSearches.slice(0, 10)) {
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
        }
      } catch (trendsError) {
        console.log('Google Trends API retornou HTML/erro, usando método alternativo...');
      }

      // Se não conseguiu trends do Google, usar método alternativo
      if (trends.length === 0) {
        // Buscar trending topics através de agregação de notícias
        const trendingTopics = await this.collectTrendingFromNews(niche);
        trends.push(...trendingTopics);
      }

      return trends;
    } catch (error) {
      console.error('Erro ao coletar trends:', error);
      return [];
    }
  }

  /**
   * Método alternativo: Coleta trending topics através de análise de notícias
   */
  private async collectTrendingFromNews(niche: BlogNiche): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    const keywords = (niche.keywords as string[]) || [];
    
    try {
      // Usar NewsAPI para buscar notícias recentes
      if (process.env.NEWS_API_KEY) {
        
        for (const keyword of keywords.slice(0, 3)) {
          const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: keyword,
              language: niche.language || 'pt',
              sortBy: 'popularity', // Ordenar por popularidade
              pageSize: 5,
              from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Últimas 24h
              apiKey: process.env.NEWS_API_KEY
            }
          });

          if (response.data?.articles?.length > 0) {
            // Extrair termos mais mencionados nos títulos
            const titles = response.data.articles.map((a: any) => a.title);
            const commonTerms = this.extractCommonTerms(titles, keyword);
            
            commonTerms.forEach((term, index) => {
              trends.push({
                term: term,
                source: 'news_analysis',
                sourceType: 'trending_news',
                score: 90 - (index * 10), // Score baseado em frequência
                metadata: {
                  articleCount: response.data.totalResults || 0,
                  source: 'NewsAPI',
                  keyword: keyword
                }
              });
            });
          }
        }
      }

      // Usar GDELT como backup gratuito
      if (trends.length === 0) {
        
        for (const keyword of keywords.slice(0, 2)) {
          try {
            const response = await axios.get('https://api.gdeltproject.org/api/v2/doc/doc', {
              params: {
                query: keyword,
                mode: 'artlist',
                maxrecords: 10,
                format: 'json',
                sort: 'hybridrel'
              }
            });

            if (response.data?.articles?.length > 0) {
              // Analisar títulos para encontrar trending topics
              const titles = response.data.articles.map((a: any) => a.title || '');
              const commonTerms = this.extractCommonTerms(titles, keyword);
              
              commonTerms.forEach((term, index) => {
                trends.push({
                  term: term,
                  source: 'gdelt',
                  sourceType: 'news_trends',
                  score: 80 - (index * 10),
                  metadata: {
                    articleCount: response.data.articles.length,
                    source: 'GDELT Project'
                  }
                });
              });
            }
          } catch (gdeltError) {
            console.log(`GDELT erro para ${keyword}:`, gdeltError.message);
          }
        }
      }

    } catch (error) {
      console.error('Erro ao coletar trending de notícias:', error);
    }

    return trends;
  }

  /**
   * Extrai termos comuns de uma lista de títulos
   */
  private extractCommonTerms(titles: string[], baseKeyword: string): string[] {
    const termFrequency: { [key: string]: number } = {};
    
    // Palavras para ignorar
    const stopWords = ['a', 'o', 'de', 'da', 'do', 'em', 'com', 'para', 'por', 'que', 'e', 'é', 'um', 'uma', 'the', 'and', 'or', 'for', 'with', 'in', 'on', 'at'];
    
    titles.forEach(title => {
      // Limpar e dividir em palavras
      const words = title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));
      
      // Contar frequência
      words.forEach(word => {
        if (word !== baseKeyword.toLowerCase()) {
          termFrequency[word] = (termFrequency[word] || 0) + 1;
        }
      });
      
      // Também contar bigramas (duas palavras juntas)
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        if (!bigram.includes(baseKeyword.toLowerCase())) {
          termFrequency[bigram] = (termFrequency[bigram] || 0) + 1;
        }
      }
    });
    
    // Ordenar por frequência e retornar top 5
    return Object.entries(termFrequency)
      .filter(([_, count]) => count > 1) // Apenas termos que aparecem mais de uma vez
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => `${baseKeyword} ${term}`);
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

    // TESTE REAL: Google Trends habilitado
    const results = await Promise.allSettled([
      this.collectGoogleTrends(niche),  // HABILITADO para teste real
      this.collectRedditTrends(niche)
    ]);
    
    // CORREÇÃO: Loop seguro ao invés de destructuring
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allTrends.push(...result.value);
      }
    }
    
    // MOCK DATA REMOVIDO - Teste real apenas com APIs funcionais

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