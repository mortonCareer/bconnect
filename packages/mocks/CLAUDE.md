# `@bconnect/mocks` — MSW handler 패키지

브라우저 Service Worker 와 Node 테스트 환경 모두에서 사용 가능한 MSW handler 모음. orval 이 자동 생성한 handlers 와 손으로 쓴 stateful override 를 합쳐 export.

## 디렉토리

```text
packages/mocks/src/
├── overrides/
│   ├── auth.ts                   # OTP 검증 stateful, signup/login 분기, error 응답
│   └── devices.ts                # FCM 토큰 UPSERT 의미
├── handlers.ts                   # [...overrides, ...getBconnectAPIMock()]
├── browser.ts                    # setupWorker (브라우저 dev)
├── server.ts                     # setupServer (Node 테스트)
└── index.ts                      # public exports
```

## 핵심 패턴 — orval generated + thin override

- **자동 생성 (orval)**: `getBconnectAPIMock()` — spec 의 모든 endpoint 에 대해 faker 기반 random 응답 핸들러 생성. spec 변경 → 자동 동기화.
- **override (손으로)**: stateful flow (예: OTP 발송 ↔ 검증 매칭, signup/login 분기, FCM 토큰 UPSERT) 만. 약 100 LOC.
- **합치기 순서**: `[...overrides, ...getBconnectAPIMock()]` — override 가 우선 매칭 (배열 앞쪽).

## 사용처

### 브라우저 dev (apps/{career,plan})

```typescript
// apps/career/src/components/msw-provider.tsx (dev only gate)
const { worker } = await import('@bconnect/mocks/browser')
await worker.start()
```

`pnpm install` 시 msw 패키지의 postinstall 이 `apps/{career,plan}/public/mockServiceWorker.js` 자동 재생성 (gitignored — 진짜 SoT 는 node_modules/msw).

### Node 테스트 (Vitest 등)

```typescript
import { server } from '@bconnect/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

브라우저와 동일한 핸들러 그대로 재사용.

## 새 stateful override 추가 절차

1. `packages/mocks/src/overrides/<category>.ts` 추가
2. `getXxxMockHandler` (orval 자동 생성) 활용 — 시그니처 mismatch 시 컴파일 시점 catch
3. `handlers.ts` 의 spread 에 등록

## 관련 문서

- [packages/api-client/CLAUDE.md](../api-client/CLAUDE.md) — spec 구조 + orval codegen 가이드
- [docs/DEVELOPMENT_WORKFLOW.md](../../docs/DEVELOPMENT_WORKFLOW.md) — Mock API 흐름
