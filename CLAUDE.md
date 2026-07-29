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

- **Domain vocabulary**: 도메인 용어·Enum 값의 SSOT는 [docs/reference/ubiquitous-language.md](docs/reference/ubiquitous-language.md). Project·ProjectTask·WorkerTask·Offer 등 혼동하기 쉬운 이름은 FE 네이밍·카피 작성 전 여기서 확인 (BE `apps/api/docs/` 전체 인덱스는 [apps/api/.claude/CLAUDE.md](apps/api/.claude/CLAUDE.md))
- **API contract envelope**: 모든 API 응답 `{ success, data/error }` 형식 (BE 측 enforce, FE 측 customFetch 자동 unwrap)
- **Generated API client**: `packages/api-client/src/generated/`는 orval 자동 생성, 직접 수정 금지. spec은 BE springdoc 산출(`src/openapi.yaml`, ci-api-spec이 재생성) → `pnpm api:generate`로 클라이언트 재생성 ([ADR-0024](docs/explanation/adr/0024-orval-consumes-be-springdoc-spec.md))
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Data formats**: 공통 데이터 (phone, address 등)는 `@bconnect/config/*` 유틸 통일 사용. 직접 string parsing 금지
- **Env vars**: `@bconnect/config/env`의 Zod 검증된 `env` 객체 사용. `process.env.X` 직접 접근 금지. **새 env var 추가 시 해당 앱/서비스의 `.env.example`에도 추가 필수** — 비밀은 placeholder(실값 금지), `NEXT_PUBLIC_*` 공개값은 실값 기재
- **Local dev servers**: dev 서버 포트는 워크트리별 자동 할당 (`scripts/dev-port.sh`, dev·main=3000/3001, 그 외 4000대). 시각적 검증 등으로 서버를 직접 띄우거나 내릴 때는 반드시 [.claude/skills/local-servers/SKILL.md](.claude/skills/local-servers/SKILL.md)의 기동·식별·중지 규칙을 따를 것 — 임의 포트 사용·`pgrep -f` 기반 kill 금지
- **dev OTP**: `pnpm otp <전화번호>` 로 조회 ([dev-api-qa.md](docs/how-to/dev-api-qa.md)). 사용자에게 코드 묻지 말 것

## Workflow & Processes

- @docs/how-to/git-workflow.md
- @docs/reference/team.md — Team roles, GitHub/Notion mapping
- @docs/how-to/development-workflow.md — API spec, API client generation, Mock API (MSW)
- @docs/how-to/deployment.md — Deployment environments, process, infrastructure
- @docs/how-to/write-docs.md — 문서 작성 룰 (Diátaxis 4분할, ADR 가이드)
- @docs/explanation/adr/README.md — Architecture Decision Records 인덱스
