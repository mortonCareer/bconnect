# 푸시 알림 딥링크 규격

FCM 페이로드의 `data.url` 필드 규격. BE 가 알림을 보낼 때 사용자를 어느 화면으로 보낼지 결정하는 **공개 URL 계약**.

## 규약

BE 는 FCM 페이로드의 `data` 객체에 `url` 키로 **절대 경로** 를 담아 보냅니다 (도메인 제외, `/messages/123` 형식).

FE 는 이 값을 그대로 사용해:

- 알림 클릭 시(백그라운드): Service Worker 가 해당 경로로 이동
- 포그라운드 수신 시: 인앱 배너 클릭 시 해당 경로로 이동

`url` 이 누락되면 홈(`/`) 으로 fallback.

## 카테고리별 경로

| 카테고리          | `data.url` 예시                   | FE 대응 화면   |
| ----------------- | --------------------------------- | -------------- |
| 채팅              | `/messages/{chatId}`              | 특정 채팅방    |
| 채팅 목록         | `/messages`                       | 채팅 목록      |
| 매칭 제안/새 공고 | `/feed/{postId}`                  | 피드 상세      |
| 공지/시스템 알림  | `/notifications/{notificationId}` | 개별 공지      |
| 프로필 조회 알림  | `/profile/{memberId}`             | 공개 프로필    |
| 동료 요청 수신    | `/coworkers/requests`             | 동료 요청 목록 |

> 새 카테고리 추가 시 이 표를 갱신하고, FE 에 실제 해당 라우트가 있는지 확인합니다.

## BE 예시 (Kotlin + Firebase Admin SDK)

```kotlin
@Service
class FcmService(private val messaging: FirebaseMessaging) {
    fun sendChatNotification(
        recipientId: Long,
        chatId: Long,
        senderName: String,
        body: String,
    ) {
        val tokens = deviceTokenRepository.findByMemberId(recipientId)
        tokens.forEach { dt ->
            try {
                messaging.send(
                    Message.builder()
                        .setToken(dt.token)
                        .setNotification(
                            Notification.builder()
                                .setTitle(senderName)
                                .setBody(body)
                                .build()
                        )
                        .putData("url", "/messages/$chatId") // ← 딥링크
                        .build()
                )
            } catch (e: FirebaseMessagingException) {
                if (e.messagingErrorCode == MessagingErrorCode.UNREGISTERED) {
                    deviceTokenRepository.delete(dt)
                }
            }
        }
    }
}
```

## 왜 BE 가 URL 을 결정하는가

FCM 페이로드 설계에는 두 가지 접근이 있습니다.

1. **BE 가 URL 생성 (현재 채택)** — `data.url = "/messages/123"`
2. **BE 는 논리 식별자, FE 가 URL 조립** — `data = { category: "chat", chatId: 123 }` → SW 내부 라우팅 테이블 참조

현재 (1)을 택한 이유:

- **SW 재배포 부담 감소** — Service Worker 는 브라우저 캐시로 즉시 반영되지 않아 배포 타이밍이 애매함. 라우팅 룰이 SW 에 있으면 URL 컨벤션 변경이 복잡해짐
- **업계 표준** — Slack / Discord / Twitter 모두 BE 가 페이로드에 URL 을 담아 보냄
- **마케팅 캠페인 유연성** — 향후 FE 배포 없이 BE 만으로 새 URL (예: 이벤트 페이지) 에 링크 가능

단점은 **BE 가 FE URL 컨벤션을 알아야 함**인데, 이 문서가 그 SSOT 역할을 합니다. OpenAPI 스펙이 HTTP 엔드포인트를 계약으로 관리하는 것과 동일한 관점.

## URL 변경 절차

URL 컨벤션 변경은 **FE/BE 동시 작업** 으로 처리합니다.

1. 이 문서 먼저 업데이트 (새 경로 추가 또는 변경)
2. FE PR — Next.js 라우트/리다이렉트 추가
3. BE PR — FCM 발송 로직에서 새 `data.url` 값 사용
4. 동일 릴리스에 함께 머지

기존 경로를 제거해야 하는 경우 **Next.js redirect 를 최소 1 릴리스 유지** 해서 구 토큰으로 오는 알림이 404 나지 않도록 합니다.

## 관련 구현

- SW: [apps/career/src/service-workers/firebase-messaging.sw.template.js](../apps/career/src/service-workers/firebase-messaging.sw.template.js)
- Foreground 훅: [apps/career/src/hooks/use-push-notifications.ts](../apps/career/src/hooks/use-push-notifications.ts)
- 테스트 스크립트: [apps/career/scripts/test-push.ts](../apps/career/scripts/test-push.ts)
- Notion 아키텍처 문서: [알림 인프라 (FCM Web Push)](https://www.notion.so/340965d2888b815b929ce3ddc3fe493f)
