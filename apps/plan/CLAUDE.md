# apps/plan

업체+건축주 웹앱. Next.js App Router + Tailwind v4.

> **현재 대부분 placeholder** — Sprint 2 디자인(Figma `1415-1339`), 코드 미구현 다수. 프로필 `@panel`만 구현됨(#541).
> 공통 FE 패턴은 [apps/CLAUDE.md](../CLAUDE.md). 여기는 plan 전용만.

## Commands

```bash
pnpm dev:plan          # http://localhost:3001
pnpm build:plan
pnpm lint:plan
```

## 미래 (Sprint 2+)

Figma Sprint 2에 정의된 화면들 (코드 미구현):

- 로그인, 회원가입 (멤버/업체)
- 기술자 탐색
- 메시지/채팅방
- 알림

`scripts/figma-checks/` cron이 매주 미구현 frame을 issue로 보고 중.
