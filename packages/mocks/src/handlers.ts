import { getBconnectAPIMock } from '@bconnect/api-client'
import { delay, http } from 'msw'
import { authOverrides } from './overrides/auth'
import { devicesOverrides } from './overrides/devices'

// 전역 2초 지연 — 실 네트워크 지연 모사로 로딩/비활성 상태 검증을 쉽게. mock 응답이
// 즉시라 로딩 UI 가 안 보이는 문제 해소. resolver 가 undefined 반환 → 다음 핸들러로 fall-through.
const globalDelay = http.all('*', async () => {
  await delay(2000)
})

// MSW 핸들러 매칭은 배열 앞쪽이 우선 — overrides 가 generated 보다 먼저 와야 매칭됨.
//
// generated (`getBconnectAPIMock()`):
//   openapi.yaml + orval `mock: { type: 'msw' }` 로 자동 생성.
//   faker 기반 임의 데이터로 모든 endpoint 의 happy path 응답.
//
// overrides:
//   stateful flow (auth OTP 검증, device UPSERT) 만 손으로 작성.
//   타입은 generated 의 `getXxxMockHandler` 시그니처가 강제 — openapi.yaml 변경 시
//   override 의 콜백 시그니처도 자동으로 컴파일 에러로 떨어짐 (drift 방지).
export const handlers = [
  globalDelay,
  ...authOverrides,
  ...devicesOverrides,
  ...getBconnectAPIMock(),
]
