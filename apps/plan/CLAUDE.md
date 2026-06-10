# apps/plan

업체+건축주 웹앱. Next.js App Router + Tailwind v4.

> 공통 FE 패턴은 [CLAUDE-FE.md](../CLAUDE-FE.md) (아래 `@import`). 여기는 plan 전용만.

@../CLAUDE-FE.md

## Commands

```bash
pnpm dev:plan          # http://localhost:3001
pnpm build:plan
pnpm lint:plan
```

## Plan-only — search param 패널 + 3-pane 셸 ([ADR-0021](../../docs/explanation/adr/0021-plan-panel-search-param-state.md))

plan은 `(main)/layout.tsx`가 한 화면에 좌측 사이드바(인증 분기: `MemberSidebar`/`GuestSidebar`) + 본문(`children`) + 우측 패널(`PanelHost`)을 합성. 패널은 **`?panel=` search param** 으로 구동돼 어떤 메인 콘텐츠 위에도 공존한다 (career엔 패널 없음 — full-page 라우트).

- 본문(`(main)/page.tsx`): 기술자 탐색 — `ExploreContent`·`TechnicianList`·`FilterBar` (`_components/`)
- 패널: `_components/panel/PanelHost` 가 `?panel=` 을 읽어 dispatch — `profile/[id]`(+`/coworkers`,`/recommendations`), `messages`·`messages/[id]`, `notifications`. 각 `Panel*` 컴포넌트가 데이터 prep, 공유 뷰는 `@bconnect/features`
- 패널 네비: `usePanelNav`(`panelHref`/`openPanel`/`closeHref`/`close`) — path 가 아닌 `?panel=` set/clear (필터 등 다른 param 보존)
- 비패널 라우트: `login`, `signup/{corp,member}`
