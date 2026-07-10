import { getBconnectAPIMock } from '@bconnect/api-client'
import { delay, http } from 'msw'
import { authOverrides } from './overrides/auth'
import { chatsOverrides } from './overrides/chats'
import { coworkersOverrides } from './overrides/coworkers'
import { credentialsOverrides } from './overrides/credentials'
import { devicesOverrides } from './overrides/devices'
import { feedsOverrides } from './overrides/feeds'
import { membersOverrides } from './overrides/members'
import { notificationsOverrides } from './overrides/notifications'
import { profilesOverrides } from './overrides/profiles'
import { recommendationsOverrides } from './overrides/recommendations'
import { scheduleOverrides } from './overrides/schedule'
import { tasksOverrides } from './overrides/tasks'

// API mock(`/api/*`) 응답만 2초 지연 — 실 네트워크 지연 모사로 로딩 UI 검증. mock 응답이
// 즉시라 로딩 UI 가 안 보이는 문제 해소. RSC 네비게이션(`?_rsc`)·청크·외부 이미지엔 적용
// 안 함 — `'*'` 로 전부 잡으면 페이지/패널 전환이 매번 2초 느려짐. undefined → 다음 핸들러 fall-through.
const globalDelay = http.all('*', async ({ request }) => {
  if (!new URL(request.url).pathname.includes('/api/')) return
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
  ...chatsOverrides,
  ...coworkersOverrides,
  ...credentialsOverrides,
  ...devicesOverrides,
  ...feedsOverrides,
  ...membersOverrides,
  ...notificationsOverrides,
  ...profilesOverrides,
  ...recommendationsOverrides,
  // scheduleOverrides 가 tasksOverrides 보다 먼저 — DELETE /tasks/{id} 중복을 schedule 이
  // fall-through 로 넘기는 순서 전제 (overrides/schedule.ts 주석 참조)
  ...scheduleOverrides,
  ...tasksOverrides,
  ...getBconnectAPIMock(),
]
