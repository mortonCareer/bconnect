import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { NextResponse } from 'next/server'

/**
 * Firebase Cloud Messaging Service Worker 를 동적으로 서빙.
 *
 * 정적 파일(public/) 로 두면 Firebase config 를 빌드 타임에 주입할 수 없음.
 * 런타임에 config 를 inline 해서 서빙.
 *
 * SW 본문은 `src/service-workers/firebase-messaging.sw.template.js` 에서 관리하고,
 * 여기서는 `__FIREBASE_CONFIG__` placeholder 만 치환 → IDE 에서 SW 로직을 JS 로
 * 편집할 수 있음 (template literal 안에 넣지 않아 highlighting/go-to-def 정상 동작).
 *
 * Firebase JS SDK 가 `/firebase-messaging-sw.js` 경로를 자동 탐색하기 때문에 경로는 이것으로 고정.
 */
export const dynamic = 'force-dynamic'

// 빌드 타임에 템플릿을 1회 로드 (파일은 런타임 내내 변하지 않음)
const SW_TEMPLATE = readFileSync(
  fileURLToPath(
    new URL('../../service-workers/firebase-messaging.sw.template.js', import.meta.url)
  ),
  'utf8'
)

export async function GET() {
  // NOTE: 이 값들은 NEXT_PUBLIC_* 와 동일한 공개 정보 (Firebase Web SDK config).
  // 서버 환경변수로 주입하되, 클라이언트에 노출되어도 보안상 무해.
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  }

  const script = SW_TEMPLATE.replace('__FIREBASE_CONFIG__', JSON.stringify(config))

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      // SW 는 캐시 안 함 — 업데이트 즉시 반영
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
