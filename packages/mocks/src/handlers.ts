import { getBconnectAPIMock } from '@bconnect/api-client'
import { authOverrides } from './overrides/auth'
import { devicesOverrides } from './overrides/devices'

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
export const handlers = [...authOverrides, ...devicesOverrides, ...getBconnectAPIMock()]
