# 알림(AWS SNS Push) 구현 현황 + 아키텍처

> **For**: 알림 기능을 처음 보거나 이어받는 BE/FE 작업자.
> **You'll be able to**: 알림이 **AWS SNS 기반**으로 어떻게 동작하는지 이해하고, 무엇이 구현됐고 무엇이 남았는지 파악.

**작성일**: 2026-06-29 (업데이트: 2026-07-10)
**상태**: **BE 구현 완료** · **`notification` 모듈 이관 · 타입 카탈로그 enum화 · 온보딩(가입 축하·프로필 완성) 알림 배선 완료** · **로컬 `local,sns` 프로파일로 실제 SNS→FCM→브라우저 도달 E2E 검증 완료(2026-07-10)** · **운영 인프라(Terraform) 미적용** · **FE 재배선 남음**
**이슈**: [#211 feat(be): implement notification apis](https://github.com/mortonCareer/bconnect/issues/211)
**관련 문서**: [배경: FCM 시절 현황](./2026-06-19-notification-fcm-status.md) (3.3 딥링크 규칙 포함, 전송 채널을 FCM→SNS로 바꾸기 전 문서. 본 문서가 최신.)

---

## 1. 한 줄 요약

알림 푸시 전송 채널은 **AWS SNS Mobile Push**다. **BE는 AWS SNS로 발송**하고, **FE는 Firebase Web SDK로 브라우저 디바이스 토큰만 발급**한다. 알림 BE(디바이스 토큰 저장 + 알림 저장/조회 + 채팅·온보딩(첫 기기 등록) 이벤트 발송 + 실패 토큰 정리)는 **구현 완료**이고, 실제 SNS→FCM→브라우저 도달까지 로컬(`local,sns`)에서 검증했다. 운영(dev/prod) 발송은 인프라(SNS 리소스·권한·환경변수)를 적용한 뒤 켜진다.

---

## 2. 알림이 닿는 두 경로

사용자에게 알림은 **두 가지 방식**으로 닿고, BE는 둘 다 채워야 한다.

| 경로              | 언제                                          | 데이터 출처                             |
| ----------------- | --------------------------------------------- | --------------------------------------- |
| **푸시(OS 알림)** | 사용자가 해당 화면에 없을 때 BE가 실시간 발송 | AWS SNS → 브라우저 Service Worker       |
| **인앱 목록**     | 사용자가 알림함을 열람                        | `GET /api/v1/notifications` (DB 저장분) |

→ 한 번의 알림 이벤트(예: 새 채팅 메시지)는 **DB에 영구 저장**(목록용)되고 **동시에 SNS로 발송**(푸시용)된다.

---

## 3. 동작 흐름

```
┌─ FE (career/plan) ───────────────┐      ┌─ Firebase ─────────────┐
│ 권한 허용 → 디바이스 토큰 발급     │─토큰→│ FCM 프로젝트 + VAPID    │
│ POST /api/v1/devices (토큰 등록)  │      └───────────┬─────────────┘
└───────────────────────────────────┘                 │ FCM HTTP v1
                                                        ▲
┌─ BE (apps/api) ─────────────────────────────┐        │
│ ① device_tokens 저장 (member↔token↔endpoint)│   ┌─ AWS SNS ──────────┐
│ ② 채팅 이벤트 → 수신자 endpoint 조회          │──→│ Platform App        │
│ ③ SNS publish                                │   │ + Endpoint(토큰별)   │
│ ④ Notification DB 저장(목록/안읽음용)         │   └──────────┬──────────┘
│ ⑤ 발송 실패 토큰 비활성화                      │              ▼ OS 푸시 → 브라우저
└────────────────────────────────────────────────┘
```

1. **토큰 등록**: FE가 브라우저 푸시 토큰을 발급해 `POST /api/v1/devices`로 보낸다. BE는 이 토큰으로 SNS에 "엔드포인트(endpoint)"를 만들고, `토큰 ↔ endpoint ARN ↔ 회원` 매핑을 `device_tokens`에 저장한다.
2. **이벤트 발생**: 채팅 메시지가 오면 BE가 수신자를 계산한다.
3. **저장 + 발송**: 알림을 DB에 저장하고(목록에 남도록), 푸시 대상에게 SNS로 발송한다(브라우저에 OS 알림이 뜨도록).
4. **클릭**: 알림을 누르면 딥링크(`/n/{대상타입}/{대상ID}`, 예 `/n/chat_room/42`)로 이동한다. 상세 규칙은 [배경 문서의 3.3 딥링크 설명](./2026-06-19-notification-fcm-status.md)에 있다.

### 누구에게 저장하고, 누구에게 푸시하나 (중요)

- **DB 저장 대상** = 채팅 참여자 − 발신자 → **전원**. (지금 채팅방에 들어와 있던 사람도 알림 이력은 남아야 하므로.)
- **푸시 발송 대상** = 위 대상 중 **그 채팅방에 실시간 접속(WebSocket)하지 않은 사람만**. (접속 중이면 이미 화면에서 메시지를 보고 있으므로 푸시는 생략.)
- **발송 시점** = 메시지·알림이 DB에 **저장 완료(커밋)된 뒤**. 발송이 실패해도 채팅 저장이 취소되지 않도록 분리했다.

---

## 4. 데이터 모델

알림 기록은 `notifications` 테이블 하나로 구성되고, 종류·문구·이동 링크는 `NotificationType` enum이 소유한다(테이블 아님).

```
Notification (알림 1건, 테이블)         NotificationType (알림 종류 = enum, 코드가 소유 · 테이블 아님)
  id                                      CHAT_MESSAGE        %s님이 메시지를 보냈습니다
  sender_id     보낸 사람(시스템이면 없음)  SIGNUP_WELCOME      회원가입을 축하드립니다
  receiver_id   받는 사람                  PROFILE_COMPLETION  프로필을 완성하고 …
  type_code  ── enum name (예: CHAT_MESSAGE) COWORKER_REQUESTED · OFFER_RECEIVED · CONTRACT_WRITTEN
  reference_id  딥링크가 가리키는 대상 ID     └ reference_type · 문구 템플릿 · 링크를 enum 이 소유
  content       알림 내용 스냅샷 (메시지 미리보기, 없을 수 있음)
  template_args 렌더 변수 스냅샷 (JSON, 예: {"senderName":"홍길동"})
  read_at       읽은 시각 (안 읽었으면 비어 있음)
  created_at / modified_at / deleted_at
```

설계 포인트(처음 보는 사람을 위한 설명):

- **종류는 테이블이 아니라 enum**: 알림 종류·문구 템플릿(`%s` format string)·이동 링크·`reference_type`은 `NotificationType` enum이 소유한다. `notification_types` 테이블·시딩(Registry)은 없앴다. DB에는 `type_code`(enum name)와 `reference_id`만 저장하고, 문구·링크는 조회/발송 시 enum이 렌더한다. 새 종류는 enum 상수 한 줄로 늘어난다. 현재 6종(`CHAT_MESSAGE` · `SIGNUP_WELCOME` · `PROFILE_COMPLETION` · `COWORKER_REQUESTED` · `OFFER_RECEIVED` · `CONTRACT_WRITTEN`).
- **렌더 변수는 스냅샷(`template_args`)으로 저장**: `%s`에 들어갈 값(예: `senderName`)은 이벤트 시점에 JSON 스냅샷으로 굳혀 `template_args`에 저장한다. 목록 조회·push 모두 이 스냅샷을 렌더에 쓰므로 DB 히스토리와 push 문구가 일치한다. 스냅샷이 비어 있을 때만 현재 `sender_id`로 이름을 대체한다(render-on-read fallback).
- **내용 스냅샷(`content`)**: 채팅 미리보기처럼 "그때 그 내용"이 필요한 값은 알림 행에 **발송 시점 그대로 저장**한다. 원본 메시지가 나중에 수정·삭제돼도 알림 미리보기는 안전하다.
- **읽음은 `read_at` 시각으로 표현**: "읽음/안읽음" 불리언 대신 읽은 시각을 저장한다. 비어 있으면 안 읽은 것이고, 값이 있으면 언제 읽었는지도 남는다.

---

## 5. 구현 현황

### 기능 (BE = 완료)

| 영역           | 내용                                                                  | 상태                     |
| -------------- | --------------------------------------------------------------------- | ------------------------ |
| 푸시 전송기    | AWS SNS로 발송. 로컬/테스트는 발송 대신 로그만 남기는 대체 구현       | ✅                       |
| 디바이스 토큰  | `device_tokens` 저장 + `POST/DELETE /api/v1/devices`                  | ✅                       |
| 알림 저장 모델 | `notifications` + 타입 카탈로그 enum(`NotificationType`, 테이블 없음) | ✅                       |
| 채팅 트리거    | 채팅 메시지 → DB 저장 + 비접속자에게 발송                             | ✅                       |
| 온보딩 트리거  | 첫 기기 등록 → 가입 축하(항상) + 프로필 완성(미완성 시) 본인 발송     | ✅                       |
| 알림 조회      | 목록 / 안읽음 개수 / 읽음 처리                                        | ✅                       |
| 실패 토큰 정리 | 발송 실패한(만료·무효) endpoint 비활성화                              | ✅                       |
| 인프라         | SNS 리소스·IAM 권한·환경변수 (Terraform)                              | 🟡 코드 작성, **미적용** |

### API

| 메서드 | 경로                                 | 설명                                                     |
| ------ | ------------------------------------ | -------------------------------------------------------- |
| POST   | `/api/v1/devices`                    | 디바이스 토큰 등록(중복 등록은 갱신, endpoint 자동 생성) |
| DELETE | `/api/v1/devices`                    | 토큰 해제(endpoint·행 삭제)                              |
| GET    | `/api/v1/notifications`              | 알림 목록(커서 페이징)                                   |
| GET    | `/api/v1/notifications/unread/count` | 안 읽은 알림 개수                                        |
| PATCH  | `/api/v1/notifications/{id}/read`    | 단건 읽음(본인 알림만)                                   |
| PATCH  | `/api/v1/notifications/read`         | 모두 읽음                                                |

OpenAPI 스펙은 BE springdoc 산출물(`packages/api-client/src/openapi.yaml`, CI가 재생성)이며, `pnpm api:generate`로 FE 클라이언트가 생성된다 ([ADR-0024](../../explanation/adr/0024-orval-consumes-be-springdoc-spec.md)).

### 주요 파일 (`apps/api/.../to/bconnect/api/`)

- 도메인(흐름): `notification/domain/` — `NotificationService`(조립), `NotificationEventListener`(이벤트 진입), `NotificationMessageFactory`, `NotificationType`(타입 카탈로그 enum), `DeviceService`, `MemberFirstDeviceRegisteredEvent`
- 대상 계산(전략): `notification/domain/target/` — `NotificationTargetResolver(+Registry)`, `ChatMessageTargetResolver`, `SignupWelcomeTargetResolver`, `ProfileCompletionTargetResolver`, `ResolvedNotification`
- 전송 포트: `notification/domain/push/` — `PushSender`, `PushEndpointRegistry`, `PushPayload`, `PushSendResult`, `PushNotification`
- 전송 어댑터: `notification/infrastructure/push/` — `SnsPushSender`/`SnsEndpointRegistry`/`SnsConfig`/`SnsProperties`(`dev | prod | sns`), `LoggingPushSender`/`LoggingEndpointRegistry`(`(local | test) & !sns`)
- 저장·조회: `core/domain/notification/` — `NotificationLinker`(저장), `NotificationQueryService`(조회), `NotificationArgs`(렌더 변수 스냅샷) · `storage/notification/`, `storage/device/`
- 표현: `notification/presentation/v1/` — `DeviceController`(`/api/v1/devices`), `NotificationController`(`/api/v1/notifications`)
- 채팅 연결점: `socket/message/MessageSocketService` (`ChatMessageSentEvent`만 발행)
- 스키마/설정: `src/main/resources/schema-*.sql`, `application.yaml`(`app.sns.*`), `sns` 프로파일(로컬 실발송 opt-in)

---

## 6. 인프라 (Terraform — 코드만, 아직 적용 안 함)

운영(dev/prod)에서 실제 SNS 발송을 켜려면 AWS 리소스와 환경변수가 필요하다. 관련 Terraform 코드는 `infra/`에 작성돼 있으나 **아직 `apply` 하지 않았다**(AWS/Firebase 자격증명 세팅 대기).

작성된 것:

- SNS 플랫폼 애플리케이션(브라우저 푸시용) 생성 코드 (`infra/aws/sns.tf`)
- 앱 IAM 권한에 SNS endpoint 관리 권한 추가 (`infra/aws/iam.tf`)
- 운영 환경변수 `AWS_SNS_PLATFORM_APPLICATION_ARN` 주입 배선 (`infra/railway/*`)
- 필요한 비밀값(FCM 서비스계정 키)의 예시 placeholder (`infra/terraform.tfvars.example`)

**적용 전 영향**: 환경변수가 비어 있어 BE는 푸시를 **비활성**으로 동작한다(앱은 정상 부팅). 로컬/테스트에서는 발송 대신 로그만 남기는 대체 구현이 쓰인다.

---

## 7. 검증 현황

**통과(로컬/테스트)**:

- 단위 테스트 — 타입 카탈로그 렌더·링크(`NotificationTypeTest`). (세분화 단위·통합 테스트는 다른 도메인 규모에 맞춰 최소화)
- 서버 기동 — 스키마·빈(bean) 연결.
- OpenAPI 생성.

**실제 SNS→FCM→브라우저 E2E 검증 완료 (2026-07-10, `local,sns` 프로파일)**:

- 실제 브라우저 FCM 토큰 발급 → `POST /api/v1/devices`(첫 기기) → 온보딩(가입 축하·프로필 완성) DB 저장 확인.
- AWS SNS `createPlatformEndpoint` 실제 성공(Enabled=true) → `publish` 성공(오류 로그 0, 토큰 비활성화 없음).
- 브라우저 도달 확인 — **포그라운드** `onMessage`, **백그라운드** Service Worker `onBackgroundMessage` OS 알림 팝업 둘 다 수신.

**미검증(운영 인프라 적용 후 확인 필요)**:

- 운영(dev/prod)에서 Terraform으로 SNS 플랫폼 앱·IAM·환경변수 적용 후 실발송.
- 만료·무효 토큰일 때 SNS가 돌려주는 오류 형태(실패 토큰 정리 판정 기준 실데이터 확인).

---

## 8. 남은 작업

1. **운영 인프라 적용**: FCM 서비스계정 키를 비밀 설정에 넣고 Terraform 적용 → dev에서 실제 발송 확인.
2. **FE 재배선**(별도 작업): FE 푸시 코드를 현재 BE 계약에 맞추고, 딥링크(`/n/...`) 연결, plan 앱에도 푸시 적용.
3. **채팅 E2E**: 두 브라우저로 실제 채팅 → 비접속 수신자에게 OS 푸시 + 목록/안읽음 반영 + 만료 토큰 정리까지 확인. (온보딩 경로는 `local,sns`로 검증 완료)
