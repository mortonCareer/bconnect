/* eslint-disable */
/* global importScripts, firebase, self */
// Firebase Cloud Messaging Service Worker 템플릿.
// `@bconnect/push/server` 의 buildFcmServiceWorker 가 이 파일을 읽어
// `__FIREBASE_CONFIG__` placeholder 를 실제 SDK config JSON 으로 치환해 반환.
// 각 앱의 `app/firebase-messaging-sw.js/route.ts` 가 그 결과를 서빙.
//
// 이 파일 자체는 브라우저에서 직접 실행되지 않음 (치환된 결과만 노출됨).
// 별도 .js 파일로 두어 IDE 하이라이트/네비게이션이 동작하도록 함.

importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js')

firebase.initializeApp(__FIREBASE_CONFIG__)

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

// 알림 클릭 → 해당 화면으로 이동 (딥링크)
//
// BE 가 FCM 페이로드의 `data.url` 필드에 완전한 딥링크 경로를 넣고,
// SW 는 그대로 사용해 FE/BE 결합도를 낮춤. 카테고리 추가 시 SW 수정 불필요.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetPath = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients[0]
      if (client) {
        // 이미 열린 탭 재사용 — 딥링크로 이동 후 포커스
        return client.navigate(targetPath).then(() => client.focus())
      }
      // 열린 탭 없음 — 새 창으로 딥링크 열기
      return self.clients.openWindow(targetPath)
    })
  )
})
