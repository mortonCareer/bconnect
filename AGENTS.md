# AGENTS.md

Guide for coding agents working in the Morton codebase.

## Project Overview

Morton is a job matching platform (업체-기술자 연결 구인구직 플랫폼) built as a pnpm monorepo with Next.js apps and Spring Boot backend.

## Commands

### Development

```bash
pnpm dev              # Run both career and plan apps
pnpm dev:career       # Run career app (port 3000)
pnpm dev:plan         # Run plan app (port 3001)
```

### Build

```bash
pnpm build            # Build all Next.js apps
pnpm build:career     # Build career app
pnpm build:plan       # Build plan app

# Backend (Spring Boot)
cd apps/api && ./gradlew build
```

### Lint & Format

```bash
pnpm lint             # ESLint all apps
pnpm lint:career      # ESLint career app only
pnpm lint:plan        # ESLint plan app only
pnpm format           # Prettier format all
pnpm format:check     # Check formatting without changes
```

### Testing

```bash
# Backend only (no frontend tests configured)
cd apps/api && ./gradlew test              # Run all tests
cd apps/api && ./gradlew test --tests ClassName  # Run single test class
cd apps/api && ./gradlew test --tests ClassName.testMethodName  # Run single test
```

**For QA processes and testing guidelines, see [docs/QA_AND_TESTING.md](./docs/QA_AND_TESTING.md)**

### API Client

```bash
pnpm api:generate     # Generate API client from OpenAPI spec (orval)
```

## Code Style Guidelines

### File Naming

- Components: `UpperCamelCase.tsx` (e.g., `Button.tsx`, `SignupHeader.tsx`)
- Utilities: `lowerCamelCase.ts` (e.g., `utils.ts`, `auth-store.ts`)
- Constants: `constants.ts`
- Types: `types.ts`
- Schemas: `schema.ts`
- Pages: `page.tsx` (Next.js App Router)

### Import Order

```typescript
// 1. External dependencies
import * as React from 'react'
import { useForm } from 'react-hook-form'

// 2. Internal packages
import { Button } from '@morton/ui/components/ui/Button'
import { api } from '@morton/api-client'

// 3. Relative imports (grouped by type)
import { cn } from '@/lib/utils'
import { profileSchema } from './schema'
import type { ProfileFormData } from './types'
```

### Formatting (Prettier)

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- Runs automatically on pre-commit via lint-staged
- Use single quotes for strings
- No semicolons
- ES5 trailing commas (objects, arrays, but not function params)
- 100 character line width

### TypeScript

#### Strict Mode

- All projects use TypeScript strict mode
- No implicit `any` - explicitly type everything
- Strict null checks enabled

#### Type Definitions

```typescript
// Prefer interfaces for component props
interface ButtonProps {
  /** JSDoc for public APIs */
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// Use type for unions/intersections
type ApiResponse<T> = { success: true; data: T } | { success: false; error: ErrorData }
```

#### Path Aliases

- `@/*` maps to `src/*` in each app
- `@morton/ui`, `@morton/api-client`, `@morton/config` for packages

### Component Patterns

#### React Components

```typescript
'use client' // Only when needed (hooks, events, browser APIs)

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  // ... other props
}

/**
 * Korean description
 * English description
 */
export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* Content */}
    </div>
  )
}
```

#### forwardRef for Input Components

```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn('...', className)} {...props} />
  }
)
Input.displayName = 'Input'
```

### Styling

- Tailwind CSS v4 for all styling
- Use `cn()` utility to merge classes (from `clsx` + `tailwind-merge`)
- No CSS modules or styled-components
- Prefer inline Tailwind classes
- Use `class-variance-authority` (cva) for component variants

### State Management

- **Server state**: React Query (via generated hooks from `@morton/api-client`)
- **Client state**: Zustand stores (e.g., `auth-store.ts`, `signup-store.ts`)
- **Form state**: react-hook-form + Zod validation

### Error Handling

#### Frontend

```typescript
// API errors throw custom ApiError class
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// React Query handles API errors automatically
const { data, error } = useGetUserQuery()
if (error) {
  // Handle ApiError
}

// Form validation errors via Zod + react-hook-form
const { errors } = useForm({
  resolver: zodResolver(schema),
})
```

#### Backend (Java)

