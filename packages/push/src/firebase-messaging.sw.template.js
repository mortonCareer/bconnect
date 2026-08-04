/* eslint-disable */
/* global importScripts, firebase, self */
// Firebase Cloud Messaging Service Worker 템플릿.
// `@bconnect/push/server` 의 buildFcmServiceWorker 가 이 파일을 읽어
// `__FIREBASE_CONFIG__`·`__REFERENCE_PATH_MAP__` placeholder 를 치환해 반환.
// 각 앱의 `app/firebase-messaging-sw.js/route.ts` 가 그 결과를 서빙.
//
// 이 파일 자체는 브라우저에서 직접 실행되지 않음 (치환된 결과만 노출됨).
// 별도 .js 파일로 두어 IDE 하이라이트/네비게이션이 동작하도록 함.

importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js')

firebase.initializeApp(__FIREBASE_CONFIG__)

const messaging = firebase.messaging()

// `reference_type`(대문자 enum 키) → 이동 목적지 href 패턴. 앱이 소유하고 주입한다.
const REFERENCE_PATHS = __REFERENCE_PATH_MAP__

// BE 는 push data 에 reference_type 을 소문자로 넣는다 (SnsPushSender).
function referenceHref(data) {
  const pattern = data?.reference_type
    ? REFERENCE_PATHS[String(data.reference_type).toUpperCase()]
    : undefined
  if (!pattern) return undefined
  if (!pattern.includes('{id}')) return pattern
  const id = data?.reference_id
  return id ? pattern.replaceAll('{id}', String(id)) : undefined
}

// 백그라운드 메시지 수신 시 OS 알림 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? '새 알림'
  const options = {
    body: payload.notification?.body ?? payload.data?.body ?? '',
    icon: payload.notification?.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
  }
  self.registration.showNotification(title, options)
})

// 알림 클릭 → 해당 화면으로 이동 (딥링크)
//
// 열린 탭이 있으면 그 탭의 URL 을 기준으로 해석한다 — plan 의 `?panel=` 패턴이
// 사용자가 보던 메인 경로를 유지한 채 패널만 열리게 하기 위함.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const href = referenceHref(event.notification.data)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients[0]
      const target = new URL(href ?? '/', client ? client.url : self.location.origin).href
      if (client) return client.navigate(target).then(() => client.focus())
      return self.clients.openWindow(target)
    })
  )
})
