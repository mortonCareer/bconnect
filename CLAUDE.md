# BConnect

BConnect(품앗이)는 업체-기술자 연결 구인구직 플랫폼. pnpm 모노레포 — Next.js 앱들 + Spring Boot 백엔드.

## Architecture

- `apps/career` - 기술자 PWA (Next.js App Router)
- `apps/plan` - 업체/건축주 웹 (Next.js App Router)
- `apps/company` - 랜딩 허브 (bconnect.to — 업체/기술자 랜딩 + 원클릭 조회)
- `apps/crawler` - 기술자 크롤러 (Python, uv)
- `apps/api` - Spring Boot 백엔드 (별도 Gradle 빌드)
- `packages/ui` - 공유 UI 컴포넌트 (Tailwind v4)
- `packages/api-client` - 자동 생성 API 클라이언트 (orval + react-query)
- `packages/config` - 공유 설정 (ESLint, TypeScript, env, phone, date)
- `packages/features` - career·plan 공유 화면 (`*View`)
- `packages/mocks` - MSW handler (generated + stateful override)
- `packages/devtools` - dev 전용 프로바이더 (MSWProvider, DevToolbar)
- `packages/push` - 웹 푸시 (FCM) UI·클라이언트
- `packages/business` - 사업자/건설업 조회 클라이언트 (KISCON·정부 API, career·company 공유)
- `packages/data-jobs` - KISCON·퇴직공제 데이터 동기화 잡 (GHA cron)

### Key Patterns

- **Domain vocabulary**: 도메인 용어·Enum 값의 SSOT는 [docs/reference/ubiquitous-language.md](docs/reference/ubiquitous-language.md).
- **API contract envelope**: 모든 API 응답 `{ success, data/error }` 형식 (BE 측 enforce, FE 측 customFetch 자동 unwrap)
- **Generated API client**: `packages/api-client/src/generated/`는 orval 자동 생성, 직접 수정 금지. spec은 BE springdoc 산출(`src/openapi.yaml`, ci-api-spec이 재생성) → `pnpm api:generate`로 클라이언트 재생성 ([ADR-0024](docs/explanation/adr/0024-orval-consumes-be-springdoc-spec.md))
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Env vars**: 새 env var 추가 시 해당 앱의 `.env.example`에도 추가 필수 — 비밀은 placeholder(실값 금지).
- **Deps**: 새 패키지 추가는 pnpm catalog 결정 트리 따름 — [package-dependencies.md](docs/how-to/package-dependencies.md) (2+ 곳 공유 dep 은 `catalog:` 강제, syncpack 이 CI 검증)

## Workflow & Processes

- @docs/how-to/git-workflow.md
- @docs/reference/team.md — Team roles, GitHub/Notion mapping
