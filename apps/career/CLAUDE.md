# apps/career

기술자(blue-collar worker) PWA. Next.js App Router + Tailwind v4.

## Commands

```bash
pnpm dev:career         # http://localhost:3000
pnpm build:career
pnpm lint:career
```

루트에서 실행 (모노레포 어느 디렉토리에서나 가능).

## Frontend Key Patterns

다음 패턴들은 career 작업 시 반드시 알아야 함. 위반 시 dev 환경 깨짐 또는 production 사고.

### 인증 미들웨어 — Public routes

`src/middleware.ts`의 `PUBLIC_EXACT`/`PUBLIC_PREFIX` 배열로 인증 면제 라우트 정의. 신규 public 페이지 추가 시 여기 추가 안 하면 redirect loop 발생.

```ts
const PUBLIC_EXACT = ['/login', '/signup/auth', ...]
const PUBLIC_PREFIX = ['/showcase', '/one-click', ...]
```

### Mock fallback — `useMock` 패턴 (legacy, 제거 대상)

대부분 page.tsx에 API 에러 시 `MOCK_*` constants로 폴백하는 임시 패턴 존재:

```tsx
const useMock = isProfileError || (!isProfileLoading && !profileId)
const data = useMock ? MOCK_DATA : (apiData ?? [])
```

**방향**: 신규 추가 금지. 발견 시 점진적 제거 (MSW 기반 mock으로 대체 — [DEVELOPMENT_WORKFLOW.md](../../docs/DEVELOPMENT_WORKFLOW.md) Mock API 섹션 참조). 제거 시 BE 연동 상태 확인 후 진행.

### URL state via nuqs

탭/필터/검색 state는 `useQueryState` (nuqs). `useState` 금지.

```tsx
import { useQueryState } from 'nuqs'

const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'one-click' })
```

이유: URL 공유 가능, 새로고침 시 상태 유지, 뒤로가기 동작 자연스러움.

### Tailwind v4 design tokens

색상은 hex 직접 X, **CSS variables** 사용:

```tsx
// ❌ className="bg-[#386dff]"
// ✓ className="bg-morton-primary"
```

토큰 정의: `packages/ui/src/styles/globals.css`. 신규 색상 추가 시 globals.css에 먼저 정의.

### Figma 매핑 — `@figma` JSDoc

모든 `page.tsx` 파일 상단에 `@figma <url>` JSDoc 주석 필수 (ESLint 강제). 디자인 없으면 `@figma-scaffold <reason>`. 자세한 형식과 마커 종류는 [packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md) 참조.

---

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

---

## 디렉토리 구조

```text
apps/career/src/
├── app/                  # Next.js App Router
│   ├── (main)/           # 인증 후 navigation 포함
│   ├── login/
│   ├── signup/
│   ├── one-click/        # 원클릭 조회 (postgres.js direct)
│   ├── showcase/         # 컴포넌트 검수용
│   └── ...
├── lib/                  # 공통 유틸
│   ├── db.ts             # postgres.js client
│   ├── format-time.ts
│   └── ...
├── stores/               # Zustand stores
├── hooks/                # 공통 hooks
├── middleware.ts         # 인증 미들웨어
└── service-workers/      # FCM Web Push
```
