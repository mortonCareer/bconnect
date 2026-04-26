import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 브라우저 환경 (Next.js dev 서버) 에서 fetch 를 가로채는 Service Worker 를 등록.
// public/mockServiceWorker.js 가 실제 SW 스크립트.
//
// 사용처: app/_msw-init.tsx 에서 NODE_ENV === 'development' 인 경우만 호출.
export const worker = setupWorker(...handlers)
