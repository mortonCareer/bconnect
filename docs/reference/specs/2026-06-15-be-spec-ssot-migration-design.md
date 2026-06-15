# 손-작성 OpenAPI 스펙 폐기 → BE springdoc 단일 소스 마이그레이션 설계

> **For**: 이 마이그레이션을 구현/리뷰하는 사람 (CTO·CEO).
> **You'll be able to**: 왜·무엇을·어떤 순서로 바꾸는지 파악하고, 구현 계획(별도 plan)을 실행한다.

> **Status**: Design (승인 대기) · **Date**: 2026-06-15 · **PoC**: `chore/be-spec-wiring` 브랜치 (검증 완료)
> **Related**: [ADR-0015](../../explanation/adr/0015-be-code-as-api-ssot.md) (BE 코드 SSOT — 본 설계가 그 "스펙 산출 방식" 보류 결정을 종결)

---

## 1. 배경 / 문제

[ADR-0015](../../explanation/adr/0015-be-code-as-api-ssot.md)는 **BE 코드를 API 기준(SSOT)**으로 정했지만, "스펙 yaml을 어떻게 만들지(자동 생성 vs 손으로 갱신)"는 **CEO에게 명시적으로 보류**했다 (ADR "중립적" 절). 그 결정이 미뤄진 채 de facto **손-작성**(`packages/api-client/src/spec/v1/*.yaml`)으로 운영돼 왔다.

손-작성 spec은 "BE를 따라가는 미러"라 사람이 갱신을 빠뜨리면 **drift**가 생긴다. 실제 사고:

