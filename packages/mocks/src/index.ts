// 공유 mock 패키지 — career / plan FE 모두 같은 BE 를 호출하므로 핸들러를 공유.
//
// 사용처:
//   - 브라우저 dev: `import { worker } from '@bconnect/mocks/browser'` 후 worker.start()
//   - Node 테스트:  `import { server } from '@bconnect/mocks/server'`
//   - 핸들러 직접 접근: `import { handlers } from '@bconnect/mocks/handlers'`

export { handlers } from './handlers'
