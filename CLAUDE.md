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
- **Generated API client**: `packages/api-client/src/generated/`는 orval 자동 생성, 직접 수정 금지. spec 수정 → `pnpm api:generate` 재생성
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Data formats**: 공통 데이터 (phone, address 등)는 `@bconnect/config/*` 유틸 통일 사용. 직접 string parsing 금지
- **Env vars**: `@bconnect/config/env`의 Zod 검증된 `env` 객체 사용. `process.env.X` 직접 접근 금지
- **Navigation**: 클릭으로 화면 이동은 `next/link`의 `<Link>` (버튼이면 `<Button asChild>`) 사용. **클릭 핸들러(`onClick` 등)에서 `router.push`/`router.replace` 금지** — prefetch·새 탭·키보드·SSR 친화. ESLint `no-restricted-syntax`가 CI에서 차단. 폼 제출 후 리다이렉트 등 불가피한 imperative 만 `router.push` 허용(핸들러 함수 내부, 필요 시 `eslint-disable` + 사유). `router.back()`은 선언적 등가가 없어 허용

## Workflow & Processes

- @docs/how-to/git-workflow.md
- @docs/reference/team.md — Team roles, GitHub/Notion mapping
- @docs/how-to/development-workflow.md — API spec, API client generation, Mock API (MSW)
- @docs/how-to/qa-and-testing.md — QA process, test coverage, bug classification
- @docs/how-to/deployment.md — Deployment environments, process, infrastructure
- @docs/how-to/write-docs.md — 문서 작성 룰 (Diátaxis 4분할, ADR 가이드)
- @docs/explanation/adr/README.md — Architecture Decision Records 인덱스
