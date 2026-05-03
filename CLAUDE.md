# BConnect

BConnect is a job matching platform (업체-기술자 연결 구인구직 플랫폼) built as a pnpm monorepo with Next.js apps and Spring Boot backend.

## Architecture

- `apps/career` - Worker PWA (Next.js App Router)
- `apps/plan` - Contractor web app (Next.js App Router)
- `apps/crawler` - 기술자 크롤러 (Python, uv)
- `apps/api` - Spring Boot backend (separate Gradle build)
- `packages/ui` - Shared UI components with Tailwind v4
- `packages/api-client` - Generated API client (orval + react-query)
- `packages/config` - Shared configs (ESLint, TypeScript, env, phone)

### Key Patterns

- **API contract envelope**: 모든 API 응답 `{ success, data/error }` 형식 (BE 측 enforce, FE 측 customFetch 자동 unwrap)
- **Generated API client**: `packages/api-client/generated/`는 orval 자동 생성, 직접 수정 금지. spec 수정 → `pnpm api:generate` 재생성
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Data formats**: 공통 데이터 (phone, address 등)는 `@morton/config/*` 유틸 통일 사용. 직접 string parsing 금지
- **Env vars**: `@morton/config/env`의 Zod 검증된 `env` 객체 사용. `process.env.X` 직접 접근 금지

## Workflow & Processes

- @docs/GIT_WORKFLOW.md
- @docs/TEAM.md — Team roles, GitHub/Notion mapping
- @docs/DEVELOPMENT_WORKFLOW.md — API spec, API client generation, Mock API (MSW)
- @docs/QA_AND_TESTING.md — QA process, test coverage, bug classification
- @docs/DEPLOYMENT.md — Deployment environments, process, infrastructure
