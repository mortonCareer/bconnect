# notification-file-reference
- 위치 : `/notification`, `/core/domain/notification`, `/storage/notification`, `/storage/device`, `/socket/message`
- 범위 : 알림 기능 전 파일의 **파일별 기능·의도** 레퍼런스
- 흐름 개요는 [notification-architecture.md](./notification-architecture.md) 참고. 이 문서는 파일 단위 설명이다.

## 핵심 설계 결정 (파일 이해 전 요약)
- **이벤트 역전 + sink**: `notification` 은 아무도 의존하지 않는 sink 모듈. socket 은 알림을 모르고 `ChatMessageSentEvent` 만 발행한다.
- **enum 이 타입 카탈로그 소유**: 메시지 템플릿·이동 링크·reference_type 을 DB(notification_types) 가 아니라 `NotificationType` enum 이 소유한다.
- **template_args 스냅샷**: 렌더 변수(예: senderName)를 이벤트 시점에 JSON 으로 저장 → 발신자 개명/탈퇴와 무관하게 히스토리 문구 보존, push 문구와 목록 문구 일치.
- **port/adapter**: push 발송/endpoint 는 `notification.domain.push` 의 port, 구현은 `notification.infrastructure.push` 의 SNS/Logging adapter. 도메인은 구현을 모른다.
- **저장/조회는 core, 처리/발송은 notification**: `core.domain.notification` 은 DB 저장·조회, `notification.domain` 은 대상 계산·렌더·발송.

---

## socket/message/ — 트리거

### `ChatMessageSentEvent.java` — record
- **기능**: 채팅 메시지가 발생했다는 사실(`senderId, chatId, recipientIds, activeMemberIds, preview`)을 담는 Spring 이벤트.
- **의도**: socket 이 알림 로직을 직접 호출하지 않고 "사건"만 발행(이벤트 역전). `activeMemberIds`(접속 중 사용자)와 `recipientIds` 는 socket 세션만 아는 정보라 이벤트가 실어 보낸다 — 이래야 알림 쪽이 socket 세션을 몰라도 된다.

### `MessageSocketService.broadcast()` — @Service (@Transactional)
- **기능**: 메시지 생성 → 접속자 read 처리 → 수신자 계산 → `eventPublisher.publishEvent(ChatMessageSentEvent)`.
- **의도**: 알림은 broadcast 트랜잭션 **커밋 후** 부수효과로 처리. 여기서는 이벤트만 발행하고 저장·발송은 관여하지 않는다(관심사 분리).

---

## notification/domain/ — 처리 오케스트레이션

### `NotificationEventListener.java` — @Component
- **기능**: `@TransactionalEventListener(AFTER_COMMIT)` 로 `ChatMessageSentEvent` 구독 → `NotificationService.handle(CHAT_MESSAGE, event)` 위임.
- **의도**: 얇은 진입점. **AFTER_COMMIT** 이라 채팅이 롤백되면 알림도 안 나간다(유령 알림 방지). 타입↔이벤트 매핑만 담당.

### `NotificationService.java` — @Component
- **기능**: `handle(NotificationType type, Object event)` — 대상 계산(resolver) → 저장(linker) → 렌더(factory) → 활성 device 조회(deviceService) → 발송(pushSender) → `EXPIRED/INVALID` 면 device 비활성화. `@Transactional(REQUIRES_NEW)`.
- **의도**: 처리 흐름의 **본체**. `REQUIRES_NEW` 로 원래(채팅) 트랜잭션과 분리된 새 트랜잭션에서 저장·발송하고, `device.disable()` 이 이 트랜잭션에서 영속화된다. `event` 를 `Object` 로 받아 타입에 무관하게 조립(타입별 분기는 resolver·factory·enum 이 담당).

### `NotificationMessageFactory.java` — @Component
- **기능**: `createArgs(type, senderId)` — 이벤트 시점 렌더 변수(`NotificationArgs`) 스냅샷 생성(메시지형은 senderName 조회, 시스템형은 empty). `create(type, referenceId, content, args)` — `PushNotification`(title=`type.render(args)`, body=content 100자 절단, link=`type.link(referenceId)`) 생성.
- **의도**: "렌더 변수 스냅샷"과 "push 메시지 조립"을 한 곳에. args 를 이벤트 시점에 고정(snapshot)해 저장·발송·목록 문구를 일치시킨다.

