# API 클라이언트

> 대상: FE 개발자<br>
> 학습 목표: OpenAPI 명세에서 API 클라이언트가 생성되는 파이프라인을 확인한다<br>
> 위치: `packages/api-client`

`@bconnect/api-client`

백엔드에서 생성한 OpenAPI 명세를 Orval로 소비합니다. 산출물은 TanStack Query hook · MSW mock · TypeScript 타입입니다.

## 파이프라인

1. 백엔드에서 OpenAPI 명세 생성 :
   - 명령어 : `./gradlew generateOpenApiDocs`
   - 산출물 : `packages/api-client/src/openapi.yaml`
2. 프론트엔드에서 Orval 실행
   - 명령어 : `orval + orval.transformer.ts`
   - 산출물 : `src/generated/*`
     - Schema
     - TanStack Query Hook
     - MSW Mock
3. `customFetch` : 공통 응답 처리

## 명령어

| 명령어                | 설명                         |
| --------------------- | ---------------------------- |
| `pnpm generate`       | OpenAPI 스펙에서 코드 생성   |
| `pnpm generate:watch` | 스펙 변경 감지하여 자동 생성 |

1. 백엔드 코드 → OpenAPI 명세

```bash
cd apps/api && ./gradlew generateOpenApiDocs
cp build/openapi.yaml ../../packages/api-client/src/openapi.yaml
```

1. OpenAPI 명세 → Orval 생성 → 컴파일

```bash
pnpm api:generate
```

## 패키지 구조

```text
packages/api-client/
├── orval.config.ts        # Orval 설정
├── orval.transformer.ts   # Orval 변환 커스텀 로직
├── auth-supplement.ts     # OpenAPI 명세 누락 보완 (인증 필터)
└── src/
    ├── openapi.yaml       # OpenAPI 명세 (BE 산출물)
    ├── generated/         # Orval 산출물
    │   ├── api.ts         # TanStack Query hooks
    │   └── schemas/       # TypeScript 타입
    ├── client.ts          # HTTP 클라이언트 + 응답 공통처리 (직접 작성)
    ├── labels.ts          # 스키마
    ├── query-client.ts    # QueryClient 설정
    └── index.ts           # 공개 exports
```

## transformer

`springdoc`이 생성하지 못하는 사각지대를 스크립트로 보완합니다.

1. info.title : `Bconnect API`

2. 인증 필터 보완
   - 배경 : `springdoc` 사각지대
   - 규칙 : `orval.transformer.ts` 파일 참고

3. 스키마명 규칙
   - 배경 : 가독성 향상
   - 규칙 : 엔티티 `*Response` 접미사 제거. 예로 `MemberResponse` 가 `Member`
   - 규칙 : 엔티티 아닌 DTO는 `SCHEMA_KEEP_RESPONSE` 목록으로 관리

4. operationId 규칙
   - 배경 : `springdoc`은 컨트롤러 메서드명으로 operationId를 명명해 다수의 중복이 발생
   - 규칙 : 하단 표 참고

5. 객체 쿼리 파라미터 평탄화
   - 배경 : `springdoc`은 쿼리 파라미터를 단일 스키마 객체로 생성함. 실제 쿼리 파라미터는 개별 필드를 전달함
   - 규칙 : 쿼리 파라미터 평탄화 처리

6. 공통 응답 unwrap
   - 배경 : API 공통 응답 형식인 `ApiResponse`에 따라 예외 처리를 추상화하고 필요한 데이터만 추출
   - 규칙 : `customFetch` 참고

7. 고아 스키마 제거. `$ref` 미도달 대상

### operationId 규칙

`verb + [My] + [ListQual] + Noun + [SubField]`:

| 요소                                       | 규칙                              | 예                           |
| ------------------------------------------ | --------------------------------- | ---------------------------- |
| verb                                       |                                   | `getFeeds`, `createPost`     |
| 명사 단복수                                | 단건조회, 목록조회                | `getFeeds` / `getFeed`       |
| 말단 액션 (`ACTIONS`)                      | 액션 단수                         | `acceptOffer`, `cancelOffer` |
| 중첩 서브컬렉션 `/{res}/{id}/{sub}`        | `verb + 단수(부모) + Pascal(sub)` | `getCoworkerTasks`           |
| 목록 한정자 (`LIST_QUALS` = sent/received) | 명사 앞 prefix                    | `getSentRecommendations`     |
| `me` 세그먼트                              | `My` prefix                       | `getMyMember`                |
| 서브필드 한정자                            | 명사 뒤 suffix                    | `updateMyProfileAbout`       |

