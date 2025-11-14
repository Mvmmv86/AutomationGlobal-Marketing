/**
 * AI Content Service
 *
 * Serviço para geração e otimização de conteúdo usando IA
 * Suporta múltiplos providers: OpenAI, Claude (Anthropic), Gemini (Google)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface GenerateSuggestionsParams {
  content?: string;
  platform: string;
  tone?: string;
  niche?: string;
  language?: string;
}

interface OptimizeContentParams {
  content: string;
  platform: string;
  goal?: string;
  targetAudience?: string;
  language?: string;
}

interface AIResponse {
  success: boolean;
  suggestions?: string[];
  optimizedContent?: string;
  improvements?: string[];
  error?: string;
}

class AIContentService {
  private provider: 'openai' | 'anthropic' | 'gemini';
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Inicializar OpenAI se a key existir
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI GPT-4 client initialized');
    }

    // Inicializar Anthropic se a key existir
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('✅ Anthropic Claude client initialized');
    }

    // Definir provider padrão (prioridade: OpenAI > Anthropic)
    if (this.openai) {
      this.provider = 'openai';
      console.log('🎯 Provider padrão: OpenAI GPT-4 Turbo');
    } else if (this.anthropic) {
      this.provider = 'anthropic';
      console.log('🎯 Provider padrão: Anthropic Claude 3.5 Sonnet');
    } else {
      this.provider = 'openai'; // Fallback para mock
      console.log('⚠️ Nenhuma API key configurada - usando respostas mock');
    }
  }

  /**
   * Gera sugestões de conteúdo para redes sociais
   */
  async generateSuggestions(params: GenerateSuggestionsParams): Promise<AIResponse> {
    try {
      const { content, platform, tone = 'profissional', niche, language = 'português' } = params;

      // Monta o prompt
      const prompt = this.buildSuggestionsPrompt(content, platform, tone, niche, language);

      console.log('🤖 Gerando sugestões com IA...');
      console.log('Platform:', platform);
      console.log('Tone:', tone);

      // Chama a IA
      const suggestions = await this.callAI(prompt);

      console.log('✅ Sugestões geradas:', suggestions.length);

      return {
        success: true,
        suggestions
      };

    } catch (error: any) {
      console.error('❌ Erro ao gerar sugestões:', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerar sugestões',
        suggestions: this.getFallbackSuggestions(params.platform)
      };
    }
  }

  /**
   * Otimiza conteúdo existente
   */
  async optimizeContent(params: OptimizeContentParams): Promise<AIResponse> {
    try {
      const { content, platform, goal = 'engajamento', targetAudience, language = 'português' } = params;

      // Monta o prompt
      const prompt = this.buildOptimizationPrompt(content, platform, goal, targetAudience, language);

      console.log('🤖 Otimizando conteúdo com IA...');
      console.log('Platform:', platform);
      console.log('Goal:', goal);

      // Chama a IA
      const result = await this.callAI(prompt);

      // Separa conteúdo otimizado das melhorias sugeridas
      const optimizedContent = result[0] || content;
      const improvements = result.slice(1);

      console.log('✅ Conteúdo otimizado');

      return {
        success: true,
        optimizedContent,
        improvements
      };

    } catch (error: any) {
      console.error('❌ Erro ao otimizar conteúdo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao otimizar conteúdo',
        optimizedContent: params.content,
        improvements: ['Não foi possível otimizar o conteúdo no momento']
      };
    }
  }

  /**
   * Monta prompt para geração de sugestões
   */
  private buildSuggestionsPrompt(
    content: string | undefined,
    platform: string,
    tone: string,
    niche: string | undefined,
    language: string
  ): string {
    let prompt = `Você é um especialista em marketing de conteúdo para redes sociais.\n\n`;

    prompt += `Gere 5 sugestões de posts para ${platform} em ${language}.\n\n`;

    if (niche) {
      prompt += `Nicho: ${niche}\n`;
    }

    if (content) {
      prompt += `Tema ou ideia base: ${content}\n`;
    }

    prompt += `Tom: ${tone}\n\n`;

    prompt += `Requisitos:\n`;
    prompt += `- Cada sugestão deve ser completa e pronta para postar\n`;
    prompt += `- Use emojis apropriados para o ${platform}\n`;
    prompt += `- Adapte o tamanho para a plataforma (${this.getPlatformCharLimit(platform)} caracteres)\n`;
    prompt += `- Inclua call-to-action quando apropriado\n`;
    prompt += `- Use hashtags relevantes (3-5 hashtags)\n\n`;

    prompt += `Retorne APENAS as 5 sugestões, uma por linha, sem numeração ou texto adicional.`;

    return prompt;
  }

  /**
   * Monta prompt para otimização de conteúdo
   */
  private buildOptimizationPrompt(
    content: string,
    platform: string,
    goal: string,
    targetAudience: string | undefined,
    language: string
  ): string {
    let prompt = `Você é um especialista em otimização de conteúdo para redes sociais.\n\n`;

    prompt += `Otimize o seguinte post para ${platform} em ${language}:\n\n`;
    prompt += `"${content}"\n\n`;

    prompt += `Objetivo: ${goal}\n`;

    if (targetAudience) {
      prompt += `Público-alvo: ${targetAudience}\n`;
    }

    prompt += `\nMelhorias desejadas:\n`;
    prompt += `- Aumentar ${goal}\n`;
    prompt += `- Manter autenticidade e naturalidade\n`;
    prompt += `- Usar emojis estrategicamente\n`;
    prompt += `- Adaptar para ${platform} (${this.getPlatformCharLimit(platform)} caracteres)\n`;
    prompt += `- Incluir hashtags relevantes\n`;
    prompt += `- Call-to-action efetivo\n\n`;

    prompt += `Retorne:\n`;
    prompt += `1. Primeira linha: O post otimizado\n`;
    prompt += `2. Linhas seguintes: 3-4 explicações breves do que foi melhorado`;

    return prompt;
  }

  /**
   * Chama a IA com o provider configurado
   */
  private async callAI(prompt: string): Promise<string[]> {
    try {
      if (this.provider === 'openai' && this.openai) {
        return await this.callOpenAI(prompt);
      } else if (this.provider === 'anthropic' && this.anthropic) {
        return await this.callAnthropic(prompt);
      } else {
        // Fallback para mock
        console.log('⚠️ Usando resposta mock (sem API key configurada)');
        return this.getMockResponse();
      }
    } catch (error: any) {
      console.error('❌ Erro ao chamar IA:', error.message);
      return this.getMockResponse();
    }
  }

  /**
   * Chama OpenAI GPT-4
   */
  private async callOpenAI(prompt: string): Promise<string[]> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    console.log('🤖 Chamando OpenAI GPT-4...');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing de conteúdo para redes sociais.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content || '';

    // Divide a resposta em linhas (cada linha é uma sugestão ou melhoria)
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('✅ OpenAI respondeu com', lines.length, 'linhas');

    return lines;
  }

  /**
   * Chama Anthropic Claude
   */
  private async callAnthropic(prompt: string): Promise<string[]> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    console.log('🤖 Chamando Anthropic Claude...');

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Divide a resposta em linhas
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('✅ Claude respondeu com', lines.length, 'linhas');

    return lines;
  }

  /**
   * Resposta mock para fallback
   */
  private getMockResponse(): string[] {
    return [
      'Conteúdo otimizado com emojis ✨ e call-to-action! 🚀 #Marketing #SocialMedia',
      'Adicionado emojis relevantes para aumentar engajamento',
      'Incluído hashtags estratégicas para alcance',
      'Melhorado call-to-action para incentivar interação'
    ];
  }

  /**
   * Retorna limite de caracteres por plataforma
   */
  private getPlatformCharLimit(platform: string): number {
    const limits: Record<string, number> = {
      twitter: 280,
      facebook: 63206,
      instagram: 2200,
      linkedin: 3000,
      tiktok: 2200
    };

    return limits[platform.toLowerCase()] || 2000;
  }

  /**
   * Retorna sugestões fallback em caso de erro
   */
  private getFallbackSuggestions(platform: string): string[] {
    return [
      `✨ Compartilhe sua experiência com nossos produtos! O que você achou? 💬 #Experiência #Feedback`,
      `🚀 Descubra como podemos ajudar você a alcançar seus objetivos! Clique no link da bio 📲 #Transformação #Sucesso`,
      `💡 Dica do dia: Pequenas ações diárias levam a grandes resultados! Qual é a sua meta de hoje? 🎯 #Motivação #Crescimento`,
      `🎉 Novidades chegando! Fique atento às nossas próximas atualizações 📢 #Novidades #EmBreve`,
      `❤️ Obrigado por fazer parte da nossa comunidade! Seu apoio significa tudo para nós 🙏 #Gratidão #Comunidade`
    ];
  }
}

export const aiContentService = new AIContentService();
