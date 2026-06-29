# 알림(AWS SNS Push) 구현 현황 + 아키텍처

> **For**: 알림 기능을 처음 보거나 이어받는 BE/FE 작업자.
> **You'll be able to**: 알림이 **AWS SNS 기반**으로 어떻게 동작하는지 이해하고, 무엇이 구현됐고 무엇이 남았는지 파악.

**작성일**: 2026-06-29
**상태**: **BE 구현 완료** · **인프라(Terraform) 코드 작성·미적용** · **FE 재배선 남음**
**이슈**: [#211 feat(be): implement notification apis](https://github.com/mortonCareer/bconnect/issues/211)
**관련 문서**: [딥링크 규칙](../notification-deeplinks.md) · [배경: FCM 시절 현황](./2026-06-19-notification-fcm-status.md)(전송 채널을 FCM→SNS로 바꾸기 전 문서. 본 문서가 최신.)

---

## 1. 한 줄 요약

알림 푸시 전송 채널은 **AWS SNS Mobile Push**다. **BE는 AWS SNS로 발송**하고, **FE는 Firebase Web SDK로 브라우저 디바이스 토큰만 발급**한다. 알림 BE(디바이스 토큰 저장 + 알림 저장/조회 + 채팅 이벤트 발송 + 실패 토큰 정리)는 **구현 완료**다. 실제 운영 발송은 인프라(SNS 리소스·권한·환경변수)를 적용한 뒤 켜진다.

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
4. **클릭**: 알림을 누르면 딥링크(`/n/{대상타입}/{대상ID}`, 예 `/n/chat_room/42`)로 이동한다. 상세 규칙은 [딥링크 문서](../notification-deeplinks.md).

### 누구에게 저장하고, 누구에게 푸시하나 (중요)

- **DB 저장 대상** = 채팅 참여자 − 발신자 → **전원**. (지금 채팅방에 들어와 있던 사람도 알림 이력은 남아야 하므로.)
- **푸시 발송 대상** = 위 대상 중 **그 채팅방에 실시간 접속(WebSocket)하지 않은 사람만**. (접속 중이면 이미 화면에서 메시지를 보고 있으므로 푸시는 생략.)
- **발송 시점** = 메시지·알림이 DB에 **저장 완료(커밋)된 뒤**. 발송이 실패해도 채팅 저장이 취소되지 않도록 분리했다.

---

## 4. 데이터 모델

알림은 두 테이블로 구성된다.

```
Notification (알림 1건)                 NotificationType (알림 종류, 종류당 1행)
  id                                      code            종류 코드 (예: CHAT_MESSAGE)
  sender_id     보낸 사람(시스템이면 없음)  reference_type  딥링크 대상 타입 (예: chat_room)
  receiver_id   받는 사람                  message         문구 템플릿 ("{sender}님이 …")
  type_code  ── 어느 종류인지 (FK) ───────┘
  reference_id  딥링크가 가리키는 대상 ID (채팅이면 채팅방 ID)
  content       알림 내용 스냅샷 (메시지 미리보기, 없을 수 있음)
  read_at       읽은 시각 (안 읽었으면 비어 있음)
  created_at / modified_at / deleted_at
```

설계 포인트(처음 보는 사람을 위한 설명):

- **문구는 종류별로 1개**: 같은 종류의 알림은 `NotificationType.message` 템플릿을 공유한다. 알림 행마다 문구를 저장하지 않아 가볍고, 문구 수정이 한 번에 반영된다.
- **보낸 사람 이름은 조회할 때 채운다(render-on-read)**: 템플릿의 `{sender}`는 알림을 **읽는 시점**에 `sender_id`로 현재 이름을 찾아 치운다. 그래서 보낸 사람이 이름을 바꿔도 목록에 항상 최신 이름이 보인다.
- **내용 스냅샷(`content`)**: 채팅 미리보기처럼 "그때 그 내용"이 필요한 값은 알림 행에 **발송 시점 그대로 저장**한다. 원본 메시지가 나중에 수정·삭제돼도 알림 미리보기는 안전하다. (지금은 채팅 미리보기 한 덩어리만 쓰지만, 필요하면 나중에 확장 가능.)
- **읽음은 `read_at` 시각으로 표현**: "읽음/안읽음" 불리언 대신 읽은 시각을 저장한다. 비어 있으면 안 읽은 것이고, 값이 있으면 언제 읽었는지도 남는다.
- **종류 등록(시딩)**: 서버가 켜질 때 알림 종류 행을 자동으로 채운다(없으면 추가, 있으면 문구 최신화). 현재 등록된 종류는 `CHAT_MESSAGE`(채팅 메시지) 하나다. 새 알림 종류는 코드에 한 줄 추가하면 늘어난다.

---

## 5. 구현 현황

### 기능 (BE = 완료)

| 영역           | 내용                                                            | 상태                     |
| -------------- | --------------------------------------------------------------- | ------------------------ |
| 푸시 전송기    | AWS SNS로 발송. 로컬/테스트는 발송 대신 로그만 남기는 대체 구현 | ✅                       |
| 디바이스 토큰  | `device_tokens` 저장 + `POST/DELETE /api/v1/devices`            | ✅                       |
| 알림 저장 모델 | `notifications`/`notification_types` + 종류 자동 등록           | ✅                       |
| 채팅 트리거    | 채팅 메시지 → DB 저장 + 비접속자에게 발송                       | ✅                       |
| 알림 조회      | 목록 / 안읽음 개수 / 읽음 처리                                  | ✅                       |
| 실패 토큰 정리 | 발송 실패한(만료·무효) endpoint 비활성화                        | ✅                       |
| 인프라         | SNS 리소스·IAM 권한·환경변수 (Terraform)                        | 🟡 코드 작성, **미적용** |

### API

| 메서드 | 경로                                 | 설명                                                     |
| ------ | ------------------------------------ | -------------------------------------------------------- |
| POST   | `/api/v1/devices`                    | 디바이스 토큰 등록(중복 등록은 갱신, endpoint 자동 생성) |
| DELETE | `/api/v1/devices`                    | 토큰 해제(endpoint·행 삭제)                              |
| GET    | `/api/v1/notifications`              | 알림 목록(커서 페이징)                                   |
| GET    | `/api/v1/notifications/unread-count` | 안 읽은 알림 개수                                        |
| PATCH  | `/api/v1/notifications/{id}/read`    | 단건 읽음(본인 알림만)                                   |
| PATCH  | `/api/v1/notifications/read-all`     | 모두 읽음                                                |

OpenAPI 스펙은 `packages/api-client/src/spec/v1/notifications.yaml`(+ `openapi.yaml` 등록)에 있고, `pnpm api:generate`로 FE 클라이언트가 생성된다.

### 주요 파일

- 전송기: `apps/api/.../support/push/` (`PushSender`, `SnsPushSender`, `LoggingPushSender`, `SnsConfig`, `SnsProperties`, endpoint 레지스트리들)
- 디바이스: `apps/api/.../storage/device/`, `core/domain/device/DeviceService`, `core/presentation/v1/DeviceController`
- 알림: `apps/api/.../storage/notification/`, `core/domain/notification/` (`NotificationService`=발송, `NotificationQueryService`=조회, `NotificationTypeRegistry`=종류 등록), `core/presentation/v1/NotificationController`
- 채팅 연결점: `apps/api/.../socket/message/MessageSocketService`
- 스키마/설정: `apps/api/src/main/resources/schema.sql`, `application.yaml`(`app.sns.*`)

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

**통과(로컬/테스트, 실제 SNS 불필요)**:

- 단위 테스트 — 읽음 처리, 종류 자동 등록, "전원 저장 / 비접속자만 푸시" 분기, 보낸 사람 이름 최신 렌더, 본인 알림만 읽기, 실패 토큰 비활성화.
- 서버 기동 테스트 — 스키마·종류 등록·빈(bean) 연결.
- OpenAPI 생성.

**미검증(인프라 적용 후 확인 필요)**:

- AWS SNS가 FCM 서비스계정 키를 정상 수락하는지.
- 발송 payload가 실제 브라우저에 도달하는지.
- 만료·무효 토큰일 때 SNS가 돌려주는 오류 형태(실패 토큰 정리 로직의 판정 기준 확인).

---

## 8. 남은 작업

1. **인프라 적용**: FCM 서비스계정 키를 비밀 설정에 넣고 Terraform 적용 → dev에서 실제 발송 확인.
2. **FE 재배선**(별도 작업): FE 푸시 코드와 `devices.yaml`을 현재 BE 계약에 맞추고, 딥링크(`/n/...`) 연결, plan 앱에도 푸시 적용.
3. **E2E 확인**: 두 브라우저로 실제 채팅 → 비접속 수신자에게 OS 푸시 + 목록/안읽음 반영 + 만료 토큰 정리까지 확인.
