# API Client 가이드 (orval codegen)

`@bconnect/api-client` — BE springdoc 산출 OpenAPI spec을 orval로 소비해 React Query hook + MSW mock + TypeScript 타입을 생성한다. **BE 코드가 API SSOT** ([ADR-0015](../../docs/explanation/adr/0015-be-code-as-api-ssot.md), [ADR-0024](../../docs/explanation/adr/0024-orval-consumes-be-springdoc-spec.md)).

spec은 **손으로 쓰지 않는다**. BE가 emit → CI가 `src/openapi.yaml`로 커밋 → orval이 becompat transformer로 FE 캐논 모양 정렬 후 생성.

## 파이프라인

```text
apps/api (Spring) ──springdoc──▶ build/openapi.yaml
   │  ci-api-spec: apps/api/** 변경 시 ./gradlew generateOpenApiDocs → 커밋
   ▼
packages/api-client/src/openapi.yaml    # BE 산출 spec (커밋됨, SSOT 입력)
   │  orval + orval.transformer.ts (becompat)
   ▼
src/generated/  (gitignored)            # api.ts (hook + MSW mock) + schemas/
```

## 디렉토리

```text
packages/api-client/
├── orval.config.ts          # codegen 설정 (input=src/openapi.yaml, transformer, mock)
├── orval.transformer.ts     # BE springdoc → FE 캐논 정렬 (becompat)
├── auth-supplement.ts       # 필터-인증(verify/refresh) path·schema 보충
└── src/
    ├── openapi.yaml         # BE springdoc 산출 spec (SSOT 입력, 커밋됨)
    ├── generated/           # orval 산출 (gitignored) — api.ts + schemas/
    ├── client.ts            # customFetch (런타임 envelope unwrap + token refresh)
    ├── labels.ts            # enum-coupled 라벨 (Trade / CredentialType)
    ├── query-client.ts
    └── index.ts             # public export barrel
```

## transformer (`orval.transformer.ts`)

springdoc의 Java 파생 spec을 FE가 기대하는 모양으로 compile-time 정렬. 실행 순서:

1. **info.title** → `Bconnect API` (mock aggregator 이름 `getBconnectAPIMock` 이 title 에서 파생)
2. **auth 보충 병합** — 필터 기반이라 springdoc 이 못 보는 `POST /auth/otp/verify`·`POST /auth/refresh` 의 path + schema 를 `auth-supplement.ts` 에서 추가. 없는 것만 추가하므로 BE 가 향후 컨트롤러화하면 자동으로 우선
3. **schema rename** — 엔티티 `*Response` suffix strip (`MemberResponse` → `Member`). op-response DTO(엔티티 아님)는 `SCHEMA_KEEP_RESPONSE` 목록으로 유지 (CheckUsername/SendOtp/RefreshToken/RegisterMember/RegisterDevice/VerifyOtpLogin/VerifyOtpSignup Response)
4. **operationId 규칙** — springdoc opId(Java 메서드명) 무시, (method + path) 규칙으로 파생 (아래)
5. **envelope unwrap** — `{success, data}` 에서 `data` 만 노출 (compile-time; 런타임 unwrap 은 customFetch)
6. **orphan prune** — 어떤 `$ref` 도 안 닿는 컴포넌트(envelope wrapper 등) 제거

### operationId 규칙

`verb + [My] + [ListQual] + Noun + [SubField]`:

| 요소                                       | 규칙                                                  | 예                           |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------- |
| verb                                       | GET→get, POST→create, PUT/PATCH→update, DELETE→delete | `getFeeds`, `createPost`     |
| 명사 단복수                                | item param 있음 / `me` 단독 → 단수, 그 외 GET → 복수  | `getFeeds` / `getFeed`       |
| 말단 액션 (`ACTIONS`)                      | `action + 단수` (accept/deny/show/hide/cancel)        | `acceptOffer`, `cancelOffer` |
| 중첩 서브컬렉션 `/{res}/{id}/{sub}`        | `verb + 단수(부모) + Pascal(sub)`                     | `getCoworkerTasks`           |
| 목록 한정자 (`LIST_QUALS` = sent/received) | 명사 앞 prefix                                        | `getSentRecommendations`     |
| `me` 세그먼트                              | `My` prefix                                           | `getMyMember`                |
| 서브필드 한정자                            | 명사 뒤 suffix                                        | `updateMyProfileAbout`       |

단복수는 naive `-s` (`singularize`/`pluralize`). 불규칙은 `IRREGULAR_SINGULAR` 맵에만 등재 (현재 `companies → company`).

### 예외 (`OPID_SPECIAL`)

