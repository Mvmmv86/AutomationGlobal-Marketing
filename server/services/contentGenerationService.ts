import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import type { NewsArticle, TrendingTopic, BlogNiche, GeneratedBlogPost } from '@shared/schema';

interface ContentGenerationRequest {
  niche: BlogNiche;
  mode: 'news' | 'social';
  sourceData: {
    articles?: NewsArticle[];
    trends?: TrendingTopic[];
  };
}

interface GeneratedContent {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  featuredImageUrl?: string;
  readingTime: number;
  contentHash: string;
  metadata: any;
}

export class ContentGenerationService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Gera conteúdo de blog baseado nos dados coletados
   */
  async generateBlogPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (request.mode === 'news' && request.sourceData.articles?.length) {
      return this.generateNewsBasedPost(request);
    } else {
      return this.generateSocialBasedPost(request);
    }
  }

  /**
   * Gera post baseado em notícias (Rota A)
   */
  private async generateNewsBasedPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { niche, sourceData } = request;
    const articles = sourceData.articles || [];

    // Preparar contexto das notícias
    const newsContext = articles.map(article => ({
      title: article.title,
      description: article.description,
      source: article.sourceName,
      url: article.url,
      publishedAt: article.publishedAt
    }));

    const prompt = this.buildNewsPrompt(niche, newsContext);
    
    try {
      // Tentar primeiro com OpenAI GPT-5
      const content = await this.generateWithOpenAI(prompt);
      return this.processGeneratedContent(content, request, newsContext);
    } catch (error) {
      console.error('Erro com OpenAI, tentando Anthropic:', error);
      // Fallback para Anthropic
      const content = await this.generateWithAnthropic(prompt);
      return this.processGeneratedContent(content, request, newsContext);
    }
  }

  /**
   * Gera post baseado em trends sociais (Rota B)
   */
  private async generateSocialBasedPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { niche, sourceData } = request;
    const trends = sourceData.trends || [];

    // Preparar contexto dos trends
    const trendsContext = trends.map(trend => ({
      term: trend.term,
      source: trend.source,
      sourceType: trend.sourceType,
      score: trend.score,
      metadata: trend.metadata
    }));

    const prompt = this.buildSocialPrompt(niche, trendsContext);
    
    try {
      // Tentar primeiro com Anthropic Claude para análise social
      const content = await this.generateWithAnthropic(prompt);
      return this.processGeneratedContent(content, request, trendsContext);
    } catch (error) {
      console.error('Erro com Anthropic, tentando OpenAI:', error);
      // Fallback para OpenAI
      const content = await this.generateWithOpenAI(prompt);
      return this.processGeneratedContent(content, request, trendsContext);
    }
  }

  /**
   * Gera conteúdo usando OpenAI GPT-5
   */
  private async generateWithOpenAI(prompt: string): Promise<string> {
    console.log('🤖 Gerando conteúdo com OpenAI GPT-5...');
    console.log('📝 Tamanho do prompt:', prompt.length, 'caracteres');

    const response = await this.openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em criação de conteúdo para blogs. Gere artigos informativos, bem estruturados e envolventes com base nas informações fornecidas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 4000,
    });

    const content = response.choices[0].message.content || '';
    console.log('✅ OpenAI respondeu com', content.length, 'caracteres');

    if (!content || content.length < 100) {
      console.error('⚠️ ERRO: OpenAI retornou conteúdo vazio ou muito curto!');
      console.error('Resposta da API:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI retornou conteúdo vazio ou insuficiente');
    }

    return content;
  }

  /**
   * Gera conteúdo usando Anthropic Claude
   */
  private async generateWithAnthropic(prompt: string): Promise<string> {
    console.log('🤖 Gerando conteúdo com Anthropic Claude...');
    console.log('📝 Tamanho do prompt:', prompt.length, 'caracteres');

    const response = await this.anthropic.messages.create({
      // The newest Anthropic model is "claude-sonnet-4-20250514"
      model: "claude-sonnet-4-20250514",
      system: "Você é um especialista em criação de conteúdo para blogs. Gere artigos informativos, bem estruturados e envolventes com base nas informações fornecidas.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('✅ Anthropic respondeu com', content.length, 'caracteres');

    if (!content || content.length < 100) {
      console.error('⚠️ ERRO: Anthropic retornou conteúdo vazio ou muito curto!');
      console.error('Resposta da API:', JSON.stringify(response, null, 2));
      throw new Error('Anthropic retornou conteúdo vazio ou insuficiente');
    }

    return content;
  }

  /**
   * Constrói prompt para posts baseados em notícias
   */
  private buildNewsPrompt(niche: BlogNiche, newsContext: any[]): string {
    return `
    TAREFA: Criar um artigo de blog sobre ${niche.name} baseado nas notícias mais recentes.

    INFORMAÇÕES DO NICHO:
    - Nome: ${niche.name}
    - Descrição: ${niche.description || 'N/A'}
    - Palavras-chave: ${(niche.keywords as string[])?.join(', ') || 'N/A'}
    - Idioma: ${niche.language}

    NOTÍCIAS DE REFERÊNCIA:
    ${newsContext.map((news, index) => `
    ${index + 1}. ${news.title}
       Descrição: ${news.description}
       Fonte: ${news.source}
       URL: ${news.url}
       Data: ${news.publishedAt}
    `).join('\n')}

    INSTRUÇÕES:
    1. Crie um artigo completo e original (NÃO copie o conteúdo das fontes)
    2. Use as notícias como INSPIRAÇÃO e REFERÊNCIA, mas escreva com suas próprias palavras
    3. Inclua análises, insights e conexões entre as diferentes notícias
    4. Mantenha um tom profissional mas acessível
    5. Inclua citações das fontes no formato: "Segundo [Fonte](URL)"
    6. Structure o artigo com: introdução, desenvolvimento, conclusão
    7. Adicione call-to-actions relevantes

    FORMATO DA RESPOSTA:
    # [TÍTULO DO ARTIGO]

    ## Resumo
    [Resumo de 2-3 linhas do artigo]

    ## Introdução
    [Introdução contextual do tema]

    ## [Subtítulo 1]
    [Conteúdo desenvolvido com análises e insights]

    ## [Subtítulo 2]
    [Mais conteúdo relevante]

    ## Conclusão
    [Conclusão com takeaways importantes]

    ## Referências
    - [Fonte 1](URL)
    - [Fonte 2](URL)

    ## Tags
    tag1, tag2, tag3, tag4, tag5

    IMPORTANTE: O artigo deve ter entre 800-1200 palavras e ser 100% original.
    `;
  }

  /**
   * Constrói prompt para posts baseados em trends sociais
   */
  private buildSocialPrompt(niche: BlogNiche, trendsContext: any[]): string {
    return `
    TAREFA: Criar um artigo de blog sobre ${niche.name} baseado nos trends sociais mais recentes.

    INFORMAÇÕES DO NICHO:
    - Nome: ${niche.name}
    - Descrição: ${niche.description || 'N/A'}
    - Palavras-chave: ${(niche.keywords as string[])?.join(', ') || 'N/A'}
    - Idioma: ${niche.language}

    TRENDS IDENTIFICADOS:
    ${trendsContext.map((trend, index) => `
    ${index + 1}. "${trend.term}"
       Fonte: ${trend.source} (${trend.sourceType})
       Score: ${trend.score}/100
       Metadados: ${JSON.stringify(trend.metadata, null, 2)}
    `).join('\n')}

    INSTRUÇÕES:
    1. Analise os trends e identifique padrões ou conexões
    2. Crie um artigo original que explore esses trends no contexto do nicho
    3. Inclua análises sobre por que esses tópicos estão em alta
    4. Adicione insights sobre o impacto no setor/mercado
    5. Mantenha um tom informativo e engajador
    6. Inclua referências aos trends sem copiar conteúdo diretamente
    7. Adicione perspectivas futuras e recomendações

    FORMATO DA RESPOSTA:
    # [TÍTULO DO ARTIGO]

    ## Resumo
    [Resumo de 2-3 linhas do artigo]

    ## Introdução
    [Contextualização dos trends atuais]

    ## [Subtítulo 1]: Análise dos Trends
    [Análise detalhada dos padrões identificados]

    ## [Subtítulo 2]: Impactos e Oportunidades
    [Discussão sobre impactos no setor]

    ## [Subtítulo 3]: Perspectivas Futuras
    [Análise de tendências futuras]

    ## Conclusão
    [Conclusão com takeaways e recomendações]

    ## Fontes dos Trends
    - Google Trends
    - YouTube
    - Reddit
    - Outras redes sociais

    ## Tags
    tag1, tag2, tag3, tag4, tag5

    IMPORTANTE: O artigo deve ter entre 600-1000 palavras e ser baseado em análise original dos trends.
    `;
  }

  /**
   * Processa o conteúdo gerado e extrai metadados
   */
  private processGeneratedContent(content: string, request: ContentGenerationRequest, sourceContext: any[]): GeneratedContent {
    console.log('📋 Processando conteúdo gerado...');
    console.log('📝 Conteúdo recebido:', content.length, 'caracteres');
    console.log('🔍 Primeiros 200 caracteres:', content.substring(0, 200));

    // Extrair título (primeira linha com #)
    const titleMatch = content.match(/^#\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Artigo sem título';
    console.log('📌 Título extraído:', title);

    // Extrair resumo
    const summaryMatch = content.match(/##\s*Resumo\s*\n(.*?)(?=\n##|\n\n|$)/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    console.log('📄 Resumo extraído:', summary.length, 'caracteres');

    // Extrair tags
    const tagsMatch = content.match(/##\s*Tags\s*\n(.+?)(?=\n##|\n\n|$)/s);
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];
    console.log('🏷️ Tags extraídas:', tags.length, 'tags');

    // Calcular tempo de leitura (aproximadamente 200 palavras por minuto)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    console.log('⏱️ Palavras:', wordCount, '| Tempo de leitura:', readingTime, 'min');

    // Gerar hash para deduplicação
    const contentHash = crypto.createHash('md5').update(content).digest('hex');

    const result = {
      title,
      content,
      summary,
      tags,
      readingTime,
      contentHash,
      metadata: {
        wordCount,
        generatedAt: new Date().toISOString(),
        mode: request.mode,
        sourceCount: sourceContext.length,
        sourceContext: sourceContext.slice(0, 5) // Limitar metadados
      }
    };

    console.log('✅ Conteúdo processado com sucesso!');
    return result;
  }

  /**
   * Gera imagem em destaque usando DALL-E
   */
  async generateFeaturedImage(title: string, niche: BlogNiche): Promise<string | undefined> {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: `Create a professional blog featured image for an article titled "${title}" in the ${niche.name} niche. Style: modern, clean, professional, suitable for a business blog. No text overlays.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url;
    } catch (error) {
      console.error('Erro ao gerar imagem em destaque:', error);
      return undefined;
    }
  }
}