import { NextResponse } from 'next/server'
import { buildFcmServiceWorker } from '@bconnect/push/server'
import { REFERENCE_PATHS } from '@/lib/notification-routes'

/**
 * Firebase Cloud Messaging Service Worker 를 동적으로 서빙.
 *
 * 정적 파일(public/) 로 두면 Firebase config 를 빌드 타임에 주입할 수 없어 런타임에 inline.
 * SW 본문은 `@bconnect/push` 의 buildFcmServiceWorker 가 생성 (career·plan 공유).
 *
 * Firebase JS SDK 가 `/firebase-messaging-sw.js` 경로를 자동 탐색하므로 경로 고정.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  // NOTE: 이 값들은 NEXT_PUBLIC_* 와 동일한 공개 정보 (Firebase Web SDK config).
  const script = buildFcmServiceWorker(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
    },
    REFERENCE_PATHS
  )

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      // SW 는 캐시 안 함 — 업데이트 즉시 반영
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