규칙이 구조적으로 못 잡는 **소수 라우트만** 하드코딩 (전 엔드포인트 테이블 아님):

| path                          | opId               | 이유                                              |
| ----------------------------- | ------------------ | ------------------------------------------------- |
| `GET /members/check-username` | `checkUsername`    | 규칙은 `getMembersCheckUsername` (끔찍)           |
| `POST /auth/otp/send`         | `sendOtp`          | springdoc opId(컨트롤러 메서드명) 불안정          |
| `POST /auth/logout`           | `logout`           | 동일                                              |
| `GET /credentials/me`         | `getMyCredentials` | 응답이 목록인데 `me` 는 단수 규칙                 |
| `PUT /offers/reorder`         | `reorderOffers`    | verb-path 가 명사-접미(updateOfferReorder)로 어색 |

`/auth/*` 는 springdoc/보충 opId 유지 (verb-path 라 일반 규칙 부적합).

## 새 BE 엔드포인트 → FE 흐름

**손으로 spec 을 쓰지 않는다.** BE 가 컨트롤러 추가 → `ci-api-spec` 이 springdoc 재생성해 `src/openapi.yaml` 커밋 → orval 이 규칙으로 hook 파생. 규칙이 CRUD 면 사람 개입 0 (`useGetXxx` / `useCreateXxx` 자동). opId 가 어색하면 `OPID_SPECIAL` 에 1줄 추가. 규칙 출력과 다른 FE 호출부(도메인 동사 등)는 **FE 가 규칙 출력에 맞춘다** (억지 예외 대신).

로컬에서 spec 갱신 (BE 개발 서버 부팅 필요):

```bash
cd apps/api && ./gradlew generateOpenApiDocs
cp build/openapi.yaml ../../packages/api-client/src/openapi.yaml
pnpm api:generate
```

## Codegen 출력 + FE 사용

| 파일                       | 내용                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `generated/api.ts`         | react-query hook (use*Query, use*Mutation, use*Suspense) + MSW mock handler (get*MockHandler, getBconnectAPIMock) |
| `generated/schemas/<X>.ts` | 도메인 type interface                                                                                             |

```typescript
// Hook 호출 — data 는 envelope unwrap 된 inner type
import { useGetMyMember } from '@bconnect/api-client'
const { data, isLoading } = useGetMyMember() // data: Member (envelope 사라짐)

// Type import — entity 직접 사용
import type { Member, Profile } from '@bconnect/api-client'

// MSW mock setup (test/dev)
import { setupServer } from 'msw/node'
import { getBconnectAPIMock } from '@bconnect/api-client'
const server = setupServer(...getBconnectAPIMock())
```

## 런타임: customFetch (`src/client.ts`)

모든 hook 의 fetch 를 `customFetch` 로 위임. 담당:

- **envelope unwrap** — `{success, data}` 에서 `data` 만 반환 (hook 의 `data` 가 raw payload)
- **401 자동 retry** — access token 만료 시 refresh 후 재시도
- **ApiError 변환** — `{success: false, error}` → throw `ApiError`

## enum

BE `ModelResolver.enumsAsRef=true` → enum 이 named `$ref` 로 emit → orval 이 TS enum 생성. FE 후처리 불필요. enum-coupled 한글 라벨은 `src/labels.ts` (`TRADE_LABELS` 등).

## 보안: sensitive resource 단건 404 (BE enforce)

본인이 접근 권한 없는 sensitive resource 단건 조회는 **403 대신 404** ([Stripe](https://stripe.com/docs/api/errors)/[GitHub](https://docs.github.com/en/rest) 패턴 — 정보 누설 방지). BE 컨트롤러가 강제하며 spec 에 반영됨. public 조회(`security: []`)는 무관.

## 검증

```bash
pnpm api:generate                          # orval 재생성 (76 hook)
pnpm --filter morton-career typecheck       # FE 계약 정합 (career)
pnpm --filter morton-plan typecheck         # (plan)
```

## 관련 문서

- [ADR-0015](../../docs/explanation/adr/0015-be-code-as-api-ssot.md) — BE 코드가 API SSOT
- [ADR-0024](../../docs/explanation/adr/0024-orval-consumes-be-springdoc-spec.md) — orval 이 springdoc spec 직접 소비 (손-작성 spec 폐기, ADR-0003 supersede)
- [ADR-0004](../../docs/explanation/adr/0004-api-response-envelope.md) — `{success, data, error}` envelope
- [development-workflow.md](../../docs/how-to/development-workflow.md) — 이슈 → 브랜치 → PR → 머지 워크플로
