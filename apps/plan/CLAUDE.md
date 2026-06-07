# apps/plan

업체+건축주 웹앱. Next.js App Router + Tailwind v4.

> **현재 placeholder 단계** — Sprint 2 디자인 완료 (Figma `1415-1339`), 코드 미구현.
> 본격 개발 시작하면 이 문서를 [apps/career/CLAUDE.md](../career/CLAUDE.md)와 비슷한 수준으로 보강.

## Commands

```bash
pnpm dev:plan          # http://localhost:3001
pnpm build:plan
pnpm lint:plan
```

## 공유 패턴

대부분 패턴은 [apps/career/CLAUDE.md](../career/CLAUDE.md)와 동일:

- 인증 미들웨어 (Public routes)
- URL state via nuqs
- Tailwind v4 design tokens
- Figma 매핑 (`@figma` JSDoc)
- Navigation (`<Link>` 사용, 클릭 핸들러 `router.push` 금지 — ESLint 강제)

## 미래 (Sprint 2+)

Figma Sprint 2에 정의된 화면들 (코드 미구현):

- 로그인, 회원가입 (멤버/업체)
- 기술자 탐색
- 메시지/채팅방
- 알림

`scripts/figma-checks/` cron이 매주 미구현 frame을 issue로 보고 중.
