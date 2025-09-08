import OpenAI from "openai";

// Interface for NewsAPI response
interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

// Interface for processed news with relevance
interface ProcessedNews {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: Date;
  source: string;
  relevanceScore: number;
  relevanceReason: string;
  keywords: string[];
}

// Interface for relevance analysis
interface RelevanceAnalysis {
  score: number; // 0-100
  reason: string;
  keywords: string[];
}

export class NewsService {
  private newsApiKey: string;
  private openai: OpenAI;

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY!;
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    if (!this.newsApiKey) {
      throw new Error("NEWS_API_KEY environment variable is required");
    }
  }

  /**
   * Search for news articles using NewsAPI
   */
  async searchNews(params: {
    keyword: string;
    language?: string;
    sources?: string[];
    searchPeriod?: string;
    pageSize?: number;
  }): Promise<NewsArticle[]> {
    const { keyword, language = 'pt', sources, searchPeriod = '24h', pageSize = 20 } = params;

    try {
      // Build NewsAPI URL
      const baseUrl = 'https://newsapi.org/v2/everything';
      const searchParams = new URLSearchParams({
        q: keyword,
        language: language === 'português' ? 'pt' : language === 'inglês' ? 'en' : 'pt',
        sortBy: 'publishedAt',
        pageSize: pageSize.toString(),
        apiKey: this.newsApiKey
      });

      // Add time filter
      const now = new Date();
      let fromDate: Date;
      switch (searchPeriod) {
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '3d':
          fromDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case '1w':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '2w':
          fromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      searchParams.append('from', fromDate.toISOString());

      // Add sources filter if provided
      if (sources && sources.length > 0) {
        const sourceMapping: Record<string, string> = {
          'G1': 'globo.com',
          'UOL': 'uol.com.br',
          'Folha': 'folha.uol.com.br',
          'Estadão': 'estadao.com.br',
          'TechCrunch': 'techcrunch.com',
          'Wired': 'wired.com',
          'Ars Technica': 'arstechnica.com'
        };

        const mappedSources = sources
          .map(source => sourceMapping[source])
          .filter(Boolean)
          .join(',');

        if (mappedSources) {
          searchParams.append('domains', mappedSources);
        }
      }

      const response = await fetch(`${baseUrl}?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }

      const data: NewsAPIResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned status: ${data.status}`);
      }

      return data.articles || [];
    } catch (error) {
      console.error('Error searching news:', error);
      throw new Error(`Failed to search news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze relevance of a news article using AI
   */
  async analyzeRelevance(
    article: NewsArticle,
    primaryKeyword: string,
    secondaryKeywords: string[],
    niche: string
  ): Promise<RelevanceAnalysis> {
    try {
      const prompt = `
Analise a relevância desta notícia para o nicho "${niche}" e palavras-chave fornecidas.

NOTÍCIA:
Título: ${article.title}
Descrição: ${article.description}
Conteúdo: ${article.content?.substring(0, 500) || 'N/A'}

PALAVRA-CHAVE PRINCIPAL: ${primaryKeyword}
PALAVRAS-CHAVE SECUNDÁRIAS: ${secondaryKeywords.join(', ')}
NICHO: ${niche}

Retorne um JSON com:
{
  "score": [número de 0-100 indicando relevância],
  "reason": "[explicação clara do motivo da pontuação]",
  "keywords": ["array", "de", "palavras-chave", "encontradas"]
}

Critérios de pontuação:
- 90-100: Altamente relevante, menciona palavra-chave principal diretamente
- 70-89: Muito relevante, relacionado ao nicho e algumas palavras-chave
- 50-69: Moderadamente relevante, indiretamente relacionado
- 30-49: Pouco relevante, apenas tangencialmente relacionado
- 0-29: Irrelevante ou não relacionado
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de conteúdo e marketing digital. Analise com precisão a relevância de notícias para estratégias de marketing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        score: Math.max(0, Math.min(100, result.score || 0)),
        reason: result.reason || 'Análise não disponível',
        keywords: Array.isArray(result.keywords) ? result.keywords : []
      };
    } catch (error) {
      console.error('Error analyzing relevance:', error);
      return {
        score: 0,
        reason: 'Erro na análise de relevância',
        keywords: []
      };
    }
  }

  /**
   * Process news articles with relevance analysis
   */
  async processNewsWithRelevance(
    articles: NewsArticle[],
    primaryKeyword: string,
    secondaryKeywords: string[],
    niche: string,
    minRelevanceScore: number = 50
  ): Promise<ProcessedNews[]> {
    const processedNews: ProcessedNews[] = [];

    for (const article of articles) {
      try {
        // Analyze relevance
        const relevanceAnalysis = await this.analyzeRelevance(
          article,
          primaryKeyword,
          secondaryKeywords,
          niche
        );

        // Only include articles above minimum relevance score
        if (relevanceAnalysis.score >= minRelevanceScore) {
          processedNews.push({
            id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.urlToImage,
            publishedAt: new Date(article.publishedAt),
            source: article.source.name,
            relevanceScore: relevanceAnalysis.score,
            relevanceReason: relevanceAnalysis.reason,
            keywords: relevanceAnalysis.keywords
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing article: ${article.title}`, error);
        continue;
      }
    }

    // Sort by relevance score (highest first)
    return processedNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get trending topics for a niche
   */
  async getTrendingTopics(niche: string, language: string = 'pt'): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Você é um especialista em tendências de mercado e marketing digital."
          },
          {
            role: "user",
            content: `Liste 10 tópicos em alta para o nicho "${niche}" que seriam relevantes para criar conteúdo de marketing. Retorne apenas um JSON com array de strings: {"topics": ["tópico1", "tópico2", ...]}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return Array.isArray(result.topics) ? result.topics.slice(0, 10) : [];
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Test news search functionality
   */
  async testNewsSearch(keyword: string = 'tecnologia'): Promise<{
    success: boolean;
    articlesFound: number;
    sample?: Partial<NewsArticle>;
    error?: string;
  }> {
    try {
      const articles = await this.searchNews({
        keyword,
        pageSize: 5
      });

      return {
        success: true,
        articlesFound: articles.length,
        sample: articles[0] ? {
          title: articles[0].title,
          source: articles[0].source,
          publishedAt: articles[0].publishedAt
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        articlesFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const newsService = new NewsService();