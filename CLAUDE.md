# CLAUDE.md

Guide for Claude Code working in the Morton codebase.

## SSoT (Single Source of Truth) 원칙

### 운영 규칙 SSOT

| 규칙 종류         | 원본 위치                                       |
| ----------------- | ----------------------------------------------- |
| 브랜치 네이밍     | `docs/GIT_WORKFLOW.md`                          |
| 이슈 템플릿       | `.github/ISSUE_TEMPLATE/`                       |
| PR 템플릿         | `.github/pull_request_template.md`              |
| 커밋 컨벤션       | `docs/GIT_WORKFLOW.md` + commitlint             |
| 팀 역할/담당자    | `docs/TEAM.md`                                  |
| Figma 매핑 컨벤션 | `packages/ui/CLAUDE.md` (인라인 `@figma` JSDoc) |
| Worktree 룰       | `~/.claude/rules/worktree.md` (글로벌)          |

### 도메인 산출물 SSOT

| 영역          | SSOT                                                                   | 보조 자료 (참조용)                                                                                                 |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HTTP API 계약 | `packages/api-client/src/spec/` (도메인별 분리, 진입점 `openapi.yaml`) | (없음)                                                                                                             |
| DB 스키마     | Spring 엔티티 + Flyway migration                                       | [Morton 개발 보드 ERD (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/) — 활성 sprint 섹션이 최신 ERD |

**변경 정책**: 코드/스펙 변경이 우선이며, 보조 자료(FigJam ERD)가 stale 돼도 코드/엔티티가 진실. FigJam ERD는 변경 *논의*용 시각 자료이지 정답 아님 — 합의되면 코드에 반영.

## Project Overview

Morton is a job matching platform (업체-기술자 연결 구인구직 플랫폼) built as a pnpm monorepo with Next.js apps and Spring Boot backend.

## Commands

```bash
# Development
pnpm dev              # Run both career and plan apps
pnpm dev:career       # Run career app (port 3000)
pnpm dev:plan         # Run plan app (port 3001)

# Build
pnpm build            # Build all Next.js apps
pnpm build:career     # Build career app
pnpm build:plan       # Build plan app

# Lint & Format
pnpm lint             # ESLint all apps
pnpm format           # Prettier format all
pnpm format:check     # Check formatting without changes

# API Client
pnpm api:generate     # Generate API client from OpenAPI spec (orval)

# Backend
cd apps/api && ./gradlew build
cd apps/api && ./gradlew test
```

## Architecture

### Monorepo Structure

- `apps/career` - Worker PWA (Next.js App Router)
- `apps/plan` - Contractor web app (Next.js App Router)
- `apps/crawler` - 기술자 크롤러 (Python, uv). `uv run crawler [args]`로 실행, `uv run --dev pytest tests/ -v`로 테스트
- `apps/api` - Spring Boot backend (separate Gradle build)
- `packages/ui` - Shared UI components with Tailwind v4
- `packages/api-client` - Generated API client (orval + react-query)
- `packages/config` - Shared configs (ESLint, TypeScript, env, phone)

### Key Patterns

- **API Response Wrapper**: All responses are `{ success: boolean, data/error }`
- **Authentication**: Phone OTP → tokens (access in memory, refresh in httpOnly cookie)
- **Route Protection**: Middleware checks `refreshToken` cookie
- **Public Routes**: Defined in `PUBLIC_EXACT` and `PUBLIC_PREFIX` arrays

## Code Style

Code style rules are in `.claude/rules/` and load automatically when working with matching files:

- `frontend.md` — TypeScript, React, Tailwind, naming conventions (apps/career, apps/plan, packages/)
- `commit-policy.md` — Commit approval hook, Conventional Commits

## Git Workflow

@docs/GIT_WORKFLOW.md

## Workflow & Processes

- @docs/TEAM.md — Team roles, GitHub/Notion mapping
- @docs/DEVELOPMENT_WORKFLOW.md — API spec, API client generation, Mock API (MSW)
- @docs/QA_AND_TESTING.md — QA process, test coverage, bug classification
- @docs/DEPLOYMENT.md — Deployment environments, process, infrastructure

## Conventions & Tooling (no custom skills)

이 프로젝트는 `.claude/skills/`를 사용하지 않습니다. 모든 컨벤션은 docs와 자동화 도구에 직접 inline:

- **Git workflow**: @docs/GIT_WORKFLOW.md (브랜치, 커밋, PR), `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`
- **Worktree**: @~/.claude/rules/worktree.md (글로벌 룰)
- **환경 변수**: 각 앱의 `.env.example` + `scripts/link-env.sh` (워크트리 자동 심링크)
- **Figma 매핑**: @packages/ui/CLAUDE.md (인라인 `@figma` JSDoc 컨벤션) + `packages/config/eslint/plugin-figma.js` (강제) + `scripts/figma-checks/` (drift CI)
- **Commit format**: commitlint 자동 검증 (husky)
