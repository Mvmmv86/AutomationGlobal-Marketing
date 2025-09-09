import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, Calendar, Building } from 'lucide-react';

interface Article {
  title: string;
  description: string;
  source: { name: string };
  publishedAt: string;
  content: string;
  url: string;
}

interface TrendsResponse {
  success: boolean;
  articlesFound: number;
  articles: Article[];
  realNewsCount?: number;
  message: string;
  sources?: string[];
  fallback?: boolean;
}

export default function TrendsTest() {
  const [keyword, setKeyword] = useState('artificial intelligence');
  
  const trendsRealMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await fetch(`/api/news/trends-real?keyword=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      return result.data as TrendsResponse;
    }
  });

  const trendsAiMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await fetch(`/api/news/trends-ai?keyword=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      return result.data as TrendsResponse;
    }
  });

  const handleSearch = (useReal: boolean) => {
    if (useReal) {
      trendsRealMutation.mutate(keyword);
    } else {
      trendsAiMutation.mutate(keyword);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderResults = (data: TrendsResponse | undefined, title: string) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {data.fallback && <Badge variant="secondary">Fallback IA</Badge>}
          {data.realNewsCount !== undefined && (
            <Badge variant="outline">{data.realNewsCount} notícias reais</Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {data.message}
        </div>

        {data.sources && data.sources.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Fontes encontradas:</p>
            <div className="flex flex-wrap gap-2">
              {data.sources.map((source, index) => (
                <Badge key={index} variant="outline">{source}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {data.articles.map((article, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg leading-tight">
                    {article.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                    <Building className="h-4 w-4" />
                    <span>{article.source?.name || 'Unknown'}</span>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {article.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">
                    {article.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                    {article.url && (
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver original
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {data.articles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum trend encontrado para "{keyword}"
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Teste de Trending Analysis
            </CardTitle>
            <CardDescription>
              Teste o sistema de análise de trends mundiais com NewsAPI + IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma palavra-chave (ex: artificial intelligence)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(true)}
                className="flex-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSearch(true)}
                disabled={trendsRealMutation.isPending || !keyword.trim()}
                className="flex-1"
              >
                {trendsRealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                🌍 Sistema Híbrido (NewsAPI + IA)
              </Button>
              
              <Button 
                onClick={() => handleSearch(false)}
                disabled={trendsAiMutation.isPending || !keyword.trim()}
                variant="outline"
                className="flex-1"
              >
                {trendsAiMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                🤖 Apenas IA
              </Button>
            </div>
          </CardContent>
        </Card>

        {trendsRealMutation.data && (
          <Card>
            <CardContent className="p-6">
              {renderResults(trendsRealMutation.data, "🌍 Resultado Sistema Híbrido")}
            </CardContent>
          </Card>
        )}

        {trendsAiMutation.data && (
          <Card>
            <CardContent className="p-6">
              {renderResults(trendsAiMutation.data, "🤖 Resultado IA Pura")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}