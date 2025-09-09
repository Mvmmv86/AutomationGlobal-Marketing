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
          // Fontes brasileiras
          'G1': 'globo.com',
          'UOL': 'uol.com.br',
          'Folha': 'folha.uol.com.br',
          'Estadão': 'estadao.com.br',
          'R7': 'r7.com',
          'Terra': 'terra.com.br',
          'Exame': 'exame.com',
          // Fontes tecnológicas
          'TechCrunch': 'techcrunch.com',
          'Wired': 'wired.com',
          'Ars Technica': 'arstechnica.com',
          'The Verge': 'theverge.com',
          'Engadget': 'engadget.com',
          // Fontes internacionais famosas
          'BBC': 'bbc.com',
          'CNN': 'cnn.com',
          'Reuters': 'reuters.com',
          'Bloomberg': 'bloomberg.com',
          'Associated Press': 'apnews.com',
          'The Guardian': 'theguardian.com',
          'The New York Times': 'nytimes.com',
          'Washington Post': 'washingtonpost.com',
          'Wall Street Journal': 'wsj.com',
          'Financial Times': 'ft.com',
          'TIME': 'time.com',
          'Forbes': 'forbes.com',
          'Business Insider': 'businessinsider.com',
          'ABC News': 'abcnews.go.com',
          'NBC News': 'nbcnews.com',
          'CBS News': 'cbsnews.com',
          'Fox News': 'foxnews.com',
          'Sky News': 'news.sky.com'
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

