# Automation Global v4.0 Compressed

## Overview
Automation Global is an enterprise-grade AI automation platform designed to streamline business operations through intelligent automation across marketing, support, and trading domains. It operates on a multi-tenant SaaS architecture, providing customizable and scalable AI-powered modules. The platform integrates advanced AI capabilities from multiple providers (OpenAI, Anthropic) with a comprehensive automation engine, enabling businesses to create sophisticated workflows that combine human oversight with AI efficiency. Built with modern web technologies, it supports multiple organizations with role-based access control and detailed usage tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## Design System - Multi-Tenant Architecture

### Admin Platform Design (Futuristic Neon)
O sistema administrativo principal mantém o design futurístico baseado na referência visual do Freepik (elementos UI futurísticos com fundo escuro e efeitos neon azul/ciano), criando uma experiência imersiva e tecnológica.

### Organization-Specific Design Systems
Cada tipo de organização possui seu próprio design system personalizado:

#### Marketing Organizations - 3D Glass Morphism Design System (Registrado 02/09/2025)
**Classes CSS Base:**
- **`.glass-3d`**: Cards principais com backdrop-filter: blur(20px), box-shadow multicamada
- **`.glass-3d-dark`**: Variação para tema escuro com rgba(0,0,0,0.2)
- **`.glass-3d-light`**: Variação para tema claro com rgba(255,255,255,0.15)
- **`.glass-button-3d`**: Botões interativos com hover effects e transformações
- **`.gradient-purple-blue`**: Gradiente oficial (#8B5CF6 → #3B82F6)
- **`.circular-progress-3d`**: Indicadores circulares com conic-gradient
- **`.marketing-gradient-bg`**: Background com radial gradients e fallback

**Especificações Técnicas:**
- **Bordas:** border-radius: 20px para cards, 16px para botões
- **Blur:** backdrop-filter: blur(20px) cards, blur(15px) botões
- **Sombras:** Multicamada com rgba(0,0,0,0.4) + rgba(0,0,0,0.3)
- **Hover:** translateY(-8px) scale(1.02) para cards, translateY(-2px) scale(1.02) botões
- **Transições:** cubic-bezier(0.4, 0, 0.2, 1) para suavidade
- **Cores:** Gradientes roxo/azul, bordas rgba(255,255,255,0.1)

**Componentes Implementados:**
- Cards glassmorphism com efeitos 3D profundos
- Botões interativos clean com micro-interações
- Indicadores circulares com gradientes
- Sistema de temas configurável (dark/light)
- Layout grid responsivo moderno
- **Status:** Implementado e testado em MarketingDashboard3D.tsx

#### Future Organization Types (Planejado)
- **Support Organizations:** Será implementado design específico diferente
- **Trading Organizations:** Será implementado design específico diferente

### Design System Architecture Rules
1. **Admin Platform:** SEMPRE usar design futurístico neon/matrix existente
2. **Marketing Organizations:** SEMPRE usar design 3D glass morphism
3. **Outras Organizações:** Cada tipo terá seu design único específico
4. **Isolamento:** Designs não se misturam entre tipos de organização
5. **Consistência:** Dentro do mesmo tipo, todas orgs usam mesmo design

### Color Palette
**Primary Background Colors:**
- Base: `#0a0e1a` (azul escuro profundo)
- Secondary: `#0f172a` (azul escuro médio)
- Accent: `#1e293b` (azul escuro claro)

**Neon Colors:**
- Primary Cyan: `#00f5ff` (ciano brilhante)
- Secondary Blue: `#007bff` (azul médio)
- Accent Purple: `#8b5cf6` (roxo vibrante)
- Success Green: `#10b981` (verde esmeralda)

**Text Colors:**
- Primary: `#ffffff` (branco puro)
- Secondary: `#e2e8f0` (cinza claro)
- Muted: `#64748b` (cinza médio)

### Background System
**Matrix Grid Effect:**
- Grid futurístico com linhas neon ciano/azul
- Gradientes radiais sutis para profundidade
- Animações de pulse e scan
- Efeitos diagonais para dinamismo

**Implementation:**
```css
.matrix-grid {
  background: radial gradients + linear gradients
  position: relative
  overflow: hidden
}
```

### Component Styles

**Glass Morphism:**
- `.glass-card`: Cards principais com blur e transparência
- `.glass`: Elementos secundários com menos opacidade
- `.glass-dark`: Containers de alta importância

**Neon Panels:**
- `.neon-panel`: Estilo padrão para todos os containers
- Bordas brilhantes com gradientes
- Sombras internas e externas
- Efeitos de profundidade com pseudo-elementos

**Progress Bars Futurísticas:**
- `.progress-bar-futuristic`: Container base
- `.progress-fill-cpu`: Preenchimento ciano
- `.progress-fill-memory`: Preenchimento roxo
- `.progress-fill-disk`: Preenchimento verde
- Animação de scanning futurístico

### Icon System
**Silver Neon Icons:**
- `.icon-silver-neon`: Ícones com brilho prateado
- Efeitos de drop-shadow múltiplos
- Hover com scale e intensificação
- Estados ativos com cor ciano

**Icon Containers:**
- `.icon-container-futuristic`: Containers padronizados
- Gradientes metálicos
- Bordas iluminadas
- Estados de navegação ativa

### Typography
**Font Stack:** 'Inter', 'Orbitron', system-ui, sans-serif
**Text Effects:**
- `.gradient-text`: Gradientes ciano para roxo
- Tracking amplo para títulos (tracking-wider)
- Uppercase para labels importantes

### Animation System
**Keyframes Principais:**
- `grid-pulse`: Pulsação do grid de fundo (6s)
- `diagonal-pulse`: Efeitos diagonais (8s)
- `sidebar-pulse`: Borda lateral da sidebar (3s)
- `progress-scan`: Scanning das barras de progresso (2s)
- `ai-pulse`: Pulsação para elementos IA

### Sidebar Design
**Estrutura:**
- `.sidebar-glow`: Gradientes verticais complexos
- Borda direita neon pulsante
- Backdrop blur intenso
- Sombras de profundidade

### Interactive Elements
**Buttons:**
- `.btn-glow`: Botões com efeito neon
- Estados hover com transformações
- Transições suaves (0.3s ease)

**Cards:**
- `.card-hover`: Efeitos de hover padronizados
- Elevação e brilho intensificado
- Transformações sutis (translateY)

### Layout Principles
1. **Hierarquia Visual:** Uso de brilho e opacidade para importância
2. **Profundidade:** Camadas com blur e sombras
3. **Movimento:** Animações sutis e transições fluidas
4. **Contraste:** Texto claro sobre fundos escuros
5. **Consistência:** Padrões repetidos em todos os componentes

### Usage Guidelines
- **Sempre** usar `.neon-panel` para containers principais
- **Sempre** aplicar `.icon-silver-neon` em ícones
- **Sempre** usar `.glass-card` para cards de conteúdo
- **Sempre** incluir efeitos de hover e transições
- **Sempre** manter a hierarquia de cores neon

### Technical Implementation
- CSS Variables para cores consistentes
- Backdrop-filter para efeitos de blur
- Multiple box-shadows para profundidade
- Linear-gradients para efeitos metálicos
- Transform e filter para interatividade

Este design system garante uma experiência visual coesa e futurística em toda a plataforma, mantendo a identidade tecnológica avançada da Automation Global v4.0.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript, using a component-based architecture with shadcn/ui for design consistency. It leverages Vite for fast development, TailwindCSS for styling, and TanStack Query for server state management. The design supports responsive layouts with a mobile-first approach and includes accessibility features via Radix UI primitives.

### Backend Architecture
The server is implemented using Express.js with TypeScript, following a modular service-oriented architecture. It includes distinct service modules for authentication, organizations, AI operations, and automation management. Authentication uses JWT tokens with refresh token rotation and supports multi-tenant access control through organization-based isolation and role-based permissions. The AI service layer abstracts multiple AI providers (OpenAI, Anthropic) with fallback mechanisms and usage tracking for cost optimization and availability.

### Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe operations. It implements a multi-tenant architecture with row-level security (RLS) policies to ensure data isolation. Core entities include users, organizations, and memberships with RBAC. The schema supports horizontal scaling through organization-based partitioning and includes audit trails.

### **REGRA OBRIGATÓRIA - SEMPRE USAR DRIZZLE ORM** ⚠️
**CRITICAL REQUIREMENT: SEMPRE usar Drizzle ORM para qualquer operação de banco de dados**

**Database Operations Policy:**
- ✅ **SEMPRE** usar Drizzle ORM para conexão com banco de dados
- ✅ **SEMPRE** usar Drizzle ORM para criar tabelas e colunas
- ✅ **SEMPRE** usar Drizzle ORM para todos os serviços de CRUD
- ✅ **SEMPRE** definir schemas em `shared/schema.ts` como fonte única da verdade
- ❌ **NUNCA** usar SQL direto via `db.execute()` ou queries raw
- ❌ **NUNCA** usar outros ORMs ou bibliotecas de banco
- ❌ **NUNCA** criar tabelas manualmente via SQL

**Padrão de Implementação:**
1. **Schema Definition**: Definir todas as tabelas em `shared/schema.ts`
2. **Type Safety**: Usar tipos TypeScript gerados pelo Drizzle
3. **Operations**: Usar `db.select()`, `db.insert()`, `db.update()`, `db.delete()`
4. **Migrations**: Usar `npm run db:push` para sincronizar schema
5. **Consistency**: Drizzle garante consistência entre desenvolvimento e produção

**Benefícios Garantidos:**
- Type safety completa
- Migrations automáticas
- Consistência de dados
- Performance otimizada
- Debugging simplificado

### Authentication & Authorization
Multi-layered security is implemented with JWT-based authentication supporting organization context switching. It enforces role-based access control (RBAC) across 6 permission levels. Session management includes token refresh and secure cookie handling. Organization isolation is enforced at both application and database levels.

### Rate Limiting & API Protection (Task 2.5 - COMPLETED)
Hierarchical rate limiting system with role-based limits (super_admin: 1000/15min, org_admin: 500/15min, org_user: 100/15min, org_viewer: 50/15min, public: 10/15min, guest: 5/15min). Uses sliding window algorithm with Redis primary storage and automatic in-memory fallback. Provides informative HTTP headers (X-RateLimit-*) and sub-10ms response times. All endpoints protected with middleware integration.

### Logging & Monitoring System (Task 2.6 - COMPLETED ✅)
**Testado em 30/08/2025 - 100% Funcional**
Comprehensive structured logging with JSON format, unique request IDs, and metadata tracking. Multi-service health checks for database, Redis, filesystem, memory, and CPU. Real-time performance monitoring with slow request alerts (>1s). Request/response logging with user context and automatic metrics collection. Health endpoints: /api/health (full check), /api/health/ready (readiness), /api/health/live (liveness), /api/health/metrics (system metrics). **TESTE COMPLETO REALIZADO**: Sistema detecta corretamente problemas de conectividade, executa fallbacks automáticos (Redis→in-memory), gera alertas de resources críticos (97.1% memory usage), logs estruturados com tracking único funcionando perfeitamente. Documentação completa em TESTE_MONITORAMENTO_TASK_2.6.md.

### Automation Engine Architecture
The automation system is built around a flexible workflow engine that supports complex business logic via configurable steps, triggers, and actions. Automations can be scheduled, event-triggered, or on-demand, and include retry mechanisms, error handling, and detailed execution logging. It integrates with external services through a standardized framework.

## External Dependencies

### AI Service Providers
- **OpenAI API**: Primary AI provider (GPT-5) for text generation, analysis, and automation.
- **Anthropic API**: Secondary AI provider (Claude Sonnet 4) for fallback and specialized reasoning.

### Database & Infrastructure
- **Supabase PostgreSQL**: Primary serverless database with Drizzle ORM integration.
- **Drizzle ORM**: Type-safe database client.
- **Redis**: Rate limiting and caching (with in-memory fallback).
- **IORedis**: Redis client with connection pooling.

### Authentication & Session Management
- **JWT**: Token-based authentication.
- **bcrypt**: Password hashing.

### Frontend Dependencies
- **React 18**: UI framework.
- **TanStack Query**: Server state management.
- **Radix UI**: Accessible component primitives.
- **TailwindCSS**: Utility-first CSS framework.
- **Vite**: Build tool and development server.

### Development & Build Tools
- **TypeScript**: Static typing.
- **ESBuild**: JavaScript bundler.
- **PostCSS**: CSS processing.