### `NotificationType.java` — enum
- **기능**: 타입 카탈로그. 상수마다 `(referenceType, "template")` + `formatArgs()`(채울 값) 개별화.
  - `CHAT_MESSAGE(CHAT_ROOM, "%s님이 메시지를 보냈습니다")`, `SIGNUP_WELCOME(NONE, "회원가입을 축하드립니다")`, `PROFILE_COMPLETION(PROFILE, …)`, `COWORKER_REQUESTED(COWORKER_REQUEST, …)`, `OFFER_RECEIVED(OFFER, …)`, `CONTRACT_WRITTEN(CONTRACT, …)`.
  - `render(args)`=`template.formatted(formatArgs(args))`, `link(referenceId)`(NONE 은 null=이동 없음), `code()`=name(), `from(code)`(없으면 `UNKNOWN_TYPE`).
- **의도**: 타입 정의를 코드(enum)가 소유 → DB 테이블/시더 불필요, 타입별 동작을 추상 메서드로 개별화, 새 타입 추가 시 컴파일러가 처리 강제. template 은 format string(`%s`)이라 placeholder 를 N개로 확장 가능.

### `DeviceService.java` — @Service
- **기능**: `pushableDevices(memberId)`(enabled device 조회), `register(user, token, platform)`(endpoint 확보 후 upsert), `unregister(user, token)`(endpoint 삭제 후 row 삭제, 실패 시 경고 로그).
- **의도**: device token = push endpoint 의 일부라 알림 모듈이 소유. register 는 idempotent(같은 token 재등록 시 소유자/last_active 갱신). endpoint 관리는 `PushEndpointRegistry` port 에 위임(구현 몰라도 됨).

---

## notification/domain/target/ — "누구에게" 계산 (전략)

### `NotificationTargetResolver.java` — interface `<E>`
- **기능**: `supports()`=담당 타입, `resolve(event)`=`ResolvedNotification` 반환.
- **의도**: 타입별 대상 계산을 갈아끼우는 확장 seam. 이벤트 타입마다 구현체 하나.

### `NotificationTargetResolverRegistry.java` — @Component
- **기능**: 모든 resolver 를 `Map<NotificationType, resolver>` 로 모으고, `get(type)` 으로 조회(없으면 `UNKNOWN_TYPE`).
- **의도**: `NotificationService` 가 타입별 if/switch 없이 resolver 를 찾도록. 새 resolver 는 Spring 빈으로 등록만 하면 자동 편입.

### `ChatMessageTargetResolver.java` — @Component
- **기능**: `supports()`=CHAT_MESSAGE. `resolve(event)` → 저장 대상=전 수신자, push 대상=수신자−활성사용자.
- **의도**: 채팅은 "활성(보고 있는) 사용자에겐 push 안 함, 히스토리는 전원 저장" 규칙. **resolver 가 이벤트 해석까지** 담당(senderId·referenceId·content + 대상) — socket 이벤트는 notification 인터페이스를 구현할 수 없으므로(sink 규칙) 서비스가 아니라 resolver 가 꺼낸다.

### `ResolvedNotification.java` — record
- **기능**: `(senderId, referenceId, content, Targets)`. 내부 record `Targets(persistReceiverIds, pushReceiverIds)`.
- **의도**: resolver 결과(저장정보 + 저장/발송 대상 분리)를 담는 값. `Targets` 를 nested 로 흡수해 파일 수·개념을 함께 유지.

---

## notification/domain/push/ — push 포트 · 프로토콜

### `PushSender.java` — interface (port)
- **기능**: `send(endpointArn, payload)` → `PushSendResult`.
- **의도**: 발송 수단(SNS/logging)을 도메인에서 추상화한 port. 도메인은 이 인터페이스만 안다.

### `PushEndpointRegistry.java` — interface (port)
- **기능**: `ensureEndpoint(token)`(생성/복구), `deleteEndpoint(arn)`.
- **의도**: SNS platform endpoint 수명주기를 추상화. `DeviceService` 가 사용.

### `PushPayload.java` — record
- **기능**: `(title, body, link, Map<String,String> data)` — 발송 어댑터에 넘기는 최종 payload.
- **의도**: 전송 계층 중립 VO. `link` 는 이동 URL, `data` 는 라우팅 메타.

### `PushSendResult.java` — record
- **기능**: `(endpointArn, Status, messageId)`. `Status = SUCCESS · EXPIRED · INVALID · FAILED`. 팩토리 `success/expired/invalid/failed`.
- **의도**: 발송 결과를 4상태로 구분 → `EXPIRED/INVALID` 는 죽은 토큰이므로 `NotificationService` 가 device 를 비활성화, `FAILED` 는 일시 실패라 유지.

### `PushNotification.java` — record (implements 없음)
- **기능**: `(type, referenceId, title, body, link)`. `toPayload(notificationId)` → `PushPayload`(data: notification_id, type_code, reference_type, reference_id).
- **의도**: 렌더된 단일 push 메시지. 과거 `PushMessage` 인터페이스를 흡수(단일 구현이라 seam 불필요). data 에 라우팅 정보를 실어 프론트/서비스워커가 `reference_type + reference_id` 로 이동.