Critérios de pontuação (SEJA MAIS LIBERAL para incluir mais notícias):
- 90-100: Altamente relevante, menciona palavra-chave principal diretamente
- 70-89: Muito relevante, relacionado ao nicho e algumas palavras-chave
- 50-69: Moderadamente relevante, indiretamente relacionado
- 30-49: Relevante, conexão clara com o tema
- 20-29: Parcialmente relevante, pode ser útil
- 0-19: Irrelevante ou não relacionado
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
        max_completion_tokens: 500,
        temperature: 1
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
   * Generate complete blog article from processed news
   */
  async generateBlogArticle(params: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    niche: string;
    language: string;
    articleSize: string;
    writingStyle: string;
    includeElements: string[];
    defaultCta: string;
  }): Promise<{
    title: string;
    content: string;
    summary: string;
    tags: string[];
    readingTime: number;
  }> {
    try {
      // First, get relevant news
      const articles = await this.searchNews({
        keyword: params.primaryKeyword,
        language: params.language,
        searchPeriod: '24h',
        pageSize: 10
      });

      // Process with relevance analysis
      const processedNews = await this.processNewsWithRelevance(
        articles,
        params.primaryKeyword,
        params.secondaryKeywords,
        params.niche,
        70 // Higher relevance threshold for article generation
      );

      let topArticles;
      
      // If no highly relevant news found, lower the threshold and try again
      if (processedNews.length === 0) {
        console.log('No highly relevant news found, lowering threshold to 40...');
        const processedNewsLowThreshold = await this.processNewsWithRelevance(
          articles,
          params.primaryKeyword,
          params.secondaryKeywords,
          params.niche,
          40 // Lower relevance threshold
        );
        
        if (processedNewsLowThreshold.length === 0) {
          // If still no relevant news, generate article without news context
          console.log('No relevant news found, generating article with general knowledge...');
          return this.generateArticleWithoutNews(params);
        }
        
        // Use lower threshold articles
        topArticles = processedNewsLowThreshold.slice(0, 3);
      } else {
        // Take top 3 most relevant articles
        topArticles = processedNews.slice(0, 3);
      }
      
      const prompt = `
Crie um artigo de blog completo e profissional baseado nas seguintes notícias relevantes:

NOTÍCIAS:
${topArticles.map((item, index) => `
${index + 1}. ${item.title}
Descrição: ${item.description}
Relevância: ${item.relevanceScore}/100 - ${item.relevanceReason}
`).join('\n')}

CONFIGURAÇÕES:
- Palavra-chave principal: ${params.primaryKeyword}
- Palavras-chave secundárias: ${params.secondaryKeywords.join(', ')}
- Nicho: ${params.niche}
- Tamanho: ${params.articleSize}
- Tom: ${params.writingStyle}
- Elementos: ${params.includeElements.join(', ')}
- CTA padrão: ${params.defaultCta}

Retorne um JSON com:
{
  "title": "Título SEO otimizado com palavra-chave principal",
  "content": "Artigo completo em HTML com formatação (h2, p, li, strong, etc)",
  "summary": "Resumo executivo do artigo",
  "tags": ["array", "de", "tags", "SEO"],
  "readingTime": numero_estimado_minutos_leitura
}

REQUISITOS:
- Use a palavra-chave principal no título e pelo menos 3 vezes no conteúdo
- Inclua as palavras-chave secundárias naturalmente
- Estruture com H2 e H3 para boa legibilidade
- Adicione o CTA no final
- Mantenha tom ${params.writingStyle}
- Tamanho aproximado: ${params.articleSize}
- Inclua elementos: ${params.includeElements.join(', ')}
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Você é um redator especialista em marketing de conteúdo e SEO. Crie artigos envolventes, informativos e otimizados para SEO."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
        temperature: 1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || 'Artigo Gerado Automaticamente',
        content: result.content || 'Conteúdo não disponível',
        summary: result.summary || 'Resumo não disponível',
        tags: Array.isArray(result.tags) ? result.tags : [],
        readingTime: result.readingTime || 5
      };
    } catch (error) {
      console.error('Error generating blog article:', error);
      throw new Error(`Failed to generate blog article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        max_completion_tokens: 300,
        temperature: 1
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

  /**
   * Generate article without news context (fallback)
   */
  private async generateArticleWithoutNews(params: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    niche: string;
    language: string;
    articleSize: string;
    writingStyle: string;
    includeElements: string[];
    defaultCta: string;
  }): Promise<{
    title: string;
    content: string;
    summary: string;
    tags: string[];
    readingTime: number;
  }> {
    try {
      const prompt = `
Crie um artigo de blog completo e profissional sobre o tema solicitado:

CONFIGURAÇÕES:
- Palavra-chave principal: ${params.primaryKeyword}
- Palavras-chave secundárias: ${params.secondaryKeywords.join(', ')}
- Nicho: ${params.niche}
- Tamanho: ${params.articleSize}
- Tom: ${params.writingStyle}
- Elementos: ${params.includeElements.join(', ')}
- CTA padrão: ${params.defaultCta}

Retorne um JSON com:
{
  "title": "Título SEO otimizado com palavra-chave principal",
  "content": "Artigo completo em HTML com formatação (h2, p, li, strong, etc)",
  "summary": "Resumo executivo do artigo",
  "tags": ["array", "de", "tags", "SEO"],
  "readingTime": numero_estimado_minutos_leitura
}

REQUISITOS:
- Use a palavra-chave principal no título e pelo menos 3 vezes no conteúdo
- Inclua as palavras-chave secundárias naturalmente
- Estruture com H2 e H3 para boa legibilidade
- Adicione o CTA no final
- Mantenha tom ${params.writingStyle}
- Tamanho aproximado: ${params.articleSize}
- Inclua elementos: ${params.includeElements.join(', ')}
- Baseie-se em conhecimento geral atual sobre o tema
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Você é um redator especialista em marketing de conteúdo e SEO. Crie artigos envolventes, informativos e otimizados para SEO baseados em conhecimento geral. SEMPRE retorne um JSON válido com os campos solicitados."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
        temperature: 1
      });

      console.log('API Response (fallback):', response.choices[0].message.content);
      
      const rawContent = response.choices[0].message.content || '{}';
      let result;
      
      try {
        result = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('JSON Parse Error (fallback):', parseError);
        console.error('Raw content:', rawContent);
        // Try to extract content manually if JSON parsing fails
        result = {};
      }
      
      // Enhanced fallback with better content generation
      if (!result.title || !result.content) {
        console.log('Generating enhanced fallback content...');
        result = {
          title: `${params.primaryKeyword.charAt(0).toUpperCase() + params.primaryKeyword.slice(1)}: Guia Completo para ${new Date().getFullYear()}`,
          content: `<h2>Introdução</h2>
<p>O tema de <strong>${params.primaryKeyword}</strong> tem se tornado cada vez mais relevante no cenário atual. Com o crescimento das tecnologias digitais e a necessidade de <strong>${params.secondaryKeywords[0] || 'inovação'}</strong>, é fundamental entender os aspectos fundamentais deste assunto.</p>

<h2>Principais Conceitos</h2>
<p>Quando falamos de ${params.primaryKeyword}, devemos considerar diversos fatores que influenciam diretamente os resultados. Entre eles, destacam-se:</p>
<ul>
<li><strong>${params.secondaryKeywords[0] || 'Tecnologia'}</strong> - Um pilar fundamental</li>
<li><strong>${params.secondaryKeywords[1] || 'Estratégia'}</strong> - Essencial para o sucesso</li>
<li><strong>Implementação prática</strong> - O que realmente faz a diferença</li>
</ul>

<h2>Como Implementar na Prática</h2>
<p>Para obter resultados efetivos com ${params.primaryKeyword}, é importante seguir algumas etapas fundamentais que garantem o sucesso da implementação.</p>

<h3>Planejamento Estratégico</h3>
<p>O primeiro passo é estabelecer objetivos claros e mensuráveis. Isso inclui definir métricas de sucesso e criar um cronograma realista para a implementação.</p>

<h2>Benefícios e Vantagens</h2>
<p>As principais vantagens de investir em ${params.primaryKeyword} incluem:</p>
<ul>
<li>Maior eficiência operacional</li>
<li>Redução de custos a longo prazo</li>
<li>Melhor experiência do usuário</li>
<li>Competitive advantage no mercado</li>
</ul>

<h2>Conclusão</h2>
<p>O ${params.primaryKeyword} representa uma oportunidade única para empresas e profissionais que buscam se destacar no mercado atual. Com a implementação adequada e foco em ${params.secondaryKeywords.join(', ')}, é possível alcançar resultados extraordinários.</p>

<p><strong>${params.defaultCta}</strong></p>`,
          summary: `Guia completo sobre ${params.primaryKeyword}, abordando conceitos fundamentais, implementação prática e principais benefícios. Inclui estratégias para ${params.secondaryKeywords.join(' e ')} com foco em resultados práticos.`,
          tags: [params.primaryKeyword, ...params.secondaryKeywords, params.niche, 'guia', 'estratégia'],
          readingTime: Math.ceil(params.articleSize === 'curto' ? 3 : params.articleSize === 'longo' ? 8 : 5)
        };
      }
      
      return {
        title: result.title || `${params.primaryKeyword}: Guia Completo`,
        content: result.content || 'Conteúdo em desenvolvimento...',
        summary: result.summary || `Artigo sobre ${params.primaryKeyword} e ${params.secondaryKeywords.join(', ')}.`,
        tags: Array.isArray(result.tags) ? result.tags : [params.primaryKeyword, ...params.secondaryKeywords],
        readingTime: result.readingTime || 5
      };
    } catch (error) {
      console.error('Error generating article without news:', error);
      throw new Error(`Failed to generate article without news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const newsService = new NewsService();