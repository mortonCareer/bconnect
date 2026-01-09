# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morton is a job matching platform connecting contractors and skilled workers (업체-기술자 연결 구인구직 플랫폼). It's a pnpm monorepo with Next.js frontend apps and a Spring Boot backend (separately managed).

## Commands

```bash
# Development
pnpm dev              # Run both career and plan apps
pnpm dev:career       # Run career app only (port 3000)
pnpm dev:plan         # Run plan app only (port 3001)

# Build
pnpm build            # Build all apps
pnpm build:career     # Build career app only
pnpm build:plan       # Build plan app only

# Lint & Format
pnpm lint             # ESLint all apps
pnpm lint:career      # ESLint career app
pnpm format           # Prettier format all
pnpm format:check     # Check formatting

# API Client Generation
pnpm api:generate     # Generate API client from OpenAPI spec (orval)
```

### Backend (apps/api - Spring Boot)

```bash
cd apps/api
./gradlew build       # Build
./gradlew test        # Run tests
```

## Architecture

### Monorepo Structure

- `apps/career` - Next.js PWA for workers: portfolio upload, job matching
- `apps/plan` - Next.js PWA for contractors: job posting, schedule management
- `apps/api` - Spring Boot backend (separately built with Gradle)
- `apps/mock-server` - Development mock API server
- `packages/ui` - Shared UI components with Tailwind CSS v4
- `packages/api-client` - Generated API client (orval + react-query)
- `packages/config` - Shared ESLint, TypeScript configs, env validation
- `infra/` - Terraform (AWS, Vercel, Railway)

### Key Patterns

**API Client (`@morton/api-client`)**

- Uses `ky` HTTP client with automatic token refresh
- Orval generates react-query hooks from OpenAPI spec
- Access token stored in memory, refresh token in httpOnly cookie
- All API responses wrapped in `{ success: boolean, data/error }` format

**State Management**

- Zustand for client state (auth-store pattern)
- React Query for server state (via generated hooks)

**Environment Variables**

- Validated at runtime using Zod (`@morton/config/env`)
- Validation skipped during build (`SKIP_ENV_VALIDATION=true`)
- `NEXT_PUBLIC_*` prefix for client-accessible vars

**Authentication Flow**

- Phone-based OTP login (phone → code → authenticated)
- Middleware checks `refreshToken` cookie for protected routes
- Public routes configured in `proxy.ts` (PUBLIC_EXACT, PUBLIC_PREFIX arrays)

### Infrastructure

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: PostgreSQL (Railway)
- **Storage**: AWS S3
- **Lambda**: AWS Lambda for background processing

## Conventions

- TypeScript strict mode
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Component files: `UpperCamelCase.tsx`
- Utility files: `lowerCamelCase.ts`
- Husky + lint-staged for pre-commit checks
