# apps/career

기술자(blue-collar worker) PWA. Next.js App Router + Tailwind v4.

> 공통 FE 패턴(인증·nuqs·토큰·figma·navigation·공유화면)은 [CLAUDE-FE.md](../CLAUDE-FE.md) (아래 `@import`). 여기는 career 전용만.

@../CLAUDE-FE.md

## Commands

```bash
pnpm dev:career         # http://localhost:3000
pnpm build:career
pnpm lint:career
```

루트에서 실행 (모노레포 어느 디렉토리에서나 가능).

## Career-only Patterns (이례적)

### 원클릭 조회 — Direct PostgreSQL access

`apps/career/src/lib/db.ts`로 Railway Postgres에 `postgres.js`로 직접 접근. orval API client 우회.

이유: 원클릭 조회(`/one-click`)는 사업자등록번호 1개로 10개 외부 데이터소스 동시 조회 — BE를 거치지 않고 FE에서 직접 DB read 캐시 활용이 더 빠름.

캐시 패턴: `unstable_cache` (1h TTL) + React `cache()` (요청 내 dedup) 조합.

핵심 파일:

- `lib/db.ts` — postgres.js client
- `src/lib/business/fetch-business.ts` — orchestration
- `src/lib/business/*-client.ts` — 각 데이터소스별 client

### KISCON sync — 크롤링 → Railway Postgres

kiscon.net이 cloud IP(AWS/Vercel) 차단 → self-hosted runner(`morton-runner`)에서 주간 크롤링 → Railway Postgres 적재(매 동기화 시 DELETE→INSERT 전체 교체) → career 앱이 위 `lib/db.ts`로 직접 read. 원클릭과 같은 Postgres를 공유.

핵심 파일:

- `packages/data-jobs/src/kiscon-sync.ts` — 크롤링 후 `kiscon_arrears`·`kiscon_subcon_limits` 테이블 적재 (앱 무관 데이터 잡, `@bconnect/data-jobs`)
- `src/lib/business/kiscon-db-client.ts` — Postgres read (14일 freshness 체크), `kiscon-construction-client.ts`(면허 등록), `kiscon-crawl-client.ts`(live 크롤 폴백)
- `.github/workflows/kiscon-sync.yml` — 매주 월 09:00 KST, `morton-runner`
