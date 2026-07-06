# 알림(FCM Web Push) 구현 현황 + 아키텍처

> **For**: 알림 BE 담당 신규 팀원 **전지원** + 이어받는 FE 작업자.
> **You'll be able to**: 현재 알림 아키텍처가 어떻게 도는지 이해하고, FE·인프라가 완성된 상태에서 BE가 무엇을 채워야 E2E 푸시가 켜지는지 파악.

**작성일**: 2026-06-19
**상태**: **FE·인프라 완료, BE만 미구현** — BE에서 (1) FCM SDK 의존성 + (2) 알림 API 구현 두 가지만 남음
**SSOT 이슈**: [#211 feat(be): implement notification apis](https://github.com/mortonCareer/bconnect/issues/211) (OPEN) — 알림 BE를 최종 관리하는 우산 이슈. [#233](https://github.com/mortonCareer/bconnect/issues/233)을 흡수함(CEO 코멘트 "#233 이슈도 함께 다룹니다").
**관련 문서**: [알림 인프라 (FCM Web Push) — Notion](https://www.notion.so/340965d2888b815b929ce3ddc3fe493f), [infra/firebase/README.md](../../../infra/firebase/README.md)

---

## 1. 한 줄 요약

FCM은 **프로젝트 등록만** 된 게 아니라 **FE·인프라가 통째로 완성**돼 있다. 막힌 곳은 **BE 딱 두 가지** — ① `firebase-admin` SDK 의존성 추가, ② 알림 API 구현(디바이스 토큰 + 알림 목록 + FCM 발송). 이게 비어 있어 E2E 푸시 루프가 안 돈다.

이 레포는 BE-first SSOT([ADR-0015](../../explanation/adr/0015-be-code-as-api-ssot.md))다. 알림은 인프라·FE가 먼저 깔린 예외 케이스지만, **API 형태의 진실은 BE 구현이 정한다**. BE가 [#211](https://github.com/mortonCareer/bconnect/issues/211)에서 엔드포인트를 확정하면 FE가 거기에 맞춘다.

---

## 2. 이슈 지도

| 이슈                                                            | 제목                                      | 상태        | 역할                                                                                |
| --------------------------------------------------------------- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| [#215](https://github.com/mortonCareer/bconnect/issues/215)     | Web Push 알림 인프라 구축 (FCM + SW)      | ✅ CLOSED   | 최초 우산. Firebase 설정 + FE Service Worker 완료, BE는 #233으로 분리               |
| [#233](https://github.com/mortonCareer/bconnect/issues/233)     | feat(api): implement push notification    | ✅ CLOSED   | BE 푸시(디바이스 토큰 + FCM 발송) 분리 이슈. **#211로 흡수되어 닫힘** (코드 미구현) |
| [#347](https://github.com/mortonCareer/bconnect/issues/347)     | feat(plan): 알림 패널 — Sprint 2          | ✅ CLOSED   | **FE** plan 알림 패널 (PR #480/#486/#505). BE 아님                                  |
| **[#211](https://github.com/mortonCareer/bconnect/issues/211)** | **feat(be): implement notification apis** | **🟢 OPEN** | **현재 알림 BE를 최종 관리하는 SSOT 이슈** (전지원 담당)                            |

> 코드 주석·문서 곳곳에 남은 `#233`/`#347` 참조는 **스테일**이다(6장 참조). 알림 BE 작업의 단일 기준은 **#211**.

---

## 3. 알림 아키텍처 (BE 담당자용 설명)

### 3.1 큰 그림

웹 브라우저에 직접 푸시한다 — 앱 래핑(Capacitor) 없이 FCM Web Push. Android Chrome 완벽 지원, iOS Safari 16.4+ 지원. 나중에 Play 출시 시 같은 FCM 프로젝트 재사용.

```
┌─ FE (career, 완료) ──────────────┐      ┌─ Firebase (인프라, 완료) ─┐
│ 권한 허용 → FCM 토큰 발급          │      │ FCM 프로젝트 bconnect-f0bee │
│ usePushNotifications 훅           │─토큰→│ VAPID key (주입 완료)      │
│ POST /api/v1/devices (토큰 등록)  │      └────────────┬───────────────┘
└───────────────────────────────────┘                   │
                                                          │ ④ FCM이 토큰으로 라우팅
┌─ BE (apps/api, ★미구현★) ────────────────────┐         ▼
│ ① device_tokens 저장 (member_id↔token)        │   ┌─ FE 수신 (완료) ──────────┐
│ ② 이벤트 발생(채팅 등) → 수신자 토큰 조회       │   │ 백그라운드: Service Worker │
│ ③ firebase-admin 으로 FCM 발송                 │──→│   → OS 알림                 │
│ ⑤ GET /api/v1/notifications (목록/안읽음)      │   │ 포그라운드: 훅 → in-app 토스트│
└─────────────────────────────────────────────────┘   │ 클릭 → 딥링크 네비게이트     │
                                                        └────────────────────────────┘
```

★ 표시 = BE가 채울 부분. 나머지는 다 돈다.

### 3.2 두 개의 수신 표면 — 헷갈리기 쉬운 부분

알림은 **두 경로**로 사용자에게 닿는다. BE가 둘 다 먹여야 한다.

| 표면               | 트리거                                  | 데이터 출처                 | 클릭 시                              |
| ------------------ | --------------------------------------- | --------------------------- | ------------------------------------ |
| **푸시 (OS 알림)** | BE가 FCM으로 실시간 발송 (앱 비활성 시) | FCM payload                 | Service Worker가 딥링크로 네비게이트 |
| **인앱 목록**      | 사용자가 알림함/패널 열람               | `GET /api/v1/notifications` | FE가 딥링크로 네비게이트             |

→ BE는 **발송 시점(push)** 과 **저장/조회(list)** 둘 다 구현해야 한다. 같은 알림 이벤트가 FCM 발송 + DB 저장 양쪽으로 가야 목록에도 남는다.

### 3.3 딥링크 — reference 기반 (④ 제네릭 리다이렉트)

알림 클릭 목적지는 **참조 기반**으로 정한다 (CEO ERD 정합 — 완성 URL 아님):

- `Notification.reference_id` = 가리키는 엔티티 ID
- `NotificationType.reference_type` (EntityType) = 그 엔티티 타입 — **`type` 경유로 결정** (Notification 행엔 reference_type 없음, 3.6 참조)

→ 딥링크 = `reference_type`(type 경유) + `reference_id`. **CEO Figma 요구사항의 단일 `link` 필드는 stale** — ERD 의 `NotificationType.reference_type` + `Notification.reference_id` 로 **확정**.

**④ 제네릭 리다이렉트 라우트**: SW·앱은 매핑 없이 `/n/{reference_type}/{reference_id}` 로만 이동, 각 앱의 `/n/[referenceType]/[referenceId]` 라우트 1곳이 `type→실경로` resolve+redirect. → **맵 SSOT 1곳**(SW(JS)/앱(TS) 중복 제거), 푸시+목록 통일.

> **왜 `/n/` 인가**: 알림 클릭 시 `reference_type`(chat_room)+`reference_id`(42)를 실경로(`/messages/42`)로 바꾸는 **맵**이 필요하다. 근데 SW(plain JS)는 앱의 TS 맵을 import 못 함 → ② 맵을 SW·앱 양쪽에 복제하거나, ④ **`/n/` 라우트 1곳에 맵을 모으고** SW·앱은 `/n/{type}/{id}` 만 조립해 이동. `/n/` 은 그 변환을 전담하는 경유 라우트(이름은 임의 — notification 약자, `/go/` 등 무엇이든 됨). ④를 택한 건 맵 중복(②)을 없애려고.

- career = full-page (`/n/chat_room/42` → `/messages/42`)
- plan = 패널 (`/n/chat_room/42` → `?panel=messages/42`)
- → 앱별 맵이 달라서 `/n/` 라우트가 그 차이를 흡수. SW/payload 는 동일.

> 본 문서 "완료된 것"의 SW `data.url` 은 **로컬 테스트 현행**이며, 별도 PR(8장)에서 `/n/` 방식으로 교체된다.

### 3.4 알림 설정 정책

초기엔 **사용자별 on/off 설정 없이 전부 발송**(#211 코멘트, CEO 확정). 발송 정책은 "수신자가 해당 컨텍스트에 활성(WebSocket 연결 중)이 아닐 때만" 정도만. 사용자 커스터마이즈는 향후 확장.

### 3.5 발송 트리거 우선순위

1. **채팅** (1순위) — 새 메시지 수신, 수신자가 그 채팅방 WebSocket에 없을 때만
2. 구인 매칭 — 새 매칭 제안 (향후)
3. 시스템 — 공지 (향후)

### 3.6 알림 데이터 모델 — ERD (CEO 확정)

FCM 푸시는 **일시적**(fire-and-forget) — FCM 은 아무것도 저장 안 함. 알림 패널([NotificationsView](../../../packages/features/src/notifications/NotificationsView.tsx))의 히스토리·안읽음은 BE 가 DB 저장해야 성립. 한 이벤트 = sink 2개: ① DB INSERT(영구) + ② FCM 발송(일시).

**CEO ERD (Figma board — [Notification 391:458](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=391-458) · [NotificationType 695:1370](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=695-1370)) 기준 — 두 엔티티:**

```
Notification                         NotificationType  (타입당 1행 = 레지스트리)
  id            PK                      code           String  (타입 코드, COWORKER_REQUEST 등)
  sender_id     FK, nullable (시스템)   reference_type EntityType (reference_id 가 가리키는 타입 — 딥링크용)
  receiver_id   FK (수신자)             message        String  (템플릿, 변수 포함)
  type          → NotificationType
  reference_id  Long (대상 엔티티 ID)
  is_read       boolean
  (created_at)  ※ ERD 미표기 — 목록 정렬에 필요, BaseTimeEntity 추정
```

**렌더 (render-on-read)**: `Notification.type` → `NotificationType.message`(템플릿)+`reference_type` 조회 → 템플릿 변수를 Notification 행에서 채움. `{sender}` 는 `sender_id` 로 **조회 시 렌더** → 발신자 개명해도 항상 최신.

**핵심 설계 포인트:**

- **category 없음** — `type`(NotificationType)이 분류·아이콘·템플릿·딥링크엔티티를 모두 결정. 별도 카테고리 레이어 불필요 (논의 종결, 제거). Phase2 on/off 설정도 `type` 단위 토글이면 됨.
- **template 은 per-row 아님** — `NotificationType.message` 에 타입당 1개 (DB 레지스트리). 오타 수정 일괄 반영, 알림 행은 가벼움.
- **reference_type 도 per-row 아님** — `NotificationType.reference_type` 에 타입당 1개. 알림 행엔 `reference_id` 만 (3.3 딥링크).
- **actor = render-on-read** (`sender_id` → 현재 이름).

**세 표현** (DB 엔티티 = canonical, 푸시·목록은 투영): 같은 알림이 ① DB(Notification+NotificationType, 영구) ② 푸시 payload(발송시 렌더 스냅샷) ③ 목록 응답(render-on-read)로 나타남. 충돌 시 ① 이 정답.

**⚠️ 미결 (CEO 확정 대기) — 콘텐츠 변수(채팅 미리보기) 저장 위치:**

현 ERD 엔 알림 행에 콘텐츠 저장 필드가 없다 → `{preview}` 같은 **per-row 변수**를 둘 곳이 없다 (message 템플릿은 타입당 공유라 sender 등 행 필드만 채움). 3안:

| 안    | 방식                                               | 스키마                      |
| ----- | -------------------------------------------------- | --------------------------- |
| **A** | `args` JSON 변수맵 (범용, 다변수·미래 대비)        | `Notification.args` JSONB   |
| **B** | 미리보기 없음 ("{sender}님이 메시지를 보냈습니다") | ERD 무변경                  |
| **C** | 단순 콘텐츠 스냅샷 1덩이                           | `Notification.content` text |

`actor=sender_id 렌더`는 셋 다 공통 (콘텐츠 변수 한 축만 다름). 콘텐츠는 **스냅샷**(삭제·편집 안전, 푸시 정합) — 재계산(reference 조회)은 chat_room→어느 메시지 모호 + 삭제 깨짐으로 버림. **CTO 추천 = C** (채팅 한 덩이면 충분, C→A 비파괴 이관). 프라이버시(잠금화면 노출)는 스키마와 별개 정책 — OS 설정 + Phase3 토글. **CEO 결정 필요: 미리보기 담나 + 담으면 A/C.**

### 3.7 알림 시나리오 ([CEO Figma 1469:4999](https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS/?node-id=1469-4999))

각 시나리오 = `NotificationType` 1행 (`code` + `reference_type` + `message`) + per-알림 `sender_id`/`reference_id`. 설정은 초기 미지원·모두 발송. (아래 `ref=` 는 `reference_type` = 딥링크 대상 엔티티 타입, 3.3)

- **시스템** (sender 보통 null): 회원가입 축하 · 업데이트 공지(+link) · 프로필 관리 제안 · 문의/신고 접수·응답
- **기능** (sender=행위자): 동료요청(ref=`coworker_request`) · 추천서 작성(ref=`recommendation`) · 추천인(`Recommendation.from_id` 기반 — 트리거 #12 확인 필요) · 섭외요청(ref=`chat_room`)
- **모집관리** (plan 측): 섭외 승낙/거절 · 섭외 요청
- **확장성** (향후 — **새 `type` 추가만으로 흡수, 스키마 불변**): 고객 요청사항 · 권한 요청/승낙·거절 · 견적 등록 · 계약 등록(타인/자신) · 전자서명 · 청구서 생성(자신/타인)

> **양방향**(채팅·동료·섭외 = career↔plan 둘 다 수신) → plan 도 푸시 스택 필요(8.2). 집계형(프로필 조회수 등)은 별도(재계산·주기집계, 향후). **OTP·FCM 토큰등록은 알림 테이블 대상 아님** (다른 채널).

---

## 4. E2E 푸시 흐름 — 어디가 끊겼나

```
권한 허용              ✅ 브라우저 FCM 토큰 발급
   ↓
✅ FE → POST /api/v1/devices (토큰 등록)
   ↓
❌ BE 디바이스 토큰 저장                ← 미구현 (블로커 ①)
   ↓
[BE 이벤트 발생: 채팅 등]
   ↓
❌ BE 디바이스 조회 → firebase-admin 발송 + DB 저장   ← 미구현 (블로커 ②)
   ↓
✅ FCM 라우팅 (Firebase 인프라)
   ↓
✅ SW 백그라운드 수신 / JS 훅 포그라운드 수신
   ↓
✅ OS 알림 (백그라운드) / in-app 토스트 (포그라운드)
   ↓
✅ 클릭 → 딥링크 네비게이트 (`/n/{reference_type}/{reference_id}`, 3.3)
```

가운데 BE 두 칸만 채우면 켜진다.

---

## 5. 완료된 것 (production-ready)

### 인프라

| 항목                                                                        | 상태 | 위치                                                            |
| --------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- |
| Firebase 프로젝트(`bconnect-f0bee`), Web App 2개(career/plan), FCM API 활성 | ✅   | [infra/firebase/main.tf](../../../infra/firebase/main.tf)       |
| VAPID key **생성 + tfvars 주입 완료**                                       | ✅   | `infra/terraform.tfvars` (gitignored, S3 backend state)         |
| Vercel env 주입 (`NEXT_PUBLIC_FIREBASE_*` × career/plan × prod/preview/dev) | ✅   | [infra/vercel/projects.tf](../../../infra/vercel/projects.tf)   |
| 모듈 output (`web_configs` per-app SDK config)                              | ✅   | [infra/firebase/outputs.tf](../../../infra/firebase/outputs.tf) |

> **VAPID 주의**: Firebase가 VAPID 생성 API를 안 줘서 콘솔 수동 생성 → tfvars 주입(IaC 예외). 이미 주입 끝. **교체 시 전체 디바이스 토큰 무효화**되므로 절대 재생성 금지. 상세는 [infra/firebase/README.md](../../../infra/firebase/README.md).

### Frontend

| 항목                                                                      | 상태 | 위치                                                                                                                                                                                                   |
| ------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firebase SDK lazy init (로컬 config 누락 안전 처리, `isSupported()` 가드) | ✅   | [packages/push/src/firebase.ts](../../../packages/push/src/firebase.ts)                                                                                                                                |
| FCM 토큰 수명주기 훅 (init→권한→토큰→서버등록, 포그라운드 메시지 구독)    | ✅   | [packages/push/src/use-push-notification-listener.ts](../../../packages/push/src/use-push-notification-listener.ts)                                                                                    |
| 훅 **실제 마운트** (앱 진입 시 호출)                                      | ✅   | [apps/career/src/app/providers.tsx:30](../../../apps/career/src/app/providers.tsx#L30)                                                                                                                 |
| 백그라운드 SW (런타임 config 주입 Route Handler)                          | ✅   | [firebase-messaging-sw.js/route.ts](../../../apps/career/src/app/firebase-messaging-sw.js/route.ts), [firebase-messaging.sw.template.js](../../../packages/push/src/firebase-messaging.sw.template.js) |
| 권한 요청 배너 (`status === 'prompt'`일 때만 노출)                        | ✅   | [packages/push/src/NotificationPrompt.tsx](../../../packages/push/src/NotificationPrompt.tsx)                                                                                                          |
| 포그라운드 토스트 store (Zustand)                                         | ✅   | [packages/push/src/notification-store.ts](../../../packages/push/src/notification-store.ts)                                                                                                            |
| 알림 목록 UI (career 풀페이지 + plan 우측 패널 공유, #347 FE 완료)        | ✅   | [packages/features/src/notifications/NotificationsView.tsx](../../../packages/features/src/notifications/NotificationsView.tsx)                                                                        |
| `firebase` Web SDK 의존성 (`^12.12.0`)                                    | ✅   | [apps/career/package.json](../../../apps/career/package.json)                                                                                                                                          |

### API 스펙 (디바이스만 — 레거시 SDD 잔재)

아직 레거시인 openapi SDD 문서에 정의된 엔드포인트입니다. 참고용으로만 봐주시면 되고 추후 삭제 예정입니다. **BE-first이니 BE가 엔드포인트를 구성하면 FE는 이에 맞게 대응**하는 방식으로 갑니다.

| 항목                                                                                                 | 상태   | 위치                                                                      |
| ---------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `POST /api/v1/devices` (registerDevice), `DELETE /api/v1/devices` (unregister) 스펙                  | 참고용 | 구 손-spec `src/spec/v1/devices.yaml` (ADR-0024 flip 시 제거 — BE 미구현) |
| orval 생성 타입 (`DevicePlatform` enum, `RegisterDeviceRequest/Response`, `UnregisterDeviceRequest`) | 참고용 | `packages/api-client/src/generated/schemas/` (gitignored)                 |

### Mock (MSW, dev 전용)

| 항목                                                        | 상태     | 위치                                                                                                    |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| devices — stateful UPSERT/delete                            | ✅       | [packages/mocks/src/overrides/devices.ts](../../../packages/mocks/src/overrides/devices.ts)             |
| notifications — placeholder 3건(CHAT/RECOMMENDATION/SYSTEM) | ✅(임시) | [packages/mocks/src/overrides/notifications.ts](../../../packages/mocks/src/overrides/notifications.ts) |

### 테스트

| 항목                                                                                 | 상태 | 위치                                                                          |
| ------------------------------------------------------------------------------------ | ---- | ----------------------------------------------------------------------------- |
| 수동 푸시 테스트 스크립트 (firebase-admin 직접, `.secrets/firebase-admin.json` 필요) | ✅   | [apps/career/scripts/test-push.ts](../../../apps/career/scripts/test-push.ts) |

---

## 6. 빠진 것 — BE 딱 2가지 (전부 [#211](https://github.com/mortonCareer/bconnect/issues/211))

검증: `apps/api/src`에 device/notification 도메인 **0개**, `apps/api/build.gradle`에 `firebase-admin` **없음**(현존 `socket/*`은 WebSocket 채팅이지 FCM 아님).

### ① FCM SDK 의존성 + 인증

- [ ] `com.google.firebase:firebase-admin` 의존성 추가 ([apps/api/build.gradle](../../../apps/api/build.gradle))
- [ ] Firebase Admin 인증: GCP 서비스 계정 JSON 환경변수 주입 (`FIREBASE_ADMIN_CREDENTIALS_JSON`, base64 등)
- [ ] FCM 발송 서비스 클래스 (`NotificationSender`)

### ② 알림 API 구현

**디바이스 토큰**

- [ ] `device_tokens` 테이블 (`member_id`, `token`, `platform`(web/android/ios), `created_at`, `last_active_at`)
- [ ] `POST /api/v1/devices` — 토큰 등록 (UPSERT, 동일 토큰 재등록 시 `last_active_at` 갱신)
- [ ] `DELETE /api/v1/devices` — 토큰 삭제 (로그아웃/권한거부 시)
- [ ] FCM `UNREGISTERED`/`INVALID_ARGUMENT` 응답 시 토큰 자동 삭제

**알림 발송 + 저장**

- [ ] `Notification` 엔티티 (`id`·`sender_id`(nullable)·`receiver_id`·`type`→NotificationType·`reference_id`·`is_read`·`created_at`) + `NotificationType` (`code`·`reference_type`·`message` 템플릿) — CEO ERD (3.6)
- [ ] 채팅 메시지 트리거 — 수신자 토큰 조회 → FCM 발송 + Notification INSERT. 텍스트는 `message` 템플릿 렌더(`{sender}`=sender_id) + 딥링크(`reference_type`(type 경유)+`reference_id`, 3.3)
- [ ] (미리보기 담을 경우) Notification 콘텐츠 필드 — A/C 중 CEO 확정 (3.6 미결)
- [ ] 발송 정책 — 수신자가 해당 채팅방 WebSocket 활성이 아닐 때만

**조회**

- [ ] `GET /api/v1/notifications` — 알림 목록
- [ ] 안 읽음 카운트 (전용 엔드포인트 또는 user profile 포함)
- [ ] 읽음 처리 엔드포인트

> BE가 위 엔드포인트를 구현하면 → 스펙 갱신 → `pnpm api:generate` → FE의 임시 fetch/더미를 generated 훅으로 교체. 딥링크 ④(`/n/`) 전환은 8.1(별도 PR).

---

## 7. 담당 + 다음 액션

- **BE 알림 담당**: 신규 팀원 **전지원** ([#211](https://github.com/mortonCareer/bconnect/issues/211))
- **CTO(손장수)**: BE에게 본 문서로 아키텍처 공유. 딥링크 ④·render-on-read·category 제거는 ERD 정합 확정. **CEO 확정 대기 = 미리보기 저장(3.6 A/C)** + 시나리오 type 목록(3.7)
- **검증**: BE 두 칸 채워지면 [test-push.ts](../../../apps/career/scripts/test-push.ts) 수동 발송이 아닌 **실 채팅 이벤트**로 E2E 푸시 확인

---

## 8. 다음 작업 (별도 PR — FE)

본 브랜치(`fix/notification-local-test`)는 **로컬 테스트 세팅까지만** 담는다 (SW 버그픽스·firebase-admin·dev 트리거 패널·IAM·본 문서). 아래는 의도적으로 분리한 후속 작업 — 설계 비중이 커 별도 PR(들)로 진행한다.

### 8.1 푸시 payload 스키마 + 딥링크 ④ 구현

3.3 의 FE 결정(제네릭 리다이렉트)을 코드화:

- [ ] 푸시/목록 FE 타입 ([packages/features](../../../packages/features/src/notifications/)) — ERD 정합: `type`·렌더된 텍스트(`message` 결과)·`reference_type`(type 경유)·`reference_id`·`icon?` (FCM data 는 string-only). BE 확정 후 orval generated 로 교체
- [ ] 각 앱 `/n/[referenceType]/[referenceId]` 리다이렉트 라우트 + `reference_type→경로` 맵(앱별 SSOT)
- [ ] SW·훅·dev 도구를 `data.url` → `/n/{reference_type}/{reference_id}` 로 전환
- [ ] 현행 `data.url`/`data.icon` 임시 키 정리

### 8.2 푸시 인프라 공유화 (career → packages, plan 재사용)

plan 도 동일 푸시 시스템 필요(데스크톱 백/포그라운드 알림). 현재 career 전용인 플러밍을 공유로 승격:

- [ ] 공유: `usePushNotifications` 훅, firebase init, SW 템플릿(로직), 인앱토스트 store/컴포넌트, `DevPushPanel`, dev 발송 endpoint
- [ ] 앱별 유지: 맵·`/firebase-messaging-sw.js` 서빙 라우트·`/n/` 라우트·firebase env·providers 마운트
- [ ] plan 측 배선 (SW 라우트·/n/·마운트)
- [ ] ([ADR-0020](../../explanation/adr/0020-dual-shell-view-sharing-rendershell-resolved-data.md) 듀얼셸 패턴과 동형 — 로직 공유, 데이터·셸은 앱)

### 8.3 크로스 언어 동기화 (BE Java ↔ FE TS)

payload 계약을 두 언어가 공유하되 drift 방지:

- [ ] L1: 계약을 본 문서(또는 전용 reference)로 명문화 + FE 타입 ↔ BE 직렬화 파일 **상호 링크 주석**
- [ ] L2: 샘플 payload JSON 픽스처 1개 → FE 타입 검증 + BE 직렬화 테스트가 같은 픽스처 대조 (drift 시 CI 실패)
- (L3 중립 스키마 codegen 은 BE-first·소수 payload 대비 과도 — 보류)
