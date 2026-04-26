# CLAUDE.md

Guide for Claude Code working in the Morton codebase.

## SSoT (Single Source of Truth) 원칙

### 운영 규칙 SSOT

상세 규칙은 `docs/` 또는 `.github/`에 원본을 두고, 스킬(`.claude/skills/`)과 에이전트(`.claude/agents/`)는 해당 문서를 **참조**만 합니다.

| 규칙 종류      | 원본 위치                          | 참조하는 곳                          |
| -------------- | ---------------------------------- | ------------------------------------ |
| 브랜치 네이밍  | `docs/GIT_WORKFLOW.md`             | worktree-manager 스킬                |
| 이슈 템플릿    | `.github/ISSUE_TEMPLATE/`          | issue-management 스킬                |
| PR 템플릿      | `.github/pull_request_template.md` | pr-from-issue 스킬                   |
| 커밋 컨벤션    | `docs/GIT_WORKFLOW.md`             | commit 스킬                          |
| 팀 역할/담당자 | `docs/TEAM.md`                     | issue-management, pr-from-issue 스킬 |

### 도메인 산출물 SSOT

| 영역          | SSOT                                   | 보조 자료 (참조용)                                                                                                 |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HTTP API 계약 | `packages/api-client/src/openapi.yaml` | (없음)                                                                                                             |
| DB 스키마     | Spring 엔티티 + Flyway migration       | [Morton 개발 보드 ERD (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/) — 활성 sprint 섹션이 최신 ERD |

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

## Available Skills

Skills automate common workflows. Located in `.claude/skills/`:

**Git Workflow:**

- `issue-management` — GitHub Issue 생성/관리, 레이블 자동 적용
- `worktree-manager` — Git worktree 기반 병렬 작업 관리
- `commit` — Conventional Commits 형식 자동 커밋
- `pr-from-issue` — 이슈 기반 PR 생성, 리뷰어 자동 할당
- `notion-task-sync` — Notion 보드 동기화 (구현 예정)

**Figma Integration:**

- `figma-mapping` — Figma ↔ 코드 매핑 관리
- `figma-tailwind` — Figma → Tailwind 변환 규칙
- `figma-verify` — Figma vs 렌더링 시각 비교
- `figma-compare` — Figma 스플릿 뷰 비교
- `cva-component` — CVA 컴포넌트 템플릿

**Templates:**

- `react-form-page` — React Hook Form + Zod 페이지 템플릿
- `showcase-template` — 컴포넌트 쇼케이스 페이지

**Environment:**

- `env-config` — 환경 변수 관리 및 동기화
