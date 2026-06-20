export interface FcmServiceWorkerConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

/**
 * Firebase Cloud Messaging Service Worker 스크립트를 생성한다.
 *
 * 각 앱의 `app/firebase-messaging-sw.js/route.ts` 가 env 로 config 를 만들어 호출하고,
 * 결과 문자열을 `/firebase-messaging-sw.js` 로 서빙한다. (Firebase SDK 가 이 경로를 자동 탐색)
 *
 * config 값들은 NEXT_PUBLIC_* 와 동일한 공개 정보 — 클라이언트 노출 무해.
 * 딥링크는 BE 가 FCM 페이로드 `data.url` 에 완전한 경로를 넣고 SW 는 그대로 사용 →
 * 카테고리 추가 시 SW 수정 불필요 (FE/BE 결합도 최소화).
 */
export function buildFcmServiceWorker(config: FcmServiceWorkerConfig): string {
  return `importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js')

firebase.initializeApp(${JSON.stringify(config)})

const messaging = firebase.messaging()

// 백그라운드 메시지 수신 시 OS 알림 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? '새 알림'
  const options = {
    body: payload.notification?.body ?? payload.data?.body ?? '',
    icon: payload.data?.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
  }
  self.registration.showNotification(title, options)
})

// 알림 클릭 → 딥링크(data.url)로 이동, 열린 탭 있으면 재사용
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetPath = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients[0]
      if (client) {
        return client.navigate(targetPath).then(() => client.focus())
      }
      return self.clients.openWindow(targetPath)
    })
  )
})
`
}
