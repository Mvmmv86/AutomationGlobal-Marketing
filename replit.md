# Automation Global v4.0 Compressed

## Overview
Automation Global is an enterprise-grade AI automation platform designed to streamline business operations through intelligent automation across marketing, support, and trading domains. It operates on a multi-tenant SaaS architecture, providing customizable and scalable AI-powered modules. The platform integrates advanced AI capabilities from multiple providers (OpenAI, Anthropic) with a comprehensive automation engine, enabling businesses to create sophisticated workflows that combine human oversight with AI efficiency. Built with modern web technologies, it supports multiple organizations with role-based access control and detailed usage tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript, using a component-based architecture with shadcn/ui for design consistency. It leverages Vite for fast development, TailwindCSS for styling, and TanStack Query for server state management. The design supports responsive layouts with a mobile-first approach and includes accessibility features via Radix UI primitives.

### Backend Architecture
The server is implemented using Express.js with TypeScript, following a modular service-oriented architecture. It includes distinct service modules for authentication, organizations, AI operations, and automation management. Authentication uses JWT tokens with refresh token rotation and supports multi-tenant access control through organization-based isolation and role-based permissions. The AI service layer abstracts multiple AI providers (OpenAI, Anthropic) with fallback mechanisms and usage tracking for cost optimization and availability.

### Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe operations. It implements a multi-tenant architecture with row-level security (RLS) policies to ensure data isolation. Core entities include users, organizations, and memberships with RBAC. The schema supports horizontal scaling through organization-based partitioning and includes audit trails.

### Authentication & Authorization
Multi-layered security is implemented with JWT-based authentication supporting organization context switching. It enforces role-based access control (RBAC) across 6 permission levels. Session management includes token refresh and secure cookie handling. Organization isolation is enforced at both application and database levels.

### Automation Engine Architecture
The automation system is built around a flexible workflow engine that supports complex business logic via configurable steps, triggers, and actions. Automations can be scheduled, event-triggered, or on-demand, and include retry mechanisms, error handling, and detailed execution logging. It integrates with external services through a standardized framework.

## External Dependencies

### AI Service Providers
- **OpenAI API**: Primary AI provider (GPT-5) for text generation, analysis, and automation.
- **Anthropic API**: Secondary AI provider (Claude Sonnet 4) for fallback and specialized reasoning.

### Database & Infrastructure
- **Neon PostgreSQL**: Primary serverless database.
- **Drizzle ORM**: Type-safe database client.

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