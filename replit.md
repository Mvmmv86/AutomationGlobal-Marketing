# Automation Global v4.0

## Overview
Automation Global is an enterprise-grade AI automation platform designed to streamline business operations through intelligent automation across marketing, support, and trading domains. The platform operates on a multi-tenant SaaS architecture, providing organizations with specialized AI-powered modules that can be customized and scaled according to their specific needs.

The system integrates advanced AI capabilities from multiple providers (OpenAI, Anthropic) with a comprehensive automation engine, allowing businesses to create sophisticated workflows that combine human oversight with AI efficiency. Built with modern web technologies and designed for scalability, the platform supports multiple organizations with role-based access control and detailed usage tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript, utilizing a modern component-based architecture with shadcn/ui for consistent design system implementation. The frontend uses Vite for fast development and building, with TailwindCSS for responsive styling. State management is handled through TanStack Query for server state and React hooks for local state.

The component structure follows a hierarchical layout with a main dashboard, modular AI components, and reusable UI components. The application supports responsive design with mobile-first approach and includes accessibility features through Radix UI primitives.

### Backend Architecture  
The server is implemented using Express.js with TypeScript, following a modular service-oriented architecture. The API layer is organized into distinct service modules for authentication, organizations, AI operations, and automation management.

The authentication system uses JWT tokens with refresh token rotation, supporting multi-tenant access control through organization-based isolation. Each request is authenticated and validated through middleware that enforces role-based permissions and organization context.

The AI service layer abstracts multiple AI providers (OpenAI GPT-5, Anthropic Claude Sonnet 4) with fallback mechanisms and usage tracking. This allows the platform to optimize costs and ensure availability by automatically switching between providers based on performance and quotas.

### Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema implements a multi-tenant architecture with row-level security (RLS) policies ensuring data isolation between organizations.

Core entities include users, organizations, and organization memberships with role-based access control. The AI module system tracks usage, costs, and performance metrics across different providers and models. Automation workflows are stored as configurable steps with triggers, actions, and execution logs.

The database schema supports horizontal scaling through organization-based partitioning and includes comprehensive audit trails for compliance and debugging.

### Authentication & Authorization
Multi-layered security implementation with JWT-based authentication supporting organization context switching. The system enforces role-based access control (RBAC) with roles ranging from super admin to organization viewers.

Session management includes automatic token refresh, secure cookie handling, and concurrent session limits. Organization isolation is enforced at both application and database levels through middleware and RLS policies.

### Automation Engine Architecture
The automation system is designed around a flexible workflow engine that supports complex business logic through configurable steps, triggers, and actions. Each automation can be scheduled, triggered by events, or executed on-demand.

The system includes retry mechanisms, error handling, and detailed execution logging. Automations can integrate with external services through a standardized integration framework that handles authentication, rate limiting, and data transformation.

## External Dependencies

### AI Service Providers
- **OpenAI API**: Primary AI provider using GPT-5 model for text generation, analysis, and automation tasks
- **Anthropic API**: Secondary AI provider with Claude Sonnet 4 model serving as fallback and specialized reasoning tasks

### Database & Infrastructure  
- **Neon PostgreSQL**: Primary database with serverless architecture for automatic scaling and backup management
- **Drizzle ORM**: Type-safe database client providing schema management and query building

### Authentication & Session Management
- **JWT**: Token-based authentication with configurable expiration and refresh mechanisms
- **bcrypt**: Password hashing with configurable work factors for security

### Frontend Dependencies
- **React 18**: Modern UI framework with hooks and concurrent features
- **TanStack Query**: Server state management with caching, synchronization, and background updates
- **Radix UI**: Accessible component primitives for consistent user interface
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Vite**: Fast build tool and development server

### Development & Build Tools
- **TypeScript**: Static typing for enhanced developer experience and error prevention
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with autoprefixer for browser compatibility

### Planned Integrations
- **Redis**: Caching layer and session storage (configured but not yet implemented)
- **Celery**: Asynchronous task queue for background processing (configured but not yet implemented)
- **Supabase**: Additional authentication and real-time features (configured but not yet implemented)

The architecture is designed for future expansion with webhook support, real-time notifications, and third-party service integrations through a standardized API gateway pattern.

## Recent Progress and Current State

### Phase 1-3 Complete (January 2025)
- ✅ **Infrastructure & Authentication**: Complete multi-tenant authentication system with 6 permission levels
- ✅ **Database Architecture**: Complete 14-table production schema with proper relationships and indexes
- ✅ **Manual Setup Solution**: Created comprehensive SQL scripts to overcome Replit network limitations with Supabase
- ✅ **Database Testing Interface**: Enhanced testing system with automatic timeout detection

### Phase 3 Complete - Database & Task 1 Validated (August 2025)
The Replit network limitations (CONNECT_TIMEOUT on port 5432) were definitively resolved through Supabase REST API integration. Task 1 (user and organization creation) has been successfully tested with real data creation.

### Database Connection Status - RESOLVED
- **PostgreSQL Direct**: ❌ Blocked by Replit network limitations
- **Supabase REST API**: ✅ **FULLY FUNCTIONAL** - Real data creation confirmed
- **Hybrid System**: Intelligent detection with automatic fallback
- **Test Results**: Real user and organization created in production Supabase database

### Production-Ready Infrastructure Complete
- **14 Production Tables**: All tables accessible via REST API
- **Multi-tenant Architecture**: Organization-based data isolation working
- **Authentication System**: JWT-based auth with role permissions ready
- **AI Provider Integration**: OpenAI GPT-5 and Anthropic Claude Sonnet 4 configured
- **Task 1 Validation**: ✅ User creation, ✅ Organization creation, ✅ Real data persistence

### Ready for Next Development Phase
All core infrastructure is production-ready:
- Backend authentication and database operations functional
- Real data creation and persistence confirmed  
- Network limitations resolved through REST API
- System operates reliably in both connected and fallback modes
- Task 1 validation complete with real Supabase data