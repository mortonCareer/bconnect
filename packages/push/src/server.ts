import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ReferencePathMap } from './reference-paths'

export interface FcmServiceWorkerConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// 빌드 타임에 템플릿을 1회 로드 (파일은 런타임 내내 변하지 않음).
// new URL(..., import.meta.url) 패턴은 @vercel/nft 가 정적 분석해 빌드 출력에 동봉한다.
const SW_TEMPLATE = readFileSync(
  fileURLToPath(new URL('./firebase-messaging.sw.template.js', import.meta.url)),
  'utf8'
)

/**
 * Firebase Cloud Messaging Service Worker 스크립트를 생성한다 (서버 전용 — node:fs 사용).
 *
 * 각 앱의 `app/firebase-messaging-sw.js/route.ts` 가 env 로 config 를 만들어 호출하고,
 * 결과 문자열을 `/firebase-messaging-sw.js` 로 서빙한다. (Firebase SDK 가 이 경로를 자동 탐색)
 *
 * SW 본문은 `firebase-messaging.sw.template.js` 에서 관리(IDE 하이라이트 유지),
 * 여기서는 placeholder 만 치환한다.
 * config 값들은 NEXT_PUBLIC_* 와 동일한 공개 정보 — 클라이언트 노출 무해.
 *
 * `referencePaths` 는 알림 딥링크 목적지 표 — 앱이 소유하고, 인앱 알림 목록·토스트와 공유한다.
 */
export function buildFcmServiceWorker(
  config: FcmServiceWorkerConfig,
  referencePaths: ReferencePathMap
): string {
  return SW_TEMPLATE.replaceAll('__FIREBASE_CONFIG__', JSON.stringify(config)).replaceAll(
    '__REFERENCE_PATH_MAP__',
    JSON.stringify(referencePaths)
  )
}
