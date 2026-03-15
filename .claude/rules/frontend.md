---
paths:
  - 'apps/career/**'
  - 'apps/plan/**'
  - 'packages/ui/**'
  - 'packages/api-client/**'
  - 'packages/config/**'
---

# Frontend Code Style

## File Naming

- Components: `UpperCamelCase.tsx` (e.g., `Button.tsx`, `SignupHeader.tsx`)
- Utilities: `lowerCamelCase.ts` (e.g., `utils.ts`, `auth-store.ts`)
- Constants: `constants.ts`
- Types: `types.ts`
- Schemas: `schema.ts`
- Pages: `page.tsx` (Next.js App Router)

## Import Order

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

## Formatting (Prettier)

- Single quotes, no semicolons, ES5 trailing commas, 100 char width
- Runs automatically on pre-commit via lint-staged

## TypeScript

- Strict mode enabled, no implicit `any`, strict null checks
- Prefer interfaces for component props, type for unions/intersections
- Path aliases: `@/*` → `src/*`, `@morton/ui`, `@morton/api-client`, `@morton/config`

## Component Patterns

```typescript
'use client' // Only when needed (hooks, events, browser APIs)

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* Content */}
    </div>
  )
}
```

- Use `React.forwardRef` for input components
- Use `cn()` utility for class merging (`clsx` + `tailwind-merge`)

## Styling

- Tailwind CSS v4 for all styling
- No CSS modules or styled-components
- Use `class-variance-authority` (cva) for component variants

## State Management

- **Server state**: React Query (via generated hooks from `@morton/api-client`)
- **Client state**: Zustand stores (e.g., `auth-store.ts`, `signup-store.ts`)
- **Form state**: react-hook-form + Zod validation

## Error Handling

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
// Form validation errors via Zod + react-hook-form
```

## Naming Conventions

- **Variables/Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Components/Types/Interfaces**: `PascalCase`
- **Boolean props**: Prefix with `is`, `has`, `can`, `should`
- **Unused variables**: Prefix with `_`

## API Client Usage

```typescript
import { useGetUserQuery, useUpdateUserMutation } from '@morton/api-client'

const { data, isLoading, error } = useGetUserQuery({ userId: '123' })
const { mutate, isPending } = useUpdateUserMutation()
```

## Environment Variables

- Validate with Zod at runtime (see `packages/config/env`)
- Use `NEXT_PUBLIC_*` prefix for client-accessible vars
- Define schema in `src/env.ts` per app
