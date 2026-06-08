# apps (career · plan 공통 FE 패턴)

career·plan 두 Next.js App Router 앱의 공통 프론트엔드 규칙. 앱별 특이사항은 각 앱 CLAUDE.md ([career](./career/CLAUDE.md) · [plan](./plan/CLAUDE.md)). 위반 시 dev 깨짐 또는 production 사고.

## 인증 미들웨어 — Public routes

`src/proxy.ts`의 `PUBLIC_EXACT`/`PUBLIC_PREFIX`로 인증 면제 라우트 정의. 신규 public 페이지는 여기 추가 안 하면 redirect loop. 실제 값은 각 앱 `src/proxy.ts`. (Next 16부터 `middleware.ts`→`proxy.ts` 네이밍.)

## URL state via nuqs

탭/필터/검색 state는 `useQueryState`(nuqs), `useState` 금지. URL 공유·새로고침 유지·뒤로가기 자연.

## Tailwind v4 design tokens

색상 hex 직접 X, CSS variables (`❌ bg-[#386dff]` → `✓ bg-primary`). 토큰: `packages/ui/src/styles/globals.css`. 신규 색상은 globals.css 먼저.

## Figma 매핑 — `@figma` JSDoc

모든 `page.tsx` 상단 `@figma <url>` JSDoc 필수(ESLint 강제). 디자인 없으면 `@figma-scaffold <reason>`. 형식·마커: [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md).

## Navigation — `<Link>`, `router.push` 금지

클릭 핸들러의 `router.push`/`router.replace` 금지(ESLint `no-restricted-syntax` CI 차단) — `<Link>`(버튼은 `<Button asChild>`). 불가피한 imperative(mutation onSuccess 등)는 핸들러 내부면 비대상, `router.back()` 허용.

## 공유 화면 — `packages/features`의 `*View` 소비

career·plan 공통 화면(~90%)은 `packages/features`의 `<도메인>View` 하나로 공유. 앱 로컬 재구현=안티패턴(#541). `*View`는 순수 표현 — 앱이 데이터 fetch해 `data` prop으로 내리고, 셸은 `renderShell`(plan 생략→기본 `PanelShell`), 액션·편집은 `actionSlot`/`editHrefs` 슬롯 주입(부재→읽기전용). mutation·공유는 앱측. 여러 페이지가 쓰면 어댑터를 `_adapters/`로 분리, 단일이면 `page.tsx` 인라인. features 폴더: 루트=공개(`*View`+`index.ts`), `_parts/`=내부.

근거: [ADR-0020](../docs/explanation/adr/0020-dual-shell-view-sharing-rendershell-resolved-data.md).
