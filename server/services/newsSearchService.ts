import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsArticle, BlogNiche } from '@shared/schema';

interface NewsSearchResult {
  title: string;
  description: string;
  content?: string;
  url: string;
  sourceUrl: string;
  sourceName: string;
  author?: string;
  imageUrl?: string;
  publishedAt: Date;
  language: string;
  relevanceScore: number;
}

export class NewsSearchService {
  private readonly newsApiKey = process.env.NEWS_API_KEY;
  private readonly newsCatcherApiKey = process.env.NEWSCATCHER_API_KEY;

  /**
   * Helper function to safely parse dates with fallback to current date
   */
  private parseDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }
    
    try {
      const date = new Date(dateValue);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date value: ${dateValue}, using current date`);
        return new Date();
      }
      return date;
    } catch (error) {
      console.warn(`Error parsing date: ${dateValue}, using current date`);
      return new Date();
    }
  }

  /**
   * Busca notícias usando múultiplas APIs
   */
  async searchNews(trends: string[], niche: BlogNiche, limit: number = 10): Promise<NewsSearchResult[]> {
    const allArticles: NewsSearchResult[] = [];
    
    // Se não há trends, usar as keywords do nicho diretamente
    let searchTerms = trends.length > 0 ? trends : (niche.keywords as string[]) || [];
    
    // Garantir que sempre temos algo para buscar
    if (searchTerms.length === 0) {
      console.warn('Nenhum termo de busca disponível, usando fallback...');
      searchTerms = ['finanças', 'economia', 'mercado'];
    }

    console.log(`Buscando notícias para termos: ${searchTerms.join(', ')}`);

    // Buscar em paralelo em múultiplas fontes
    const searches = await Promise.allSettled([
      this.searchNewsAPI(searchTerms, niche, limit),
      this.searchNewsCatcherAPI(searchTerms, niche, limit),
      this.searchGDELT(searchTerms, niche, limit)
    ]);

    // Adicionar resultados bem-sucedidos
    searches.forEach((result, index) => {
      const sources = ['NewsAPI', 'NewsCatcher', 'GDELT'];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`${sources[index]}: ${result.value.length} artigos encontrados`);
        allArticles.push(...result.value);
      } else if (result.status === 'rejected') {
        console.warn(`${sources[index]} falhou:`, result.reason);
      }
    });
    
    // Se não encontrou nada, buscar com keywords expandidas
    if (allArticles.length === 0) {
      console.log('Nenhum artigo encontrado, tentando com keywords expandidas...');
      const expandedKeywords = this.expandKeywords(niche.keywords as string[]);
      const fallbackSearches = await Promise.allSettled([
        this.searchGDELT(expandedKeywords.slice(0, 3), niche, limit)
      ]);
      
      fallbackSearches.forEach(result => {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        }
      });
    }

    console.log(`Total de artigos coletados: ${allArticles.length}`);

    // Remover duplicatas e ordenar por relevância
    const uniqueArticles = this.deduplicateArticles(allArticles);
    return uniqueArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  /**
   * Expande keywords com sinônimos e termos relacionados
   */
  private expandKeywords(keywords: string[]): string[] {
    const expansionMap: { [key: string]: string[] } = {
      'criptomoeda': ['bitcoin', 'crypto', 'moeda digital', 'ethereum', 'btc'],
      'investimento': ['ações', 'bolsa', 'mercado financeiro', 'trading', 'invest'],
      'blockchain': ['defi', 'web3', 'nft', 'smart contract']
    };
    
    const expanded = new Set(keywords);
    for (const keyword of keywords) {
      const keyLower = keyword.toLowerCase();
      if (expansionMap[keyLower]) {
        expansionMap[keyLower].forEach(term => expanded.add(term));
      }
    }
    
    return Array.from(expanded);
  }

  /**
   * NewsAPI.org - API principal
   */
  private async searchNewsAPI(trends: string[], niche: BlogNiche, limit: number): Promise<NewsSearchResult[]> {
    if (!this.newsApiKey) {
      console.warn('News API key não configurada');
      return [];
    }

    try {
      const articles: NewsSearchResult[] = [];
      
      for (const trend of trends.slice(0, 3)) {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: trend,
            language: niche.language || 'pt',
            sortBy: 'relevancy',
            pageSize: Math.ceil(limit / 3),
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Última semana
            apiKey: this.newsApiKey
          }
        });

        const newsArticles = response.data.articles || [];
        
        for (const article of newsArticles) {
          if (article.title && article.url && !article.title.includes('[Removed]')) {
            articles.push({
              title: article.title,
              description: article.description || '',
              url: article.url,
              sourceUrl: this.extractDomain(article.url),
              sourceName: article.source?.name || 'Unknown',
              author: article.author,
              imageUrl: article.urlToImage,
              publishedAt: this.parseDate(article.publishedAt),
              language: niche.language || 'pt',
              relevanceScore: this.calculateRelevanceScore(article.title + ' ' + article.description, niche.keywords as string[])
            });
          }
        }
      }

      return articles;
    } catch (error) {
      console.error('Erro ao buscar NewsAPI:', error);
      return [];
    }
  }

  /**
   * NewsCatcher API - Alternativa premium
   */
  private async searchNewsCatcherAPI(trends: string[], niche: BlogNiche, limit: number): Promise<NewsSearchResult[]> {
    if (!this.newsCatcherApiKey) {
      return [];
    }

    try {
      const articles: NewsSearchResult[] = [];
      
      for (const trend of trends.slice(0, 2)) {
        const response = await axios.get('https://api.newscatcherapi.com/v2/search', {
          headers: {
            'x-api-key': this.newsCatcherApiKey
          },
          params: {
            q: trend,
            lang: niche.language || 'pt',
            sort_by: 'relevancy',
            page_size: Math.ceil(limit / 2),
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        });

        const newsArticles = response.data.articles || [];
        
        for (const article of newsArticles) {
          articles.push({
            title: article.title,
            description: article.excerpt || '',
            url: article.link,
            sourceUrl: this.extractDomain(article.link),
            sourceName: article.clean_url || 'Unknown',
            author: article.author,
            imageUrl: article.media,
            publishedAt: this.parseDate(article.published_date),
            language: niche.language || 'pt',
            relevanceScore: this.calculateRelevanceScore(article.title + ' ' + article.excerpt, niche.keywords as string[])
          });
        }
      }

      return articles;
    } catch (error) {
      console.error('Erro ao buscar NewsCatcher:', error);
      return [];
    }
  }

  /**
   * GDELT Project - Fonte gratuita de backup
   */
  private async searchGDELT(trends: string[], niche: BlogNiche, limit: number): Promise<NewsSearchResult[]> {
    try {
      const articles: NewsSearchResult[] = [];
      
      // Usar mais termos de busca para garantir resultados
      const searchTerms = trends.length > 0 ? trends : (niche.keywords as string[]);
      
      for (const trend of searchTerms.slice(0, 3)) {
        try {
          console.log(`GDELT: Buscando por "${trend}"`);
          const response = await axios.get('https://api.gdeltproject.org/api/v2/doc/doc', {
            params: {
              query: trend,
              mode: 'artlist',
              maxrecords: Math.max(10, Math.ceil(limit / 2)),
              format: 'json',
              sort: 'hybridrel'
            },
            timeout: 10000
          });

          const newsArticles = response.data.articles || [];
          console.log(`GDELT: ${newsArticles.length} artigos retornados para "${trend}"`);
          
          for (const article of newsArticles) {
            if (article.title && article.url) {
              articles.push({
                title: article.title,
                description: article.seendate || '',
                url: article.url,
                sourceUrl: this.extractDomain(article.url),
                sourceName: article.domain || 'Unknown',
                publishedAt: this.parseDate(article.seendate),
                language: niche.language || 'pt',
                relevanceScore: this.calculateRelevanceScore(article.title, niche.keywords as string[])
              });
            }
          }
        } catch (gdeltError) {
          console.warn(`GDELT erro para "${trend}":`, gdeltError.message);
        }
      }

      return articles;
    } catch (error) {
      console.error('Erro ao buscar GDELT:', error);
      return [];
    }
  }

  /**
   * Extrai conteúdo completo de um artigo via web scraping
   */
  async extractFullContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AutomationGlobal/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remover scripts, styles e elementos indesejados
      $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();
      
      // Tentar extrair o conteúdo principal
      let content = '';
      
      // Seletores comuns para conteúdo de artigos
      const contentSelectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.main-content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > content.length) {
          content = element.text().trim();
        }
      }

      // Se não encontrou com seletores específicos, pegar o body
      if (!content) {
        content = $('body').text().trim();
      }

      // Limpar e limitar o conteúdo
      return content
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limitar a 5000 caracteres

    } catch (error) {
      console.error('Erro ao extrair conteúdo:', error);
      return '';
    }
  }

  /**
   * Calcula score de relevância baseado nas palavras-chave do nicho
   */
  private calculateRelevanceScore(text: string, keywords: string[]): number {
    if (!text || !keywords?.length) return 50; // Score base para garantir que artigos sejam incluídos
    
    const textLower = text.toLowerCase();
    let score = 50; // Score base
    
    // Expandir keywords para melhor matching
    const expandedKeywords = this.expandKeywords(keywords);
    
    for (const keyword of expandedKeywords) {
      const keywordLower = keyword.toLowerCase();
      // Verificar ocorrências exatas
      const occurrences = (textLower.match(new RegExp(keywordLower, 'gi')) || []).length;
      score += occurrences * 5;
      
      // Verificar palavras parciais
      const words = keywordLower.split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && textLower.includes(word)) {
          score += 2;
        }
      }
    }
    
    return Math.min(score, 100); // Máximo 100
  }

  /**
   * Remove artigos duplicados baseado na URL
   */
  private deduplicateArticles(articles: NewsSearchResult[]): NewsSearchResult[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Extrai domínio de uma URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}