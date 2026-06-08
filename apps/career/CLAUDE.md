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
- `app/one-click/_clients/fetch-business.ts` — orchestration
- `app/one-click/_clients/*-client.ts` — 각 데이터소스별 client

### KISCON S3 sync

kiscon.net이 cloud IP 차단 → self-hosted runner(homelab K3s ARC)에서 크롤링 → S3 JSON 저장 → career 앱이 S3 직접 read.

핵심 파일:

- `scripts/kiscon-sync.ts` (워크플로우 트리거)
- `app/one-click/_clients/kiscon-s3-client.ts` (S3 read)
- `.github/workflows/kiscon-sync.yml` (매주 월 09:00 KST)

### Mock fallback — `useMock` 패턴 (legacy, 제거 대상)

대부분 page.tsx에 API 에러 시 `MOCK_*` constants로 폴백하는 임시 패턴 존재:

```tsx
const useMock = isProfileError || (!isProfileLoading && !profileId)
const data = useMock ? MOCK_DATA : (apiData ?? [])
```

**방향**: 신규 추가 금지. 발견 시 점진적 제거 (MSW 기반 mock으로 대체 — [development-workflow.md](../../docs/how-to/development-workflow.md) Mock API 섹션 참조). 제거 시 BE 연동 상태 확인 후 진행.