- **feeds 크래시** (2026-06-15): BE `FeedController.list()`가 배열 반환인데 손-spec은 `FeedOffsetPage{content,hasNext}`로 방치 → `feeds.content.filter()`가 `undefined.filter()`로 홈 화면 전체 크래시 ([PR #613](https://github.com/mortonCareer/bconnect/pull/613)로 stopgap 수정).
- PoC 조사 중 **환상 엔드포인트** 다수 발견: 손-spec이 BE에 없는 엔드포인트(`getMyProfile`, `devices`, `getChat`, `roles`, `trades`)를 문서화했고 FE가 그걸 호출 중 → 실 BE에서 404 잠재버그.

즉 손-작성 미러는 drift를 구조적으로 허용한다. **BE가 SSOT라면 spec도 BE에서 파생**되어야 한다.

## 2. 목표 / 성공 기준

- `packages/api-client/src/spec/**` 손-작성 제거. orval이 **BE springdoc 산출 spec을 직접 소비**.
- career/plan typecheck green, FE 호출부 변경 **최소** (네이밍 규칙으로 캐논명 보존).
- **redocly 의존성 제거** (멀티파일 번들 불요 — BE는 단일 파일).
- drift 구조적 차단: BE 변경 → CI가 spec 재생성 → FE codegen 자동 반영, FE-호환성을 CI가 게이트.

## 3. 이미 있는 자산 (PoC로 확인)

| 자산                                                                            | 상태                                                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| BE springdoc (`springdoc-openapi-gradle-plugin`, `generateOpenApiDocs`)         | ✅ 단일 `openapi.yaml` 산출                                      |
| `OpenApiConfig.java` `ModelResolver.enumsAsRef = true`                          | ✅ **enum을 named $ref로 emit** (Trade/Role/CredentialType/... ) |
| CI `ci-api-spec` 잡 (`apps/api/**` 트리거 → gen → `src/openapi.yaml` 커밋·푸시) | ✅ **freshness 게이트 존재**                                     |
| `orval.transformer.ts` (envelope unwrap, 양쪽 인코딩)                           | ✅                                                               |
| becompat PoC (transformer + auth 보충 + config)                                 | ✅ 배선 작동 검증 (`chore/be-spec-wiring`)                       |

**유일 결손**: 프로덕션 orval(`orval.config.ts`)이 손-spec bundle을 먹음 (BE spec 안 먹음).

## 4. 목표 아키텍처

```
apps/api (BE 코드 = SSOT)
 └─ CI: gradle generateOpenApiDocs (apps/api/** 트리거)        ← 이미 있음
     └─ packages/api-client/src/openapi.yaml (커밋)            ← 단일 파일, 번들 불요
         └─ orval + transformer:
              · auth 보충 병합 (필터 엔드포인트 verify/refresh)   ← 신규, 영구 최소 수동면
              · operationId 규칙 재작성 (method+path+예외맵)      ← 신규
              · 스키마명 규칙 (Response strip + 예외)             ← 신규
              · envelope unwrap (flat success/data)              ← 기존
              · info.title override (mock 집계자명)               ← 신규
              · orphan prune (envelope wrapper 제거)             ← 신규
              (enum 처리 없음 — BE enumsAsRef=true 로 named $ref emit)
              └─ src/generated/ (hooks + mock + types)
삭제: src/spec/**, redocly(bundle+lint+@redocly/cli+.redocly.yaml), openapi.bundled.yaml,
      becompat config (becompat transformer는 프로덕션 transformer로 승격)
```

## 5. 핵심 메커니즘 (PoC 검증)

### 5.1 네이밍 = 규칙 기반 (손-사전 아님)

springdoc opId는 쓰레기(`get_4`/`getAll_3`/`update_2`)라 무시하고 **(method+path)에서 계산**:

- GET 컬렉션 → `get`+복수 (`getFeeds`), GET 단건 → `get`+단수 (`getFeed`)
- POST/PUT/PATCH/DELETE → `create`/`update`/`delete`+단수
- `me` → `My` (`getMyMember`), 목록 한정자(`sent`/`received`) prepend + 복수 (`getMySentRecommendations`)
- 말단 액션 세그먼트(`accept`/`deny`/`show`/`hide`) → verb+단수 (`acceptCredential`)

**예외맵** (도메인 동사 — 규칙으로 안 풀림): `withdraw`, `registerMember`, `cancelCoworkerRequest`, `getMyChats`, `getMyTasks`, `getChatMessages`, `createDirectChat`, auth 4종, `updateMyProfileAbout` 등 ~14.

스키마명: 엔티티 `*Response` strip (`FeedResponse`→`Feed`), Request DTO 유지, op-response DTO keep-list, 예외(`CursorPageMessageResponse`→`MessageCursorPage`). envelope wrapper(`ApiResponse*`)는 unwrap+prune으로 제거.

### 5.2 enum = BE가 이미 처리

`enumsAsRef=true` → BE가 named enum emit (Trade/Role/CredentialType/MessageType) → **FE 작업 불필요**. transformer에 enum 처리 없음(PoC의 inline-hoist는 dead code라 제거). enum 회귀(BE가 enumsAsRef 끄면)는 compat:check harness가 감지.

### 5.3 A. 필터 엔드포인트 보충 (영구 최소 수동면)

`/auth/otp/verify`(OTP 로그인 필터)·`/auth/refresh`(`RefreshTokenAuthenticationFilter`)는 `@RestController`가 아니라 Spring Security 필터라 **springdoc이 영원히 문서화 못 함**. → `auth-supplement.ts`(openapi3-ts 타입)에 path+schema 정의 → transformer가 병합.

- **레벨 결정**: TS 보충물 + transformer 병합. (redocly bundle-merge 거부 — 번들 단계·의존성 부활시킴)
- verify는 FE 훅(`useVerifyOtp`), refresh는 내부(`client.ts`)지만 mock 핸들러 필요 → 둘 다 보충.
- 보충물은 "springdoc이 구조적으로 못 내는 것"으로만 한정 = 환원 불가능한 최소 수동면.

### 5.4 freshness = 기존 CI 게이트 재사용

`ci-api-spec`이 이미 `apps/api/**` 변경 시 spec 재생성+커밋. 마이그레이션은 (a) orval 입력을 이 산출물로 전환, (b) 게이트에 **orval generate + career/plan typecheck** 추가 = FE-호환성 차단.

## 6. 잔여 = BE 계약 정합 3트랙 (배선 밖)

PoC 측정: career 119 / plan 85 (배선·A 적용 후). 잔여는 전부 BE-FE 계약 발산:

| 트랙                     | 내용                                                                                                                                            | 처리                                      | 소유  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----- |
| **nullability** ⭐       | springdoc이 `required` 미emit → 전 필드 optional → `feed.profile` 등 possibly-undefined (TS18048 ×26)                                           | BE가 required emit (enumsAsRef 동급 설정) | BE    |
| **B. 환상 엔드포인트**   | `getMyProfile`(GET /profiles/me 없음), `devices`(컨트롤러 없음), `getChat`(GET /chats/{id} 없음), `roles`/`trades`/`coworkers/tasks`            | BE 구현 or FE 제거 — **BE 논의**          | BE+FE |
| **C. path/엔티티 drift** | `createDirectChat`(/chats/direct) vs BE `/chats`; `MaskedMember` vs BE `MemberSummaryResponse`; `ProfileAndMember` vs BE flat `ProfileResponse` | FE 정합                                   | FE    |

> nullability가 최대 단일 레버(에러의 ~지배). BE 한 설정으로 대량 해소 예상 — 플립 전 우선 검증 권장.

## 7. 롤아웃 (staged, 각 단계 becompat로 독립 검증)

1. **컴팩트 레이어** (PoC 완료): transformer(네이밍·envelope·title·prune) + `auth-supplement.ts`. 프로덕션 무변경.
2. **BE 정확도** (BE, CEO): `required` emit 설정(nullability) + B 환상 엔드포인트 구현/정리 합의.
3. **C. FE 정합** (FE): `createDirectChat`→`createChat`, `MaskedMember`→`MemberSummary`, `ProfileAndMember` 어댑트.
4. **CI compat 게이트**: `ci-api-spec`에 orval generate + typecheck 추가 (비차단→차단).
5. **플립**: `orval.config.ts` 입력 → `src/openapi.yaml`, becompat transformer 승격, **손-spec/redocly/bundle/becompat config 삭제**.
6. **ADR**: ADR-0015 보류결정 종결 — "BE springdoc + 최소 수동 보충을 spec 소스로". 새 ADR 작성, ADR-0015 영향 주석.

## 8. 리스크

- **mock 데이터 품질**: springdoc `example` 부족 → faker 랜덤. stateful overrides(`@bconnect/mocks`)는 유지. 플립 후 MSW 동작 검증 필요.
- **B/C는 BE 협업 동반** → CTO 단독 불가. CEO 합의 + ADR 필요.
- **필터 보충 레이어는 영구**: "순수 BE-springdoc-SSOT"는 불가능(필터 엔드포인트 구조적 불가시). 정직하게 "BE springdoc + 최소 수동 보충"으로 명명.

## 9. 비목표 (YAGNI)

- 손-사전 기반 네이밍 매핑 (규칙으로 대체).
- enum hoisting 적극 구현 (BE enumsAsRef로 불필요).
- redocly 유지 (제거).
- B 환상 엔드포인트의 일괄 BE 구현 (논의로 분리, 본 설계 범위 밖).
