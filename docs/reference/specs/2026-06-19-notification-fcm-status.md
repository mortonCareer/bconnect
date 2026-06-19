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

### 3.3 딥링크 계약 — BE가 정해야 할 핵심 결정

알림 클릭 시 어디로 보낼지를 BE 응답이 결정한다. #211 코멘트에서 **CEO가 제안한 방식**:

> 응답에 `reference_type`(엔티티 타입) + `reference_id`(엔티티 ID)를 포함 → **FE가 URL 조립**.
> 예: `profile`/`1` → `/profiles/1`, 동료 요청 → `coworker-req`/... 형태.

반면 **현재 FE Service Worker는 FCM payload의 `data.url`(완성된 URL)** 을 그대로 읽어 네비게이트한다([firebase-messaging.sw.template.js](../../../apps/career/src/service-workers/firebase-messaging.sw.template.js)).

**→ 둘을 통일해야 한다. BE 결정 사항:**

- (A) `reference_type`+`reference_id`로 통일 → 푸시 payload에도 이걸 넣고, **SW를 조립 방식으로 수정** (FE 소폭 변경 필요)
- (B) BE가 서버에서 URL 조립 → `data.url`로 통일 (현재 SW 무수정, 목록 응답도 `url` 필드 제공)

**FE 결정 (2026-06-19, CTO ↔ Claude 검토 — #211 BE 합의 대기)**: (A)의 변형 — `reference_type`+`reference_id` + **제네릭 리다이렉트 라우트**. BE 는 `reference_type`+`reference_id` 만 보내고(도메인만), SW·앱은 매핑 없이 `/n/{reference_type}/{reference_id}` 로만 이동, 각 앱의 `/n/[referenceType]/[referenceId]` 라우트 1곳이 `type→실경로` resolve+redirect. → **맵 SSOT 1곳**(SW(JS)/앱(TS) 중복 제거), 푸시+목록 통일. 구현은 아래 9장(별도 PR)으로 분리.

> 본 문서의 "완료된 것"의 SW `data.url` 은 **로컬 테스트용 현행**이며, 위 FE 결정에 따라 별도 PR 에서 `/n/` 방식으로 교체된다. BE([#211](https://github.com/mortonCareer/bconnect/issues/211)) 가 `reference_type`+`reference_id` 로 합의되면 그대로 정합.

### 3.4 알림 설정 정책

초기엔 **사용자별 on/off 설정 없이 전부 발송**(#211 코멘트, CEO 확정). 발송 정책은 "수신자가 해당 컨텍스트에 활성(WebSocket 연결 중)이 아닐 때만" 정도만. 사용자 커스터마이즈는 향후 확장.

### 3.5 발송 트리거 우선순위

1. **채팅** (1순위) — 새 메시지 수신, 수신자가 그 채팅방 WebSocket에 없을 때만
2. 구인 매칭 — 새 매칭 제안 (향후)
3. 시스템 — 공지 (향후)

### 3.6 알림 데이터 모델 — 세 표현 + canonical

FCM 푸시는 **일시적**(fire-and-forget) — FCM 은 아무것도 저장하지 않는다. 알림 패널([NotificationsView](../../../packages/features/src/notifications/NotificationsView.tsx))의 히스토리·안읽음은 BE 가 **`notification` 테이블에 저장**해야 성립한다. 한 이벤트 = sink 2개: ① DB INSERT(영구) + ② FCM 발송(일시적).

같은 도메인 알림의 **세 표현**, DB 가 canonical(정본):

|           | ① DB 엔티티 (테이블)                 | ② 푸시 payload (FCM data)         | ③ 목록 아이템 (GET 응답)     |
| --------- | ------------------------------------ | --------------------------------- | ---------------------------- |
| 성격      | **canonical**, 영구                  | 전송 와이어, 일시적 (string-only) | 읽기모델 (`AppNotification`) |
| 소유      | BE (#211)                            | BE→FE 계약 (3.3 의 ④)             | BE→FE (FE provisional 존재)  |
| 고유 필드 | `id`·`member_id`·`read`·`created_at` | `icon`(파생)                      | —                            |

②·③ 은 ①의 투영(projection). 충돌 시 ① 이 정답. `read`(사용자 상태)·`member_id`(수신자)는 테이블에만, `icon`(발신자 아바타)은 발송 시점 파생이라 컬럼 없을 수 있음.

**결정 (2026-06-19, 외부 사례 조사 기반 — #211 BE 설계 입력)**: **하이브리드 — 스냅샷 기본 + 휘발 필드만 재계산.**

조사 결론: 알림 **인박스** 제품(Knock·Novu·MagicBell)은 생성 시점 렌더 텍스트를 **스냅샷 저장** + template/payload ref 병행. 소셜 **fan-out 피드**(Twitter·Stream)만 ID 저장 + 조회시 하이드레이트 — 단 1:수백만 fan-out + 편집반영이 필요한 다른 문제군이라 우리 1:1 알림엔 해당 안 됨. 우리 패널 = 인박스 케이스.

스냅샷 우세 동인: ① 목록 read-heavy → N+1 회피 ② 참조 삭제(메시지/공고)돼도 텍스트 생존 ③ **푸시가 본질적 스냅샷이라 패널도 스냅샷이어야 두 채널 일치**.

per-field (휘발성 기준):

| 필드                     | 방식                             | 이유                                                |
| ------------------------ | -------------------------------- | --------------------------------------------------- |
| 메시지 미리보기(채팅)    | **스냅샷**                       | 편집/삭제돼도 당시값, 푸시 일치                     |
| 발신자 표시이름          | body 엔 스냅샷 + `actor_id` 보관 | 칩만 현재이름 재계산 옵션                           |
| 카운트/집계 ("매칭 3건") | **재계산**                       | frozen 숫자는 stale → 무의미 (Stream 집계피드 모델) |
| 추천/시스템              | 스냅샷 + `entity_id`             | 딥링크, 원본 삭제 대비                              |
| 현지화                   | 스냅샷 (한국어 전용)             | `data` 보관해 미래 i18n 대비                        |

→ 테이블에 `title`·`body`(스냅샷) **+** `actor_id`·`entity_type`·`entity_id`·`data` JSONB(ref/재렌더용) **둘 다**. 렌더는 BE 가 생성 시 1회(= 푸시 payload 와 동일 렌더) → 푸시·패널 영구 일치, 목록은 조인 0 SELECT. (Knock/Novu 하이브리드 패턴.)

> 근거: [Knock 피드 스키마](https://docs.knock.app/in-app-ui/api-overview)(블록마다 `content`+`rendered`), [Stream 활동피드 아키텍처](https://getstream.io/blog/scalable-activity-feed-architecture/)(피드는 ID만 저장·하이드레이트, 랭킹 필드만 denormalize), [oneuptime MySQL 알림](https://oneuptime.com/blog/post/2026-03-31-mysql-notification-system/view)(렌더 컨텍스트 스냅샷으로 N+1 회피).

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
✅ 클릭 → 딥링크 네비게이트 (단 3.3 계약 확정 필요)
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

| 항목                                                                      | 상태 | 위치                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase SDK lazy init (로컬 config 누락 안전 처리, `isSupported()` 가드) | ✅   | [apps/career/src/lib/firebase.ts](../../../apps/career/src/lib/firebase.ts)                                                                                                                                          |
| FCM 토큰 수명주기 훅 (init→권한→토큰→서버등록, 포그라운드 메시지 구독)    | ✅   | [apps/career/src/hooks/use-push-notifications.ts](../../../apps/career/src/hooks/use-push-notifications.ts)                                                                                                          |
| 훅 **실제 마운트** (앱 진입 시 호출)                                      | ✅   | [apps/career/src/app/providers.tsx:30](../../../apps/career/src/app/providers.tsx#L30)                                                                                                                               |
| 백그라운드 SW (런타임 config 주입 Route Handler)                          | ✅   | [firebase-messaging-sw.js/route.ts](../../../apps/career/src/app/firebase-messaging-sw.js/route.ts), [firebase-messaging.sw.template.js](../../../apps/career/src/service-workers/firebase-messaging.sw.template.js) |
| 권한 요청 배너 (`status === 'prompt'`일 때만 노출)                        | ✅   | [apps/career/src/components/notification-prompt.tsx](../../../apps/career/src/components/notification-prompt.tsx)                                                                                                    |
| 포그라운드 토스트 store (Zustand)                                         | ✅   | [apps/career/src/stores/notification-store.ts](../../../apps/career/src/stores/notification-store.ts)                                                                                                                |
| 알림 목록 UI (career 풀페이지 + plan 우측 패널 공유, #347 FE 완료)        | ✅   | [packages/features/src/notifications/NotificationsView.tsx](../../../packages/features/src/notifications/NotificationsView.tsx)                                                                                      |
| `firebase` Web SDK 의존성 (`^12.12.0`)                                    | ✅   | [apps/career/package.json](../../../apps/career/package.json)                                                                                                                                                        |

### API 스펙 (디바이스만 — 레거시 SDD 잔재)

아직 레거시인 openapi SDD 문서에 정의된 엔드포인트입니다. 참고용으로만 봐주시면 되고 추후 삭제 예정입니다. **BE-first이니 BE가 엔드포인트를 구성하면 FE는 이에 맞게 대응**하는 방식으로 갑니다.

| 항목                                                                                                 | 상태   | 위치                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `POST /api/v1/devices` (registerDevice), `DELETE /api/v1/devices` (unregister) 스펙                  | 참고용 | [packages/api-client/src/spec/v1/devices.yaml](../../../packages/api-client/src/spec/v1/devices.yaml) |
| orval 생성 타입 (`DevicePlatform` enum, `RegisterDeviceRequest/Response`, `UnregisterDeviceRequest`) | 참고용 | `packages/api-client/src/generated/schemas/` (gitignored)                                             |

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

- [ ] `notification` 테이블 (`member_id`, `type`, `title`, `body`, `reference_type`, `reference_id`, `read`, `created_at`)
- [ ] 채팅 메시지 트리거 — 수신자 토큰 조회 → FCM 발송 + DB 저장. payload `notification.title`(발신자), `notification.body`(내용), 딥링크(3.3 계약)
- [ ] 발송 정책 — 수신자가 해당 채팅방 WebSocket 활성이 아닐 때만

**조회**

- [ ] `GET /api/v1/notifications` — 알림 목록
- [ ] 안 읽음 카운트 (전용 엔드포인트 또는 user profile 포함)
- [ ] 읽음 처리 엔드포인트

> BE가 위 엔드포인트를 구현하면 → 스펙 갱신 → `pnpm api:generate` → FE의 임시 fetch/더미를 generated 훅으로 교체. 단 딥링크를 (A) 방식으로 가면 SW 조립 로직 FE 변경 1건 필요(3.3).

---

## 7. 스테일 참조 정리 (정합 필요)

`#211`로 일원화되면서 코드·문서에 옛 이슈 번호가 남았다. BE 구현 PR에서 같이 정리 권장.

| 위치                                                                                         | 현재                                | 고칠 방향                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| [register-device-token.ts:10](../../../apps/career/src/lib/register-device-token.ts#L10)     | "BE 가 #233 으로 구현 예정"         | #211                             |
| [devices.ts:7](../../../packages/mocks/src/overrides/devices.ts#L7)                          | "#233 BE 구현 후"                   | #211                             |
| [useNotifications.ts:6](../../../packages/features/src/notifications/useNotifications.ts#L6) | "TODO(BE notification 도메인 #347)" | #211 (#347은 FE 패널 이슈, 오기) |
| [types.ts:3](../../../packages/features/src/notifications/types.ts#L3)                       | "TODO(... #347)"                    | #211                             |
| `#233` 본문이 참조한 `docs/NOTIFICATION_DEEPLINKS.md`                                        | **파일 없음** (삭제됨/미작성)       | 딥링크 SSOT를 3.3 또는 #211로    |

---

## 8. 담당 + 다음 액션

- **BE 알림 담당**: 신규 팀원 **전지원** ([#211](https://github.com/mortonCareer/bconnect/issues/211))
- **CTO(손장수)**: BE에게 본 문서로 아키텍처 공유 + 딥링크 계약(3.3) 합의. BE 엔드포인트 확정 후 스펙 갱신
- **검증**: BE 두 칸 채워지면 [test-push.ts](../../../apps/career/scripts/test-push.ts) 수동 발송이 아닌 **실 채팅 이벤트**로 E2E 푸시 확인

---

## 9. 다음 작업 (별도 PR — FE)

본 브랜치(`fix/notification-local-test`)는 **로컬 테스트 세팅까지만** 담는다 (SW 버그픽스·firebase-admin·dev 트리거 패널·IAM·본 문서). 아래는 의도적으로 분리한 후속 작업 — 설계 비중이 커 별도 PR(들)로 진행한다.

### 9.1 푸시 payload 스키마 + 딥링크 ④ 구현

3.3 의 FE 결정(제네릭 리다이렉트)을 코드화:

- [ ] `PushNotificationData` 공유 타입 ([packages/features](../../../packages/features/src/notifications/)) — `type`·`title`·`body`·`reference_type`·`reference_id`·`icon?` (FCM data 는 string-only)
- [ ] 각 앱 `/n/[referenceType]/[referenceId]` 리다이렉트 라우트 + `type→경로` 맵(앱별 SSOT)
- [ ] SW·훅·dev 도구를 `data.url` → `/n/{reference_type}/{reference_id}` 로 전환
- [ ] 현행 `data.url`/`data.icon` 임시 키 정리

### 9.2 푸시 인프라 공유화 (career → packages, plan 재사용)

plan 도 동일 푸시 시스템 필요(데스크톱 백/포그라운드 알림). 현재 career 전용인 플러밍을 공유로 승격:

- [ ] 공유: `usePushNotifications` 훅, firebase init, SW 템플릿(로직), 인앱토스트 store/컴포넌트, `DevPushPanel`, dev 발송 endpoint
- [ ] 앱별 유지: 맵·`/firebase-messaging-sw.js` 서빙 라우트·`/n/` 라우트·firebase env·providers 마운트
- [ ] plan 측 배선 (SW 라우트·/n/·마운트)
- [ ] ([ADR-0020](../../explanation/adr/0020-dual-shell-view-sharing-rendershell-resolved-data.md) 듀얼셸 패턴과 동형 — 로직 공유, 데이터·셸은 앱)

### 9.3 크로스 언어 동기화 (BE Java ↔ FE TS)

payload 계약을 두 언어가 공유하되 drift 방지:

- [ ] L1: 계약을 본 문서(또는 전용 reference)로 명문화 + FE 타입 ↔ BE 직렬화 파일 **상호 링크 주석**
- [ ] L2: 샘플 payload JSON 픽스처 1개 → FE 타입 검증 + BE 직렬화 테스트가 같은 픽스처 대조 (drift 시 CI 실패)
- (L3 중립 스키마 codegen 은 BE-first·소수 payload 대비 과도 — 보류)
