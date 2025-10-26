# AutomationGlobal Marketing Platform

Plataforma completa de automação de marketing com IA para geração de conteúdo, gestão de redes sociais e automação de blog posts.

## Funcionalidades Principais

### Automação de Conteúdo
- Geração automática de blog posts com IA (OpenAI GPT-4 e Anthropic Claude)
- Coleta de trending topics em tempo real
- Análise de notícias e artigos relevantes
- Geração de conteúdo otimizado para SEO

### Gestão de Redes Sociais
- Integração com Facebook e Instagram
- Agendamento de posts
- Análise de métricas e engajamento
- Dashboard unificado

### Sistema Multi-Tenant
- Gestão de múltiplas organizações
- Controle de permissões por usuário
- Módulos customizáveis por organização

### Inteligência Artificial
- Múltiplos provedores de IA (OpenAI, Anthropic)
- Sistema de fallback automático
- Controle de tokens e custos
- Logs de uso de IA

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Autenticação**: JWT + Sessions
- **Cache**: Redis (com fallback in-memory)
- **Filas**: Bull (com fallback in-memory)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Roteamento**: Wouter
- **State Management**: TanStack Query
- **Formulários**: React Hook Form + Zod

### APIs Externas
- OpenAI GPT-4
- Anthropic Claude
- News API
- Google Trends
- Facebook Graph API
- Instagram API

## Requisitos

- Node.js >= 18.0.0
- npm ou pnpm
- PostgreSQL (via Supabase)
- Redis (opcional - tem fallback)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Mvmmv86/AutomationGlobal-Marketing.git
cd AutomationGlobal-Marketing
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

4. Execute as migrações do banco:
```bash
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

## Variáveis de Ambiente

### Banco de Dados
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```

### Segurança
```env
JWT_SECRET=...
SESSION_SECRET=...
```

### IA
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_DEFAULT_MODEL=gpt-4
AI_FALLBACK_MODEL=claude-sonnet-4
```

### APIs Externas
```env
NEWS_API_KEY=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
```

### Opcional
```env
REDIS_URL=redis://localhost:6379
```

## Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor em produção
- `npm run check` - Verifica tipos TypeScript
- `npm run db:push` - Aplica migrações do banco

## Estrutura do Projeto

```
.
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
│
├── server/              # Backend Express
│   ├── blueprints/      # Rotas organizadas
│   ├── database/        # Schemas e migrações
│   ├── middleware/      # Middlewares Express
│   ├── services/        # Lógica de negócio
│   └── routes/          # Rotas HTTP
│
├── shared/              # Código compartilhado
│   └── schema.ts        # Schemas Zod
│
└── docs/                # Documentação adicional
```

## Arquitetura

### Multi-Tenant
O sistema suporta múltiplas organizações com isolamento de dados e permissões granulares.

### Sistema de IA
- Múltiplos provedores com fallback automático
- Controle de custos e limites de tokens
- Logs detalhados de uso

### Cache e Filas
- Redis para cache distribuído (com fallback in-memory)
- Bull para processamento assíncrono
- Rate limiting por organização

### Segurança
- Autenticação JWT
- Sessões seguras
- Criptografia de dados sensíveis
- Rate limiting
- Validação de inputs com Zod

## Módulos Principais

1. **Blog Automation** - Automação completa de blog posts
2. **Social Media Manager** - Gestão de redes sociais
3. **AI Content Generation** - Geração de conteúdo com IA
4. **Analytics Dashboard** - Métricas e análises
5. **Organization Management** - Gestão multi-tenant

## Integração com GlobalAutomation (Trading)

Este projeto é parte do ecossistema GlobalAutomation. Para integração com o sistema de trading:

- **Banco de dados compartilhado**: Schemas separados (`marketing.*` e `trading.*`)
- **Autenticação unificada**: Sistema de usuários compartilhado
- **APIs REST**: Comunicação entre plataformas

Repositório Trading: [GlobalAutomation](https://github.com/Mvmmv86/GlobalAutomation)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e proprietário.

## Autor

**Marcus Vinicius**
- GitHub: [@Mvmmv86](https://github.com/Mvmmv86)

## Roadmap

- [ ] Deploy em produção
- [ ] Integração completa com redes sociais
- [ ] Sistema de agendamento avançado
- [ ] Analytics em tempo real
- [ ] Mobile app (React Native)
- [ ] Integração com sistema de Trading
- [ ] Webhooks e automações customizadas
- [ ] API pública para desenvolvedores

## Suporte

Para suporte e dúvidas, abra uma issue no GitHub.

---

**Versão**: 4.0.0
**Status**: Em desenvolvimento
**Última atualização**: Outubro 2025