---

## notification/infrastructure/push/ — 외부 연동 adapter

### `SnsConfig.java` — @Configuration @Profile({"dev","prod"})
- **기능**: `SnsClient` 빈 생성(region + 자격증명).
- **의도**: 실제 AWS 연동은 dev/prod 에서만. port/adapter 의 조립 지점.

### `SnsProperties.java` — @ConfigurationProperties("app.sns") record
- **기능**: `(region, platformApplicationArn)`, `enabled()`(arn 존재 여부).
- **의도**: SNS 설정 외부화(env). arn 미설정이면 비활성으로 판단 가능.

### `SnsPushSender.java` — @Component @Profile({"dev","prod"}) implements PushSender
- **기능**: SNS `publish`(FCMv1 GCM 메시지 구성). 예외 매핑: EndpointDisabled/NotFound→EXPIRED, InvalidParameter(endpoint 관련)→INVALID, 그 외→FAILED.
- **의도**: 실제 발송 구현. AWS 예외를 도메인 `Status` 로 번역해 토큰 정리 정책을 도메인이 결정하게 한다.

### `SnsEndpointRegistry.java` — @Component @Profile({"dev","prod"}) implements PushEndpointRegistry
- **기능**: platform endpoint 생성, 이미 있으면 예외 메시지 정규식(`Endpoint (arn:…) already exists`)으로 복구, 속성(Token, Enabled=true) 설정. 삭제.
- **의도**: 같은 토큰 재등록 시 중복 생성 대신 기존 endpoint 회수(idempotent).

### `LoggingPushSender.java` / `LoggingEndpointRegistry.java` — @Component @Profile({"local","test"})
- **기능**: 발송/endpoint 를 실제로 하지 않고 로그만. Logging sender 는 SUCCESS 반환, Logging registry 는 가짜 ARN(`arn:aws:sns:local:…`) 반환.
- **의도**: 로컬·테스트에서 AWS 없이 흐름을 돌리기 위한 stub. 통합 테스트가 이 fake ARN 으로 발송 경로를 검증.

---

## notification/presentation/v1/ — API

### `DeviceController.java` — @RestController `/api/v1/devices`
- **기능**: `POST`(register, `RegisterDeviceRequest`→`RegisterDeviceResponse.ok()`), `DELETE`(unregister, `UnregisterDeviceRequest`).
- **의도**: 디바이스 토큰 등록/해제 엔드포인트. `@AuthenticationPrincipal AuthUser` 로 소유자 결정.

### `NotificationController.java` — @RestController `/api/v1/notifications`
- **기능**: `GET`(목록, sender/사진 resolve 후 `NotificationResponse` 로 매핑·문구 렌더), `GET /unread/count`, `PATCH /{id}/read`, `PATCH /read`.
- **의도**: 조회·읽음 API. 문구/referenceType 은 `NotificationType` enum 으로 렌더(DB 조회 불필요). 저장이 아니라 조회 전담 서비스(`NotificationQueryService`)만 의존.

### `RegisterDeviceRequest` / `UnregisterDeviceRequest` / `RegisterDeviceResponse` — record DTO
- **기능**: 등록 요청(`@NotBlank token`, `@NotNull DevicePlatform platform`), 해제 요청(`token`), 등록 응답(`registered`).
- **의도**: 입력 검증은 DTO 어노테이션에서. platform 은 enum 바인딩.

### `NotificationResponse.java` — record DTO
- **기능**: `of(notification, NotificationType type, Member sender, senderPicture)` — `type.render(args)` 로 문구, `referenceType` 소문자, sender 요약 조립. 저장된 args 가 비면 현재 sender 이름으로 대체.
- **의도**: 목록 렌더도 enum 이 담당(push 와 동일 소스). 스냅샷 우선 + 없을 때만 live sender(과거 데이터 호환).

---

## core/domain/notification/ — 저장 · 조회

### `NotificationLinker.java` — @Service
- **기능**: `link(command)` — 수신자별 `NotificationEntity` 저장, `Map<receiverId, notificationId>` 반환. `@Transactional`.
- **의도**: **저장(write) 전담**. 알림 처리 흐름에서 DB 영속화만 떼어낸 컴포넌트.

### `NotificationLinkCommand.java` — record
- **기능**: `(senderId, receiverIds, typeCode, referenceId, content, NotificationArgs args)`.
- **의도**: Linker 입력. typeCode 는 String(core 는 `NotificationType` enum 을 모른다 — sink 방향 유지). args 는 저장 시 `toJson()`.

