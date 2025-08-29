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

### Task 1.4 Complete - Security & RLS Implementation (August 2025)
Row Level Security and multi-tenant isolation successfully implemented with comprehensive testing interface.

### Security Infrastructure Complete
- **RLS Policies**: 15+ organization isolation policies implemented
- **Role Hierarchy**: 6-level permission system (super_admin to viewer)
- **Security Functions**: 4 utility functions for access validation
- **Testing Interface**: `/security-test` page for policy validation
- **Documentation**: Complete security setup guide created

### Task 2.1 Complete - Backend Express.js Modular Architecture (August 2025)
Complete modular backend architecture successfully implemented and tested.

### Backend Architecture Complete
- **Modular Blueprints**: Authentication (/api/auth/*), Organizations (/api/organizations/*), and Test (/api/test/*) with structured endpoints
- **Middleware Stack**: Helmet security, CORS, compression, request validation (Zod), rate limiting, error handling
- **Error Handling**: Custom AppError class, centralized error handler, structured logging with request IDs
- **Validation System**: Zod schemas for request/query/params validation with detailed error responses
- **Rate Limiting**: Flexible rate limiter with Redis/memory fallback, adaptive limits per user type
- **Testing Interface**: Complete testing page at /backend-test for blueprint and middleware validation
- **Database Resilience**: Timeout handling and graceful fallbacks for Supabase connection issues

### Task 2.2 Complete - Supabase Connection Manager Implementation (August 2025)
Advanced connection management system successfully implemented to handle Replit network limitations.

### Connection Manager Architecture Complete
- **Supabase Connection Manager**: Retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- **Queue System**: Request queuing to prevent overload and ensure order
- **Health Checks**: Automatic connection monitoring and recovery
- **Hybrid Persistence**: Local storage guaranteed, Supabase sync when possible
- **API Endpoints**: `/api/supabase/health`, `/api/supabase/create-user`, `/api/supabase/create-organization`
- **Timeout Handling**: 25-second timeouts with intelligent retry logic
- **Error Classification**: Smart retry for network errors, immediate failure for validation errors

### Task 2.3 Complete - Drizzle ORM Direct Connection (August 2025)
Successfully bypassed Replit network limitations using Supabase Pooler on port 6543.

### Drizzle Connection Architecture Complete
- **Direct PostgreSQL Connection**: Using Supabase pooler (aws-1-us-east-1.pooler.supabase.com:6543)
- **ORM Integration**: Full Drizzle ORM with type-safe operations
- **Real Data Creation**: Successfully creating users and organizations in production Supabase
- **Connection String**: Utilizing SUPABASE_CONNECTION_STRING environment variable
- **API Endpoints**: `/api/drizzle/health`, `/api/drizzle/create-user`, `/api/drizzle/create-organization`
- **Schema Compliance**: Full compatibility with 14-table production schema
- **Performance**: 596ms response time for user creation with complete data persistence

### Task 2.4 Complete - Sistema de Autenticação Robusto (August 2025)
Advanced authentication system with JWT tokens, session management, and multiple auth providers successfully implemented.

### Authentication System Architecture Complete
- **JWT Token System**: Full JWT implementation with access and refresh tokens (1h + 7d expiration)
- **Auth Service**: Complete auth service with registration, login, password hashing, and token management
- **Auth Middleware**: Request authentication, role-based access, permission checking, and rate limiting
- **Multiple Auth Methods**: Supabase Auth integration with local fallback authentication
- **Auth Blueprints**: `/api/auth/v2/*` (Supabase Auth) and `/api/auth/local/*` (Local-only Auth)
- **Security Features**: bcrypt password hashing, token verification, session validation
- **API Endpoints**: Register, login, logout, refresh, user data, auth status, password reset
- **Frontend Integration**: Complete auth testing interface at `/auth-test`
- **Production Ready**: Real user creation and authentication confirmed with Supabase database

### Production Data Creation Confirmed
Real user and organization creation validated:
- **User Created**: `usuario@automation.global` (ID: 22a0831c-63f8-4d01-ab88-96a25f76e84b)
- **Organization Created**: `Empresa Teste` (ID: 2137301a-6588-4830-8fe3-bd1d6e1d3481)
- **Password Security**: bcrypt hashing with salt rounds
- **Data Integrity**: Proper timestamps, UUIDs, and validation

### Ready for Next Development Phase
All core infrastructure is production-ready:
- Backend authentication and database operations functional
- Real data creation and persistence confirmed  
- Network limitations resolved through Connection Manager
- Supabase Connection Manager handling timeouts gracefully
- Security policies applied and validated
- Modular backend architecture with comprehensive testing
- Testing interfaces permanently available at `/database-connection`, `/security-test`, `/backend-test`, and `/real-data-test`
- System operates reliably with full multi-tenant isolation and hybrid persistence