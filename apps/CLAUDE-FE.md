# 공통 FE 패턴 (career · plan)

career·plan 두 Next.js App Router 앱의 공통 프론트엔드 규칙. 각 앱 CLAUDE.md가 `@import`로 로드. 파일명이 정확히 `CLAUDE.md`가 아니라 **자동 로드 안 됨** → `apps/api`(Spring Boot)·`apps/crawler`(Python) 작업 시 안 딸려옴(명시 import한 career·plan만 로드). 앱별 특이사항은 [career](./career/CLAUDE.md) · [plan](./plan/CLAUDE.md). 위반 시 dev 깨짐 또는 production 사고.

## 인증 미들웨어 — Public routes

`src/proxy.ts`의 `PUBLIC_EXACT`/`PUBLIC_PREFIX`로 인증 면제 라우트 정의. 신규 public 페이지는 여기 추가 안 하면 redirect loop. 실제 값은 각 앱 `src/proxy.ts`. (Next 16부터 `middleware.ts`→`proxy.ts` 네이밍.)

## URL state via nuqs

탭/필터/검색 state는 `useQueryState`(nuqs), `useState` 금지. URL 공유·새로고침 유지·뒤로가기 자연.

## Tailwind v4 design tokens

색상 hex 직접 X, CSS variables (`❌ bg-[#386dff]` → `✓ bg-primary`). 토큰: `packages/ui/src/styles/globals.css`. 신규 색상은 globals.css 먼저.

## 인터랙션 스타일 — 클릭 가능 요소

**모든 클릭 가능 요소는 상호작용 스타일을 가진다.** 클릭되는데 마우스/포커스/눌림 피드백이 없으면 버그.

- **1순위: 디자인시스템 프리미티브 사용** (`Button`·`Select`·`Tab`·`Fab`·`MenuButton` 등) — 아래 스타일이 이미 내장. raw `<button>`/클릭 `<div>` 직접 작성은 불가피할 때만.
- 불가피한 raw 클릭 요소엔 **직접** 추가:
  - `cursor-pointer` — raw `<button>` 은 브라우저 기본이 `default` 라 명시 필요
  - **hover 피드백** — `hover:bg-gray-100` 등 배경/색 변경
  - `focus-visible:ring-1 focus-visible:ring-primary` (+`outline-none`) — 키보드 a11y
  - `active:` 눌림 피드백 (예 `active:scale-[0.98]`)
  - `transition-colors` — hover/active 부드럽게
  - **disabled**: `disabled:opacity-40 disabled:cursor-not-allowed` (필요시 `disabled:pointer-events-none`)
  - 아이콘 전용 버튼은 `aria-label` 필수, `<button type="button">` (폼 submit 오발 방지)
  - 모바일 탭 타겟 ≥ 44px(`h-11`) 권장
- 클래스 SSOT 가 있으면 우선 (예 `_field-base.ts`).

## 도메인 enum/라벨 — `@bconnect/api-client` SSOT

값이 enum인 도메인 어휘(`Trade` 등)는 **mock 포함** api-client SSOT 사용 — 옵션 `TRADE_LIST`, 라벨 `TRADE_LABELS[t]` 파생. 한글 하드코딩·자체 옵션 배열·별도 표시필드(`category`) 금지(`generated/`는 orval 산출, 직접수정 X). enum에 없는 값은 BE spec 이슈로 확장.

## 에러 클래스 — `@bconnect/config/errors` SSOT

도메인 에러 클래스와 그 사용자 노출 카피는 [packages/config/errors/index.ts](../packages/config/errors/index.ts)가 SSOT (`UnknownSidoError` + `UNKNOWN_SIDO_MESSAGE`가 예). 새 에러 클래스를 앱 로컬이나 다른 패키지에 정의하지 말고 여기에 추가 — 에러 메시지 문자열을 호출부에 인라인 중복하는 것도 금지 (#1001 리뷰에서 실측).

## 날짜·공통 데이터 유틸 — `@bconnect/config` 선확인

날짜 계산(일수 차·더하기·월 경계 등)은 `@bconnect/config/date`(`daysBetween`·`addDays`·`todayIso` 등), 포맷·전화·주소·동의 항목도 `@bconnect/config/*`가 SSOT. **앱 로컬에 `Date.parse` 직접 계산 헬퍼를 재작성하기 전에 공용 패키지에 이미 있는지 먼저 확인** — 로컬 중복 헬퍼는 반올림·경계 처리 드리프트를 만든다 (#985 리뷰에서 실측).

## Figma 매핑 — `@figma` JSDoc

모든 `page.tsx` 상단 `@figma <url>` JSDoc 필수(ESLint 강제). 디자인 없으면 `@figma-scaffold <reason>`. 형식·마커: [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md). 코드 `@figma` 태그 ↔ Figma 노드 drift는 주간 CI가 감지(상세: [scripts/figma-checks/CLAUDE.md](../scripts/figma-checks/CLAUDE.md)).

## Navigation — `<Link>`, `router.push` 금지

클릭 핸들러의 `router.push`/`router.replace` 금지(ESLint `no-restricted-syntax` CI 차단) — `<Link>`(버튼은 `<Button asChild>`). 불가피한 imperative(mutation onSuccess 등)는 핸들러 내부면 비대상, `router.back()` 허용.

## 공유 화면 — `packages/features`의 `*View` 소비

career·plan 공통 화면(~90%)은 `packages/features`의 `<도메인>View` 하나로 공유. 앱 로컬 재구현=안티패턴(#541). `*View`는 순수 표현 — 앱이 데이터 fetch해 `data` prop으로 내리고, 셸은 `renderShell`(plan 생략→기본 `PanelShell`), 액션·편집은 `actionSlot`/`editHrefs` 슬롯 주입(부재→읽기전용). mutation·공유는 앱측. 여러 페이지가 쓰면 어댑터를 `_adapters/`로 분리, 단일이면 `page.tsx` 인라인. features 폴더: 루트=공개(`*View`+`index.ts`), `_parts/`=내부.

근거: [ADR-0020](../docs/explanation/adr/0020-dual-shell-view-sharing-rendershell-resolved-data.md).

## 이미지 — private CloudFront는 plain `<img>`

`static.bconnect.to`(S3 유저 업로드) 이미지는 **plain `<img>`**. next/image `<Image>` 금지 + next.config `images.remotePatterns`에 `static.bconnect.to` **추가 금지**. next/image Optimizer는 서버 fetch라 브라우저 signed cookie를 못 실어 private(chats·credentials·storages) 접근 시 403. `<img>`는 브라우저가 쿠키 동봉. `<Image>`는 정적 자산(`/public`, import) 전용. CLS는 width/height 또는 aspect-ratio로 고정. 근거: [파일 인프라 설계 §11](../docs/reference/specs/2026-04-12-file-infrastructure-design.md).
