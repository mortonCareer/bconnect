---
name: frontend-cycle
description: |
  Figma 디자인이 있는 Next.js 페이지/컴포넌트 구현·수정 시 사용.
  Figma URL/node-id 감지 시 자동 호출. Outside-in (타입 → 데이터 → UI) 순서 강제.
  Phase 0·1·2는 사용자 승인 게이트, Phase 3~10은 자율 실행.
  figma-implement-design, design-review, qa, ship 스킬 체이닝.
  Morton 가드레일 (envelope, orval, MSW, BE/main 보호) 포함.
---

# Figma 기반 프론트엔드 사이클

Figma 디자인을 Next.js 코드로 옮길 때 일관된 사이클을 강제하는 thin orchestrator.

## Prerequisites

본 스킬은 다음 외부 스킬을 **각 Phase에서 호출**합니다. 호출 시점에 미설치이면 해당 Phase가 동작하지 않으므로, 본 스킬을 사용할 환경에 모두 설치돼 있어야 합니다.

| 호출 위치                         | 의존 스킬                | 출처                                                       |
| --------------------------------- | ------------------------ | ---------------------------------------------------------- |
| Phase 5 (Build)                   | `figma-implement-design` | [Anthropic Figma plugin](https://claude.com/plugins/figma) |
| Phase 6 (Visual Verify)           | `design-review`          | [gstack](https://github.com/garrytan/gstack)               |
| Phase 7 (Behavior Verify)         | `qa`                     | [gstack](https://github.com/garrytan/gstack)               |
| Phase 9·10 (Integration + Report) | `ship`                   | [gstack](https://github.com/garrytan/gstack)               |

설치 방법은 각 출처 문서 참고. 미설치 협업자는 본 스킬 호출 전에 환경 셋업을 마쳐 주세요.

## 원칙

- **Outside-in**: 타입/골격 먼저 → 데이터 연결 → UI 마감
- **게이트 모델**: 설계 단계(0·1·2)는 꼼꼼히 확인, 실행 단계(3~10)는 자율
- **체이닝**: 단계별로 기존 스킬에 위임, 자체 구현 최소화
- **임의 구현 금지**: Figma 연결 불가 시 사용자에게 요청, 추측 금지

---

## Phase 0. Trigger 게이트 (사용자 승인)

작업 시작 전 확인:

- Figma 노드 접근 OK? (실패 시 임의 구현 금지 → 사용자에게 연결 요청)
- 어느 앱 (`apps/career` / `apps/plan`), 어느 라우트?
- API 스펙 준비? (없으면 spec PR 먼저 vs MSW 우회로 시작)
- GitHub 이슈 번호?
- **의존 스킬 설치 확인**: `figma-implement-design` / `design-review` / `qa` / `ship` 4 개 모두 환경에 설치되어 있는지 검증. 하나라도 없으면 진행 중단하고 사용자에게 설치 요청 — 자체 구현으로 대체 금지 ([Prerequisites](#prerequisites) 참조)

승인 받기 전까지 Phase 1로 넘어가지 않음.

---

## Phase 1. Understand (사용자 승인)

```
mcp__figma__get_metadata(fileKey, nodeId)         # 트리 구조 먼저
mcp__figma__get_design_context(fileKey, nodeId)   # 루트 + 필요 시 자식 개별 호출
mcp__figma__get_variable_defs(fileKey, nodeId)    # 디자인 토큰 정의
mcp__figma__get_screenshot(fileKey, nodeId)       # 시각 reference (검증용)
```

- 컴포넌트 식별 (재사용 vs 신규)
- **UX gap 열거**: Figma는 보통 happy state만 그림. 누락된 상태를 명시:
  - loading / empty / error
  - hover / focus / active / disabled
  - 키보드 내비게이션 / A11y
  - 반응형 (mobile/tablet/desktop)
- 데이터 소스 매핑 (어떤 orval 훅을 쓸지)
- **디자인 토큰 매핑**: `get_variable_defs` 결과를 프로젝트 토큰(`packages/ui` / Tailwind config)과 1:1 매핑표로 정리. 불일치 토큰은 명시적으로 표기

**산출물**: gap 리스트 + 데이터 매핑 + 토큰 매핑표를 사용자에게 보고 → 승인.

---

## Phase 2. Design (사용자 승인)

코드를 한 줄도 쓰기 전 인터페이스 확정:

- props 인터페이스, 컴포넌트 트리
- URL state (nuqs) vs React state 분리
- 데이터 fetch 위치 (RSC vs Client component)
- 에러 바운더리 / Suspense 위치
- 로딩 전략 (Skeleton vs spinner vs optimistic)

**산출물**: 짧은 설계 메모 → 승인 후 자율 영역 진입.

---

## Phase 3~10 (자율 실행)

각 단계 끝에서 게이트 신호가 떨어지면 다음 단계로. 실패 시 [실패 처리](#실패-처리) 참조.

### 3. Scaffold

- 라우트 폴더 생성 (`app/.../page.tsx`)
- 컴포넌트 파일 생성: 빈 구현 + props 타입만
- 기존 컴포넌트 import 매핑 (shadcn → `packages/ui` → 신규)

**게이트**: `pnpm typecheck` 통과.

### 4. Wire

- orval 훅 연결. 스펙 변경 있었으면 `pnpm api:generate` 선행
- MSW handler 등록 — 정상 / error / empty / loading 4개 시나리오
- form: react-hook-form + zod resolver
- Morton: API envelope `{success, data/error}`는 `customFetch`가 자동 unwrap

### 5. Build → `figma-implement-design` 스킬 호출

스킬이 7-step 워크플로(URL 파싱 → context → screenshot → assets → 번역 → 1:1 검증)를 수행.

- shadcn → `packages/ui` → 신규 순으로 컴포넌트 매핑
- 독립 컴포넌트는 병렬 에이전트로 동시 구현
- Tailwind 토큰은 프로젝트 디자인 토큰으로 매핑
- **디테일 누락 방지**: 루트 노드 한 번에 구현 금지. 컴포넌트(또는 의미 단위 자식 노드)별로 `get_design_context`를 개별 호출해서 안쪽 속성(border-radius / padding / gap / color / line-height) 모두 받아 반영. truncation·attention drift 차단

### 6. Visual Verify → `design-review` 스킬 호출

스킬이 Playwright로 스크린샷 캡처 + Figma 대비 + atomic fix loop.

- 스크린샷 저장 경로: `.tmp/screenshots/` (gitignored)
- mobile / tablet / desktop 3 해상도 확인
- **정량 비교**: 시각 일치만 보지 말고 각 컴포넌트의 `border-radius` / `padding` / `gap` / `color` / `font-size` / `line-height` 를 Figma 값과 직접 대조. 불일치 발견 시 Phase 5 디자인 토큰 매핑부터 재검토 (단순 "비슷해 보임" 통과 금지)

### 7. Behavior Verify → `qa` 스킬 호출

스킬이 3-tier 테스트(Quick/Standard/Exhaustive) + atomic fix loop.

검증 시나리오:

- happy flow
- empty state
- error state (400 / 401 / 403 / 404 / 500)
- loading state (slow network)
- 브라우저 콘솔 클린

### 8. Quality Gate

- `pnpm lint && pnpm typecheck && pnpm format`
- 사용하지 않는 import / 변수 제거
- 매직 넘버 / 하드코딩 정리

### 9·10. Integration + Report → `ship` 스킬 호출

스킬이 base 브랜치 감지 → 푸시 → CI 모니터링 → PR 생성.

- 타겟: `dev` (NOT `main`)
- CI 통과 확인: `ci-career` / `ci-plan` / `ci-api-spec` (해당 시)
- Vercel preview 빌드 + URL 동작 확인
- PR description:
  - 변경 요약
  - Figma vs 구현 스크린샷 비교 첨부 (각 화면은 `### Figma` / `### 구현 (Mobile)` 등 h3 로 구분)
  - **State coverage 체크리스트** — Phase 1 UX gap 에서 열거한 상태가 모두 처리됐는지 self-audit. 본 PR 과 무관한 항목은 `N/A` 명시 (예: display-only 컴포넌트 → 데이터 상태는 부모 위임)
    - 데이터: loading / empty / error (4xx, 5xx) / success
    - 폼: validation (필드별 에러)
    - 인터랙션: hover / focus / disabled / 키보드 내비게이션
    - 접근성: ARIA 라벨 / 색 대비 / 스크린 리더 호환
    - 파생 속성: filter / sort / aggregation 등 derived state
  - `Closes #<이슈번호>`
  - 사이클 중 반복된 문제 / 개선 제안

---

## 실패 처리

Phase 3~10 중 어느 단계라도 막히면:

1. **자동 fix 최대 3회 시도** (lint/typecheck/스크린샷 차이 등)
2. 그래도 안 되면 사용자에게 **현재 상태 보고** + `/loop` (self-paced loop) 제안
3. 사용자가 결정: 수동 개입 / `/loop` 위임 / 작업 중단

---

## Morton 특화 가드레일

### 코드 컨벤션

- API 응답 envelope: `{success, data/error}` — `@bconnect/api-client`의 `customFetch`가 자동 unwrap. 직접 unwrap 시도 금지
- 데이터 포맷 (phone, address 등): `@bconnect/config/*` 유틸 우선 사용
- env: `process.env.X` 직접 접근 금지 → `@bconnect/config/env`
- 임시 산출물 (스크린샷 등): `.tmp/screenshots/` (gitignored, glob hook이 강제)

### 영역 보호

- BE 영역 (`apps/api/`) 변경 금지 — CEO 단독 영역
- `main` 직접 push 금지 — 글로벌 hook이 자동 차단. PR은 항상 `dev` 타겟
- 생성된 API 클라이언트 (`packages/api-client/generated/`) 직접 수정 금지 — spec 수정 후 `pnpm api:generate` 재생성

---

## 참고

- 개발 워크플로 전반: [docs/how-to/development-workflow.md](../../../docs/how-to/development-workflow.md)
- API 스펙·MSW: [packages/api-client/CLAUDE.md](../../../packages/api-client/CLAUDE.md), [packages/mocks/CLAUDE.md](../../../packages/mocks/CLAUDE.md)
