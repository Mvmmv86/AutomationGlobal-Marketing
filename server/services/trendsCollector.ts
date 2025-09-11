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

          // Primeiro, adicionar trends relevantes
          for (const trend of trendingSearches.slice(0, 20)) { // Aumentar para 20 para ter mais chances
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
          
          // Se não encontrou trends relevantes, pegar os top trends e adicionar contexto do nicho
          if (trends.length === 0 && trendingSearches.length > 0) {
            console.log('Nenhum trend relevante encontrado, usando top trends com contexto do nicho...');
            for (const trend of trendingSearches.slice(0, 3)) {
              const keywords = (niche.keywords as string[]) || [];
              // Combinar trend com keyword para criar contexto
              for (const keyword of keywords.slice(0, 1)) {
                trends.push({
                  term: `${keyword}: ${trend.title?.query || 'Tendência do dia'}`,
                  source: 'google_trends',
                  sourceType: 'contextualized_trend',
                  score: 60,
                  metadata: {
                    originalTrend: trend.title?.query,
                    nicheContext: keyword,
                    traffic: trend.formattedTraffic
                  }
                });
              }
            }
          }
        }
      } catch (trendsError) {
        console.log('Google Trends API retornou HTML/erro, usando método alternativo...');
      }

      // Se ainda não tem trends, usar método alternativo baseado em keywords
      if (trends.length === 0) {
        console.log('Usando método alternativo baseado em keywords do nicho...');
        
        // Criar trends baseados nas keywords do nicho
        const keywords = (niche.keywords as string[]) || [];
        const expandedKeywords = this.expandKeywords(keywords);
        
        // Usar keywords expandidas como base para trends
        for (const keyword of expandedKeywords.slice(0, 5)) {
          trends.push({
            term: `${keyword} - Tendências e Novidades ${new Date().getFullYear()}`,
            source: 'keyword_based',
            sourceType: 'niche_trends',
            score: 75,
            metadata: {
              baseKeyword: keyword,
              nicheSlug: niche.slug,
              generated: true
            }
          });
        }
        
        // Também buscar trending topics através de agregação de notícias
        const trendingTopics = await this.collectTrendingFromNews(niche);
        trends.push(...trendingTopics);
      }

      return trends;
    } catch (error) {
      console.error('Erro ao coletar trends:', error);
      
      // Fallback final: retornar trends baseados em keywords
      const keywords = (niche.keywords as string[]) || [];
      return keywords.slice(0, 3).map(keyword => ({
        term: `${keyword} - Análise e Tendências`,
        source: 'fallback',
        sourceType: 'keyword_fallback',
        score: 50,
        metadata: {
          keyword,
          error: error.message
        }
      }));
    }
  }

  /**
   * Método alternativo: Coleta trending topics através de análise de notícias
   */
  private async collectTrendingFromNews(niche: BlogNiche): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    const keywords = (niche.keywords as string[]) || [];
    const expandedKeywords = this.expandKeywords(keywords);
    
    try {
      // Usar NewsAPI para buscar notícias recentes
      if (process.env.NEWS_API_KEY) {
        
        // Usar keywords expandidas para ter mais resultados
        for (const keyword of expandedKeywords.slice(0, 5)) {
          try {
            const response = await axios.get('https://newsapi.org/v2/everything', {
              params: {
                q: keyword,
                language: niche.language || 'pt',
                sortBy: 'popularity', // Ordenar por popularidade
                pageSize: 5,
                from: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0], // Últimas 72h para ter mais resultados
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
          } catch (newsError) {
            console.log(`NewsAPI erro para ${keyword}:`, newsError.message);
          }
        }
      }

      // Sempre usar GDELT para ter mais resultados (não apenas como backup)
      console.log('Buscando artigos no GDELT para complementar resultados...');
      
      // Usar keywords expandidas para GDELT também
      for (const keyword of expandedKeywords.slice(0, 3)) {
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
    
    // Expandir keywords com sinônimos e termos relacionados
    const expandedKeywords = this.expandKeywords(keywords);
    
    // Verificar correspondência direta ou parcial
    for (const keyword of expandedKeywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Match direto
      if (termLower.includes(keywordLower) || keywordLower.includes(termLower)) {
        return true;
      }
      
      // Match parcial (palavras individuais)
      const termWords = termLower.split(/\s+/);
      const keywordWords = keywordLower.split(/\s+/);
      
      // Se alguma palavra do keyword aparece no termo
      const hasMatch = keywordWords.some(kw => 
        termWords.some(tw => tw.includes(kw) || kw.includes(tw))
      );
      
      if (hasMatch) return true;
    }
    
    return false;
  }
  
  /**
   * Expande keywords com sinônimos e termos relacionados
   */
  private expandKeywords(keywords: string[]): string[] {
    const expansionMap: { [key: string]: string[] } = {
      // Finanças e Cripto
      'criptomoeda': ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'moeda digital', 'altcoin', 'defi', 'nft', 'token'],
      'investimento': ['invest', 'ações', 'bolsa', 'mercado', 'renda', 'trading', 'trader', 'ativos', 'fundos', 'dividendos'],
      'blockchain': ['block chain', 'ledger', 'descentralizado', 'web3', 'smart contract', 'contrato inteligente'],
      
      // Tecnologia
      'inteligência artificial': ['ia', 'ai', 'machine learning', 'ml', 'deep learning', 'neural', 'gpt', 'llm'],
      'programação': ['código', 'coding', 'developer', 'software', 'app', 'javascript', 'python', 'react'],
      'tecnologia': ['tech', 'inovação', 'digital', 'startup', 'gadget', 'dispositivo'],
      
      // Marketing
      'marketing digital': ['marketing', 'social media', 'seo', 'ads', 'publicidade', 'campanha', 'influencer'],
      'vendas': ['venda', 'comercial', 'e-commerce', 'conversão', 'lead', 'funil'],
      
      // Games
      'jogos': ['game', 'gaming', 'videogame', 'esports', 'gamer', 'console', 'pc'],
      'playstation': ['ps5', 'ps4', 'sony', 'console'],
      'xbox': ['microsoft', 'gamepass', 'series x', 'series s'],
      'nintendo': ['switch', 'mario', 'zelda', 'pokemon']
    };
    
    const expanded = new Set(keywords);
    
    for (const keyword of keywords) {
      const keyLower = keyword.toLowerCase();
      
      // Adicionar expansões diretas
      if (expansionMap[keyLower]) {
        expansionMap[keyLower].forEach(term => expanded.add(term));
      }
      
      // Verificar se keyword está em alguma expansão
      for (const [key, values] of Object.entries(expansionMap)) {
        if (keyLower.includes(key) || key.includes(keyLower)) {
          values.forEach(term => expanded.add(term));
        }
      }
    }
    
    return Array.from(expanded);
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