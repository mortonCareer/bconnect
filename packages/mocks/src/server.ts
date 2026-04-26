import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Node 환경 (Vitest/Jest 등 단위·통합 테스트) 에서 fetch 를 가로채는 인터셉터.
// 브라우저 SW 와 동일한 핸들러를 재사용.
//
// 테스트 셋업 예:
//   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
//   afterEach(() => server.resetHandlers())
//   afterAll(() => server.close())
export const server = setupServer(...handlers)
