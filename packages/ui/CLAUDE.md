# @morton/ui

Morton 공용 UI 컴포넌트 패키지. [shadcn/ui](https://ui.shadcn.com) 기반.

## 사용법

```tsx
import { Input } from '@morton/ui'
import '@morton/ui/styles'
```

---

## Figma ↔ 코드 매핑 (인라인 `@figma` JSDoc)

각 `page.tsx`/공통 컴포넌트 파일 상단의 인라인 JSDoc 주석으로 Figma frame과 코드를 1:1 매핑. ESLint custom rule(`bconnect-figma/require-figma-tag`)이 누락을 빌드에서 차단하고, [scripts/figma-checks/](../../scripts/figma-checks/CLAUDE.md)가 매주 cron으로 drift 자동 감지.

### 마커 4가지

#### 1. 정상 매핑 — `@figma`

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

#### 2. 디자인 없이 임의 스캐폴딩 — `@figma-scaffold`

쇼케이스/PoC/임시 페이지처럼 디자인 없이 만든 경우. **사유 또는 이슈 링크 필수**.

```tsx
/**
 * @figma-scaffold 원클릭 조회 PoC — 백엔드 검증용, 디자인 미정 (#284)
 */
```

#### 3. 디자인 작업 대기 중 — `@figma-pending`

디자이너가 디자인 중이거나 곧 추가될 페이지.

```tsx
/**
 * @figma-pending 회원가입 - 업체 생성 (Sprint 2 예정, #TBD)
 */
```

#### 4. 다중 state/tab — `@figma-state` (옵션)

같은 페이지의 추가 상태(loading/error/empty/탭 변형). `@figma`와 함께 사용.

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8132
 * @figma-state 경력증명서 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8451
 * @figma-state 국가기술자격증 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9351
 */
```

- name은 Figma frame variant와 일치 권장 (한글, 공백 없이)
- 단일 state 페이지는 생략 (대다수 페이지는 `@figma` 한 줄로 충분)

### ESLint 강제 범위

`packages/config/eslint/plugin-figma.js` 정의 (`bconnect-figma/require-figma-tag` rule), 다음 파일에서 누락 시 error:

- `**/page.tsx` — 모든 Next.js 페이지
- `packages/ui/src/components/ui/*.tsx` — 디자인 시스템 공통 컴포넌트

`@figma`, `@figma-scaffold`, `@figma-pending` 셋 중 **하나는 필수**.

내부 컴포넌트 (`apps/*/src/app/.../_components/*.tsx`) 와 아이콘 (`packages/ui/src/icons/*.tsx`) 은 enforce 대상 외, 선택 사항.

### Node ID 찾는 법

- Figma URL: `?node-id=574-4554` 형태로 그대로 사용
- Figma desktop/web에서 frame 우클릭 → "Copy link"
- Claude Code에서 자유 탐색 시 figma MCP (`mcp__figma__get_metadata`, `mcp__figma__use_figma`)

### Figma 파일 구조 (Morton)

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

각 page 안에 section → frame(개별 화면) 계층. 신규 sprint 추가 시 별도 page로 만들어지는 패턴.

---

## 디렉토리 구조

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn 컴포넌트 (각 파일 상단에 @figma 주석 필수)
│   │   └── index.ts      # export
│   ├── icons/            # 아이콘 컴포넌트
│   ├── lib/
│   │   └── utils.ts      # cn() 함수
│   └── styles/
│       └── globals.css   # CSS Variables + 디자인 시스템 @figma URL
└── components.json       # shadcn CLI 설정
```

## 관련 도구

- ESLint plugin: [packages/config/eslint/plugin-figma.js](../../packages/config/eslint/plugin-figma.js)
- 자동 drift 감지 CI: [scripts/figma-checks/CLAUDE.md](../../scripts/figma-checks/CLAUDE.md)