단복수는 naive `-s` 로 처리합니다. `singularize`·`pluralize` 가 담당합니다.

- 불규칙은 `IRREGULAR_SINGULAR` 맵에만 등재
- 현재 등재분은 `companies → company`

### 예외 (`OPID_SPECIAL`)

규칙이 구조적으로 못 잡는 소수 라우트만 하드코딩합니다.

| path                            | opId                      | 이유                                                                                                                                      |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /members/check-username`   | `checkUsername`           | 규칙 출력인 `getMembersCheckUsername` 이 끔찍                                                                                             |
| `POST /auth/otp/send`           | `sendOtp`                 | 컨트롤러 메서드명 기반이라 springdoc opId 불안정                                                                                          |
| `POST /auth/logout`             | `logout`                  | 동일                                                                                                                                      |
| `GET /credentials/me`           | `getMyCredentials`        | 응답이 목록인데 `me` 는 단수 규칙                                                                                                         |
| `PUT /offers/reorder`           | `reorderOffers`           | verb-path 가 명사-접미인 `updateOfferReorder` 로 어색                                                                                     |
| `POST /notifications/{id}/read` | `updateNotificationRead`  | POST 액션 엔드포인트지만 의미는 읽음 상태 갱신. 규칙 출력인 `createNotificationRead` 대신 update 동사 유지                                |
| `POST /notifications/read`      | `updateNotificationsRead` | 단건 읽음인 `/{id}/read` 와 전체 읽음이 규칙으로는 둘 다 `createNotificationRead`. 뒤엣것이 앞엣것을 덮어써서 전체 읽음을 복수형으로 분리 |

`/auth/*` opId 지정 주체입니다.

- OPID_SPECIAL 이 `sendOtp`·`logout` 지정
- auth-supplement 가 `verifyOtp`·`refreshToken` 지정
- deriveOperationId 의 auth 분기는 그 외 /auth 경로 fallback. springdoc opId 유지
- 현재 해당 경로 없음

```typescript
// Hook 호출
import { useGetMyMember } from '@bconnect/api-client'
const { data, isLoading } = useGetMyMember()

// Type import — entity 직접 사용
import type { Member, Profile } from '@bconnect/api-client'

// MSW mock setup (test/dev)
import { setupServer } from 'msw/node'
import { getBconnectAPIMock } from '@bconnect/api-client'
const server = setupServer(...getBconnectAPIMock())
```

## 타입 Narrowing 패턴

TanStack Query의 `isSuccess`로 타입을 확정합니다.

```tsx
const { data, isSuccess, error } = useGetUsers();

// ✗ data: User[] | undefined
if (isLoading) return <div>Loading...</div>;

// ✓ data: User[]
if (!isSuccess) return <div>Loading...</div>;
data.map(...)
```

## 캐시 무효화 (mutationInvalidates)

mutation 성공 시 관련 query 캐시 무효화를 `orval.config.ts` 의 `query.mutationInvalidates` 로 선언합니다. 생성 훅 `onSuccess` 에 `queryClient.invalidateQueries` 가 자동 주입되어 FE 수동 배선을 대체합니다.

- 규칙 형태는 `{ onMutations: [mutation opId…], invalidates: [query opId…] }`
  - opId 는 transformer 산출 이름 기준. 위 operationId 규칙이 해당
  - 네이밍 규칙이 바뀌면 config 도 동반 갱신
- 조회마다 캐시를 구분하는 배열 키가 있다
  - 무효화는 그 키의 캐시를 "낡음"으로 표시해 다시 불러오게 하는 것이다
  - 조건 없는 조회는 키가 하나뿐이라 그 목록만 정확히 다시 불러온다. 피드 목록이 해당
  - 조건 있는 조회는 회원마다 키가 다르다. 특정 회원의 자격 목록이 해당하고 `memberId` 로 구분한다
  - config 는 그 `memberId` 값을 모르므로 키의 앞부분인 `/api/v1/credentials` 만 지정한다
  - TanStack Query 가 앞부분이 같은 키를 전부 무효화한다. 관련 목록이 한꺼번에 다시 불려오는 넓은 무효화다
- 기본은 config 선언
  - config 로 표현 못 하는 경우만 예전처럼 손으로 남긴다
  - 캐시를 직접 고쳐 쓰는 경우가 해당. 알림 `setQueryData` 가 예다
  - 버튼 클릭 같은 사용자 동작으로 무효화하는 경우도 해당
  - 그 자리에 `// config 대상 밖: <이유>` 주석을 단다
  - 이유 목록은 아래 참조의 ADR-0025 Notes

## 런타임: customFetch (`src/client.ts`)

모든 hook 의 fetch 를 `customFetch` 로 위임합니다. 담당 범위입니다.

- envelope unwrap. `{success, data}` 에서 `data` 만 반환하므로 hook 의 `data` 가 raw payload
- 401 자동 retry. access token 만료 시 refresh 후 재시도
- ApiError 변환. `{success: false, error}` 를 `ApiError` 로 throw

## 인증 처리

### 액세스 토큰

- 메모리에 저장. `setAccessToken`, `getAccessToken` 사용
- 모든 요청에 `Authorization: Bearer {token}` 헤더 자동 추가

```typescript
import { setAccessToken } from '@bconnect/api-client'

// 로그인 성공 후
setAccessToken(response.accessToken)

// 로그아웃 시
setAccessToken(null)
```

### 리프레시 토큰

- httpOnly secure 쿠키에 저장. 백엔드 강제
- 401 응답 시 자동으로 `/api/v1/auth/refresh` 호출
- 갱신 성공 시 원래 요청 재시도

## enum

BE `ModelResolver.enumsAsRef=true` 설정으로 enum 이 named `$ref` 로 emit 됩니다.

- orval 이 `as const` 로 const 객체와 union 타입 생성
- TS `enum` 은 아니며 사용감은 동일
- FE 후처리 불필요
- enum-coupled 한글 라벨은 `src/labels.ts`. `TRADE_LABELS` 등

## 참조

- [ADR-0015](../explanation/adr/0015-be-code-as-api-ssot.md) · BE 코드가 API SSOT
- [ADR-0024](../explanation/adr/0024-orval-consumes-be-springdoc-spec.md) · orval 이 springdoc spec 직접 소비. 손-작성 spec 폐기, ADR-0003 supersede
- [ADR-0004](../explanation/adr/0004-api-response-envelope.md) · `{success, data, error}` envelope
- [ADR-0025](../explanation/adr/0025-cache-invalidation-orval-mutationinvalidates.md) · mutation 성공 시 캐시 무효화 자동 주입
- [development.md](../how-to/development.md) · 이슈 → 브랜치 → PR → 머지 워크플로

## API 클라이언트 생성

### Orval을 통한 자동 생성

OpenAPI 스펙에서 TypeScript 타입과 TanStack Query hooks를 자동 생성합니다.

### 생성 명령어

```bash
pnpm api:generate
```

### 생성되는 파일

```text
packages/api-client/src/
├── openapi.yaml                # BE springdoc 산출 spec (SSOT 입력, 커밋됨)
└── generated/                  # orval 산출물 (gitignored), FE가 참조
    ├── api.ts                  # 모든 hook + handler aggregator
    └── schemas/                # 도메인 타입 정의
```

### 사용 예시

데이터 조회:

```typescript
import { useGetMyMember } from '@bconnect/api-client'

function MyProfile() {
  const { data, isLoading, error } = useGetMyMember()
  // data 는 envelope 의 inner type (Member). customFetch 가 자동 unwrap.

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{data.name}</div>
}
```

데이터 변경:

```typescript
import { useUpdateMyMember } from '@bconnect/api-client'

function EditProfile() {
  const { mutate, isPending } = useUpdateMyMember()

  const handleSubmit = (formData: UpdateMemberRequest) => {
    mutate(
      { data: formData },
      {
        onSuccess: () => toast.success('저장 완료'),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  // ...
}
```

### 주의사항

- BE springdoc 산출인 `src/openapi.yaml` 은 손으로 수정하지 않음
  - BE 변경 시 ci-api-spec이 재생성·커밋
- 로컬 재생성은 orval 단독인 `pnpm api:generate`. 생성물 `generated/`는 gitignored
- 타입 불일치는 대개 BE-FE 계약 drift. BE 갱신 또는 FE 호출부 정합으로 해소
