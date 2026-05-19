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

`src/proxy.ts`의 `PUBLIC_EXACT`/`PUBLIC_PREFIX` 배열로 인증 면제 라우트 정의. 신규 public 페이지 추가 시 여기 추가 안 하면 redirect loop 발생.

> Next 16 부터 `middleware.ts` 가 `proxy.ts` 로 네이밍 변경됨.

아래는 형식 참고용 예시 — 실제 값은 [src/proxy.ts](./src/proxy.ts) 참조.

```ts
const PUBLIC_EXACT = ['/login', '/signup/auth', ...]
const PUBLIC_PREFIX = ['/showcase', '/one-click', ...]
```

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
// ✓ className="bg-bconnect-primary"
```

토큰 정의: `packages/ui/src/styles/globals.css`. 신규 색상 추가 시 globals.css에 먼저 정의.

### Figma 매핑 — `@figma` JSDoc

모든 `page.tsx` 파일 상단에 `@figma <url>` JSDoc 주석 필수 (ESLint 강제). 디자인 없으면 `@figma-scaffold <reason>`. 자세한 형식과 마커 종류는 [packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md) 참조.

### 로컬 컴포넌트 colocation — `_components/`

라우트 1곳에서만 쓰는 컴포넌트는 `app/<route>/_components/` 에 colocate. underscore prefix 는 Next.js 공식 private folder — 라우팅 제외 + 미래 file convention 네이밍 충돌 영구 회피.

```text
app/projects/[projectId]/schedule/
├── page.tsx
└── _components/
    ├── task-table.tsx
    └── gantt-chart/
```

- `src/components/` 는 **≥2 production 라우트** 가 import 하는 공통 컴포넌트 전용
- **Promote 트리거**: 두 번째 production importer 가 등장하면 그때 `_components/` → `src/components/` 로 이동 (`git mv` + import path 한 번)
- dev-only preview, Storybook story, test fixture 는 importer 로 카운트 **X** (컴포넌트 자체 검증 도구)
- 처음엔 `_components/`, 나중에 promote — wrong abstraction 의 비용 > late promotion 의 `git mv` 한 번
- 컴포넌트 이름이 route context 임베드되면 (`ScheduleHeader`, `TaskTable`) 신호 명확 — colocation OK

레퍼런스: [Next.js — Private folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) (canonical: `app/blog/_components/Post.tsx`). repo 내 precedent: `apps/career/src/app/{(main),signup,one-click,profile}/_components/`, `apps/plan/src/app/login/_components/`.

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

### Mock fallback — `useMock` 패턴 (legacy, 제거 대상)

대부분 page.tsx에 API 에러 시 `MOCK_*` constants로 폴백하는 임시 패턴 존재:

```tsx
const useMock = isProfileError || (!isProfileLoading && !profileId)
const data = useMock ? MOCK_DATA : (apiData ?? [])
```

**방향**: 신규 추가 금지. 발견 시 점진적 제거 (MSW 기반 mock으로 대체 — [development-workflow.md](../../docs/how-to/development-workflow.md) Mock API 섹션 참조). 제거 시 BE 연동 상태 확인 후 진행.