```java
// Throw custom exceptions
throw new CodeException(ExceptionCode.USER_NOT_FOUND);

// Global handler formats response
@RestControllerAdvice
public class ApiControllerAdvice {
  // Logs 5xx as error, 4xx as warn
  @ExceptionHandler(CodeException.class)
  public ResponseEntity<ApiResponse<Void>> handleCodeException(CodeException e) {
    // ...
  }
}
```

### Naming Conventions

- **Variables**: `camelCase` (e.g., `userData`, `isLoading`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_URL`, `MAX_RETRIES`)
- **Functions**: `camelCase` (e.g., `getUserProfile`, `handleSubmit`)
- **Components**: `PascalCase` (e.g., `Button`, `SignupForm`)
- **Types/Interfaces**: `PascalCase` (e.g., `User`, `ApiResponse<T>`)
- **Boolean props**: Prefix with `is`, `has`, `can`, `should` (e.g., `isLoading`, `hasError`)
- **Unused variables**: Prefix with `_` (e.g., `_unused`)

### API Client Usage

```typescript
// Import generated hooks
import { useGetUserQuery, useUpdateUserMutation } from '@morton/api-client'

// Query data
const { data, isLoading, error } = useGetUserQuery({ userId: '123' })

// Mutate data
const { mutate, isPending } = useUpdateUserMutation()
mutate({ userId: '123', name: 'John' })

// Response is automatically unwrapped from ApiResponse<T>
// Errors throw ApiError with code and message
```

### Environment Variables

- Validate with Zod at runtime (see `packages/config/env`)
- Use `NEXT_PUBLIC_*` prefix for client-accessible vars
- Define schema in `src/env.ts` per app
- Validation skipped during build (SKIP_ENV_VALIDATION=true)

## Workflow & Processes

For detailed process guides, see the `docs/` directory:

- **[Team](./docs/TEAM.md)** - Team roles, GitHub/Notion mapping, collaboration process
- **[Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md)** - API spec, API client generation, Mock API (MSW)
- **[Git Workflow](./docs/GIT_WORKFLOW.md)** - Issue-based development, branch strategy, commit conventions, PR process
- **[QA & Testing](./docs/QA_AND_TESTING.md)** - QA process, test coverage, bug classification
- **[Deployment](./docs/DEPLOYMENT.md)** - Deployment environments, process, infrastructure

### Available Skills

Skills automate common workflows and ensure consistency. Located in `.claude/skills/`:

**Git Workflow (5 skills):**

- `issue-management` - GitHub Issue 생성 및 관리, 레이블 자동 적용, 담당자 할당
- `branch-from-issue` - 이슈 기반 브랜치 생성 (feature/#-description)
- `commit-convention` - Conventional Commits 검증 및 생성
- `pr-from-issue` - 이슈 기반 PR 생성, 리뷰어 자동 할당
- `notion-task-sync` - Notion 보드 동기화 (구현 예정)

**Figma Integration (3 skills):**

- `figma-to-component` - Figma → React 컴포넌트 자동 생성
- `figma-lint` - Figma 디자인 품질 검증
- `figma-sync` - Figma ↔ 코드베이스 동기화

**Environment (1 skill):**

- `env-config` - 환경 변수 관리 및 동기화

### Quick Reference: Commit Messages

Follow Conventional Commits:

```bash
feat: add user profile upload
fix: resolve token refresh loop
docs: update API client usage
chore: bump dependencies
refactor: extract form validation logic
```

### Pre-commit Hooks (Husky + lint-staged)

Automatically runs on `git commit`:

1. ESLint --fix on `*.{js,jsx,ts,tsx}`
2. Prettier --write on all files
3. Commitlint checks commit message format

## Architecture Notes

### Monorepo Structure

- `apps/career` - Worker PWA (Next.js 14 App Router)
- `apps/plan` - Contractor web app (Next.js 14 App Router)
- `apps/api` - Spring Boot backend (separate Gradle build)
- `packages/ui` - Shared UI components with Tailwind v4
- `packages/api-client` - Generated API client (orval + react-query)
- `packages/config` - Shared configs (ESLint, TypeScript, env, phone)

### Key Patterns

- **API Response Wrapper**: All responses are `{ success: boolean, data/error }`
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Route Protection**: Middleware checks `refreshToken` cookie
- **Public Routes**: Defined in `PUBLIC_EXACT` and `PUBLIC_PREFIX` arrays
