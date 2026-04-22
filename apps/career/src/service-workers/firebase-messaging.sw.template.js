/* eslint-disable */
/* global importScripts, firebase, self */
// Firebase Cloud Messaging Service Worker 템플릿.
// `apps/career/src/app/firebase-messaging-sw.js/route.ts` 가 이 파일을 읽어
// `__FIREBASE_CONFIG__` placeholder 를 실제 SDK config JSON 으로 치환해 서빙.
//
// 이 파일 자체는 브라우저에서 직접 실행되지 않음.
// (치환된 결과만 `/firebase-messaging-sw.js` 로 노출됨)

importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js')

firebase.initializeApp(__FIREBASE_CONFIG__)

const messaging = firebase.messaging()

// 백그라운드 메시지 수신 시 OS 알림 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? '새 알림'
  const options = {
    body: payload.notification?.body ?? payload.data?.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data,
  }
  self.registration.showNotification(title, options)
})

// 알림 클릭 → 해당 화면으로 이동 (딥링크)
//
// BE 가 FCM 페이로드의 `data.url` 필드에 완전한 딥링크 경로를 넣고,
// SW 는 그대로 사용해 FE/BE 결합도를 낮춤. 카테고리 추가 시 SW 수정 불필요.
// 카테고리별 규격은 `docs/NOTIFICATION_DEEPLINKS.md` 참조.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetPath = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.navigate(targetPath).then(() => client.focus())
        }
      }
      return self.clients.openWindow(targetPath)
    })
  )
})
