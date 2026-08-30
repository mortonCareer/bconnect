# MSW 핸들러 패키지

> 대상: FE 개발자<br>
> 학습 목표: MSW handler 구성과 stateful override 위치를 확인한다<br>
> 위치: `packages/mocks`

브라우저 Service Worker 에서 쓰는 MSW handler 모음입니다. orval 이 자동 생성한 handlers 와 손으로 쓴 stateful override 를 합쳐 export 합니다.

## 명령어

```bash
pnpm install
```

- `pnpm install` 시 msw 패키지의 postinstall 이 `apps/{career,plan}/public/mockServiceWorker.js` 자동 재생성
- 해당 파일은 gitignored. 진짜 SoT 는 `node_modules/msw`

## 패키지 구조

```text
packages/mocks/src/
├── overrides/
│   ├── auth.ts                   # OTP 검증 stateful, signup/login 분기, error 응답
│   └── notifications.ts          # 알림 목록·읽음 상태 stateful (커서 페이징, 뱃지 연동)
├── handlers.ts                   # [...overrides, ...getBconnectAPIMock()]
└── browser.ts                    # setupWorker (브라우저 dev, 유일한 진입점)
```

## 환경변수

없음.

## 핵심 패턴 · orval generated + thin override

- 자동 생성은 orval 담당. `getBconnectAPIMock()`
  - spec 의 모든 endpoint 에 대해 faker 기반 random 응답 핸들러 생성
  - spec 변경 시 자동 동기화
- override 는 손으로 작성. stateful flow 만 대상
  - 예. OTP 발송과 검증 매칭, signup/login 분기, 알림 읽음 상태
- 합치기 순서는 `[...overrides, ...getBconnectAPIMock()]`
  - 배열 앞쪽인 override 가 우선 매칭

## 사용처

### 브라우저 dev · race-safe gate

대상은 `apps/{career,plan}` 입니다.

```typescript
// apps/career/src/components/msw-provider.tsx
const { worker } = await import('@bconnect/mocks/browser')
await worker.start()
```

활성화 흐름입니다.

1. `app/layout.tsx` 가 `<Providers>` 렌더
2. `<Providers>` 가 `<MSWProvider>` 로 wrap. `worker.start()` 완료까지 children 렌더 차단
3. dev 환경에서 SW 등록 완료 후 children 렌더
4. 이후 모든 `fetch()` 가 SW 거치며 handler 매칭 시 mock 응답 반환
   - 매칭 우선순위는 배열 앞쪽. overrides 가 generated 보다 우선
5. handler 없는 요청은 `onUnhandledRequest: 'bypass'` 로 실 네트워크 통과

fetch 부수효과는 `<MSWProvider>` 안쪽에서 실행되어야 race 가 안 납니다. `refreshAccessToken()`·`usePushNotifications()` 가 해당합니다.

- `providers.tsx` 의 `<PostMSWBootstrap>` 가 그 역할

### Node 테스트

현재 레포에 테스트 러너가 없어 Node 용 `setupServer` 진입점을 두지 않습니다.

- 테스트 도입 시 `browser.ts` 와 같은 방식으로 `handlers` 를 재사용하는 `server.ts` 를 추가

## 새 stateful override 추가 절차

1. `packages/mocks/src/overrides/<category>.ts` 추가
2. orval 자동 생성인 `getXxxMockHandler` 활용. 시그니처 mismatch 시 컴파일 시점 catch
3. `handlers.ts` 의 spread 에 등록

## 참조

- [package-api-client.md](./package-api-client.md) · spec 구조와 orval codegen 가이드
- [development.md](../how-to/development.md) · Mock API 흐름

## Mock API (MSW)

dev 환경에서 모든 API 요청은 MSW 가 가로채서 mock 응답으로 답합니다. MSW는 Mock Service Worker입니다.

- production 빌드에선 `NODE_ENV` 가드로 `@bconnect/mocks` 가 tree-shake
- career·plan 둘 다 `@bconnect/mocks` 를 써서 자동 적용됨

상세는 패키지 SoT 를 참고합니다.

- 파이프라인 · becompat transformer · orval codegen : [package-api-client.md](../reference/package-api-client.md)
- 핸들러 · stateful override · 브라우저·테스트 entry · race-safe gate · 새 override 추가 절차 : [package-mocks.md](../reference/package-mocks.md)