### `NotificationQueryService.java` — @Service
- **기능**: `list`(커서 페이지), `unreadCount`(readAt IS NULL), `markRead`(NOT_FOUND/FORBIDDEN 검증), `markAllRead`(일괄 update).
- **의도**: **조회(read) 전담**(CQRS 처럼 write=Linker 와 분리). 소유자 검증으로 남의 알림 접근 차단.

### `Notification.java` — record (도메인 모델)
- **기능**: 엔티티 → 조회용 불변 모델. `of(entity)` 에서 `templateArgs` JSON 을 `NotificationArgs` 로 역직렬화.
- **의도**: 조회 결과의 도메인 표현. 저장 형식(JSON)을 도메인 값(`NotificationArgs`)으로 복원.

### `NotificationArgs.java` — record
- **기능**: `Map<String,String>`(불변) + `SENDER_NAME`/`COMPANY_NAME` 키 상수. `senderName()/companyName()/of()/empty()/fromJson()/toJson()/get()/isEmpty()`.
- **의도**: 렌더 변수 스냅샷 컨테이너 + JSON 직렬화. **core 에 위치하는 이유**: Linker(저장)·Notification(조회)이 사용하므로, notification.domain 에 두면 `core→notification` 역참조가 되어 sink/순환 규칙 위반. 즉 의존받는 쪽(core)이 소유해야 한다.

### `NotificationExceptionCode.java` — enum
- **기능**: `NOT_FOUND(NT001)`, `FORBIDDEN(NT002)`, `UNKNOWN_TYPE(NT003)`.
- **의도**: 알림 도메인 에러 어휘. `UNKNOWN_TYPE` 은 notification.domain 도 쓰지만, core 가 함께 쓰므로 core 소유(위 sink 논리 동일).

---

## storage/notification/

### `NotificationEntity.java` — @Entity(`notifications`)
- **기능**: `senderId`(nullable), `receiverId`, `typeCode`, `referenceId`(nullable), `content`(text), `templateArgs`(text), `readAt`(nullable). `isRead()`=readAt≠null, `markRead()`.
- **의도**: 이동 정보는 `type_code + reference_id`(구조화)로만 저장하고 `link` 컬럼은 두지 않는다. 읽음은 `read_at IS NULL` 로 판단(`is_read` 컬럼 없음). `template_args` 로 렌더 변수 스냅샷 보관.

### `NotificationRepository.java` — JpaRepository
- **기능**: `findByReceiverId`(Window 커서), `countByReceiverIdAndReadAtIsNull`, `markAllReadByReceiverId`(@Modifying update).
- **의도**: 조회/읽음에 필요한 최소 쿼리.

### `NotificationReferenceType.java` — enum
- **기능**: `NONE, CHAT_ROOM, PROFILE, COWORKER_REQUEST, OFFER, CONTRACT`.
- **의도**: "프론트가 이동할 화면 의미"(테이블명 아님). `NotificationType` 이 이 값을 갖고 링크를 만든다.

---

## storage/device/

### `DeviceTokenEntity.java` — @Entity(`device_tokens`)
- **기능**: `memberId`, `token`(unique), `platform`, `snsEndpointArn`, `enabled`(기본 true), `lastActiveAt`, 감사 필드. `refresh(memberId, arn)`(재등록 갱신+활성화), `disable()`.
- **의도**: **`BaseEntity` 를 상속하지 않음** — 다른 엔티티의 soft-delete 정책과 달리 device token 은 해제 시 **물리 삭제**해야 unique(token) 재사용이 깔끔하므로 감사 필드만 직접 부착. `enabled` 는 죽은 endpoint(EXPIRED/INVALID) 비활성화 플래그.

### `DeviceTokenRepository.java` — JpaRepository
- **기능**: `findByToken`, `findByMemberIdAndToken`, `findByMemberIdAndEnabledTrue`.
- **의도**: 등록 upsert(token 조회), 소유자 검증, 발송 대상(활성 device) 조회.

### `DevicePlatform.java` — enum
- **기능**: `web, android, ios`.
- **의도**: 토큰 발급 플랫폼 구분(향후 플랫폼별 payload 분기 여지).

---

## 참고
- 흐름·시퀀스·의존 규칙 : [notification-architecture.md](./notification-architecture.md)
- 의존성 규칙 강제 : `PackageDependencyTest`(sink·`notificationDomainIsPortSide`) · `LayerDependencyTest`
- 통합 검증 : `NotificationFlowIntegrationTest`(발송·비활성화·다중 device) · `NotificationQueryIntegrationTest`(조회·권한)
</content>
