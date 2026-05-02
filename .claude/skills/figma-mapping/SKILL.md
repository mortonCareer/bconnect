# Figma Mapping (인라인 @figma JSDoc 주석)

`page.tsx`/공통 컴포넌트 파일 상단에 `@figma` JSDoc 주석으로 Figma ↔ 코드 매핑을 SSoT로 관리합니다.
ESLint custom rule(`bconnect-figma/require-figma-tag`)이 누락을 빌드에서 차단합니다.

배경/근거: [#256](https://github.com/mortonCareer/bconnect/issues/256)

## 사용 시점

- 새 `page.tsx` 생성 시
- 새 `packages/ui/src/components/ui/<Name>.tsx` 컴포넌트 생성 시
- 기존 페이지/컴포넌트의 디자인이 redesign되어 다른 Figma frame을 가리켜야 할 때

---

## 주석 형식

### 1. 정상 매핑 — `@figma`

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7050
 */
'use client'

export default function EditAboutPage() { ... }
```

- URL 형식: `https://www.figma.com/design/<fileKey>?node-id=<nodeId>` (하이픈 형식)
- `<fileKey>` Morton 디자인 파일: `EFXofON7gTFbmbE2kB31SS`
- 한 파일에 `@figma`는 하나만

### 2. 디자인 없이 임의 스캐폴딩 — `@figma-scaffold`

쇼케이스/PoC/임시 페이지처럼 디자인 없이 만든 경우. **반드시 사유 또는 이슈 링크 명시**.

```tsx
/**
 * @figma-scaffold 원클릭 조회 PoC — 백엔드 검증용, 디자인 미정 (#284)
 */
```

빈 `@figma-scaffold`만 적으면 ESLint 에러.

### 3. 디자인 작업 대기 중 — `@figma-pending`

디자이너가 디자인 중이거나 곧 추가될 페이지.

```tsx
/**
 * @figma-pending 회원가입 - 업체 생성 (Sprint 2 예정, #TBD)
 */
```

### 4. 다중 state/tab — `@figma-state` (옵션)

같은 페이지의 추가 상태(loading/error/empty/탭 변형). `@figma`와 함께 사용.

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8132
 * @figma-state career  https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8451
 * @figma-state license https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9351
 */
```

- `@figma-state <name> <url>` — name은 코드의 state/tab 키와 매칭 권장
- 단일 state 페이지는 생략 (대다수 페이지는 `@figma` 한 줄로 충분)

---

## ESLint 강제 범위

`packages/config/eslint/plugin-figma.js` 정의 (`bconnect-figma/require-figma-tag` rule), 다음 파일에서 누락 시 error:

- `**/page.tsx` — 모든 Next.js 페이지 (apps/career, apps/plan)
- `packages/ui/src/components/ui/*.tsx` — 디자인 시스템 공통 컴포넌트

`@figma`, `@figma-scaffold`, `@figma-pending` 셋 중 **하나는 필수**.

내부 컴포넌트 (`apps/*/src/app/.../_components/*.tsx`) 와 아이콘 (`packages/ui/src/icons/*.tsx`) 은 enforce 대상 외, 선택 사항.

---

## Node ID 찾는 법

### Figma URL에서 추출

```
URL: https://www.figma.com/design/<fileKey>?node-id=574-4554
Node ID: 574-4554 (그대로 사용)
```

### Figma desktop/web에서

1. frame 우클릭 → "Copy link" → URL의 `node-id` 파라미터 추출
2. 또는 우측 패널의 ID 탭에서 직접 복사

### Figma MCP로 탐색 (Claude Code)

매니페스트가 없으므로, 디자인 파일 구조 탐색이 필요할 땐 figma MCP로 직접 query:

```
mcp__figma__get_metadata(fileKey="EFXofON7gTFbmbE2kB31SS", nodeId="<section-id>")
```

또는 자유 탐색을 위해 `mcp__figma__use_figma` 사용 (figma-use 스킬 prerequisite 로드 후).

---

## Figma 파일 구조 (Morton)

`EFXofON7gTFbmbE2kB31SS` 파일은 7개 page(canvas)로 구성:

| Page                   | Node ID     | 비고                    |
| ---------------------- | ----------- | ----------------------- |
| Brand                  | `799-2087`  | IR/슬라이드             |
| References & Drafts    | `118-645`   | 참조 자료               |
| Assets & Design System | `603-3460`  | 컬러/폰트/아이콘        |
| Sprint 1               | `603-4660`  | 초기 화면               |
| Sprint 1.5             | `1232-1833` | 프로필 confirm/redesign |
| Sprint 2               | `1415-1339` | Plan 앱 등              |
| 동산보드               | `978-4324`  | 작업 보드               |

각 page 안에 section(`스프린트 1.5` 등) → frame(개별 화면) 계층.

신규 sprint 추가 시 별도 page로 만들어지는 패턴이라, "section 매니페스트"가 stale되기 쉬움. 인라인 주석은 page 단위와 무관하게 frame node ID만 가리키므로 stale에 강함.

---

## 자동 CI 감지 (#257 구현됨)

`scripts/figma-checks/` — 매주 월 09:00 KST cron으로 Figma drift 감지.
누락된 `@figma-state` 발견 시 단일 누적 issue (`🤖 figma-drift` 라벨)에 자동 갱신.

수동 실행: `pnpm figma:check:dry` (로컬 stdout) 또는 GHA workflow_dispatch.
자세한 내용: [scripts/figma-checks/CLAUDE.md](../../../scripts/figma-checks/CLAUDE.md)

## 후속 자동화 (별도 이슈)

- [#258](https://github.com/mortonCareer/bconnect/issues/258) — frame naming convention 합의 + CI 체크 추가

---

## 참조

- ESLint plugin: `packages/config/eslint/plugin-figma.js`
- 디자인 시스템 메타: `packages/ui/src/styles/globals.css` (디자인 토큰 정의 + design system Figma URL)
- 관련 스킬: [figma-tailwind](../figma-tailwind/SKILL.md), [figma-verify](../figma-verify/SKILL.md), [cva-component](../cva-component/SKILL.md)
