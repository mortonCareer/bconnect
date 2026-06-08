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

## Plan-only — 병렬 라우트 `@panel` + 3-pane 셸

plan은 `(main)` 라우트 그룹에 **parallel route `@panel`** 슬롯을 둠 (career엔 없음). `(main)/layout.tsx`가 한 화면에 좌측 사이드바(인증 분기: `MemberSidebar`/`GuestSidebar`) + 본문(`children`) + 우측 패널(`panel`)을 합성.

- 본문(`(main)/page.tsx`): 기술자 탐색 — `ExploreContent`·`TechnicianList`·`FilterBar` (`_components/`)
- 패널(`@panel/…`): `profile/[profileId]`, `messages`·`messages/[chatId]`, `notifications` (슬롯 비활성 시 `@panel/default.tsx`)
- 비패널 라우트: `login`, `signup/{corp,member}`
