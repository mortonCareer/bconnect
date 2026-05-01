# 개발 워크플로우

Morton의 기능 개발 프로세스를 설명합니다.

---

## 전체 플로우

```
1. 디자인 (스프린트 단위)
   └─ Figma 시안 → Ready for Dev

2. API 스펙 설계
   └─ CTO: openapi.yaml 초안 작성
   └─ CEO: 리뷰
   └─ 합의 후 머지

3. API 클라이언트 생성
   └─ pnpm api:generate 실행
   └─ TypeScript 타입 및 React Query hooks 자동 생성

4. 병렬 개발 (엔티티/페이지 단위)
   ┌────────────────────────────┐
   │  ERD + BE (CEO)            │
   │       ↕ Mock API (MSW)     │
   │  퍼블리싱 → FE (CTO)       │
   └────────────────────────────┘

5. API 연동 (스토리 단위)
   └─ FE: Mock → 실제 API 교체
   └─ 테스트 수행

6. QA (PR 프리뷰 환경)
   └─ 상세 프로세스: QA_AND_TESTING.md 참조

7. 완료
   └─ PR 머지 → 프로덕션 배포
```

---

## API 스펙 관리

### SSOT (Single Source of Truth)

API 스펙은 **`packages/api-client/src/spec/`** 하위에 분리되어 관리됩니다.

```text
packages/api-client/
├── .redocly.yaml                                    # lint 규칙 + bundle config
└── src/
    ├── spec/                                        # 분리된 spec (SSOT)
    │   ├── openapi.yaml                             # 진입점 (info, tags, paths $ref)
    │   ├── _shared/                                 # cross-cutting (envelope, error)
    │   │   └── components/
    │   │       └── schemas/
    │   │           ├── ApiSuccessResponseBase.yaml  # 모든 200 응답 envelope base
    │   │           ├── ApiError.yaml                # error 코드/메시지 구조
    │   │           └── ApiErrorResponse.yaml        # 모든 4xx/5xx 응답 형태
    │   ├── paths/                                   # 45 path 파일
    │   │   └── v1/
    │   │       ├── auth/
    │   │       │   ├── otp/{send,verify}.yaml
    │   │       │   ├── refresh.yaml
    │   │       │   └── logout.yaml
    │   │       ├── members/
    │   │       │   ├── index.yaml                   # /api/v1/members
    │   │       │   ├── me.yaml
    │   │       │   ├── roles.yaml
    │   │       │   └── check-username.yaml
    │   │       ├── credentials/
    │   │       │   ├── index.yaml
    │   │       │   ├── types.yaml
    │   │       │   └── {credentialId}/
    │   │       │       ├── index.yaml               # /api/v1/credentials/{id}
    │   │       │       ├── accept.yaml
    │   │       │       └── deny.yaml
    │   │       └── ...                              # chats, posts, profiles, ...
    │   └── components/
    │       └── schemas/                             # 47 도메인 schema 파일
    │           ├── Member.yaml
    │           ├── Chat.yaml
    │           ├── Profile.yaml
    │           └── ...
    ├── openapi.bundled.yaml                         # redocly bundle 산출물 (gitignored)
    └── generated/                                   # orval 산출물 (gitignored)
        ├── api.ts                                   # react-query hook + MSW mock aggregator
        └── schemas/                                 # 각 schema 의 TS 타입
```

### 디렉토리 axis 결정

- **paths**: 버전 + 리소스 (`paths/v1/<resource>/[<sub>|{param}/]<file>.yaml`)
  - URL 구조 ↔ 디렉토리 1:1 정렬
  - 향후 v2 등장 시 `paths/v2/` clean break
  - collection root 는 `index.yaml`, dynamic param 은 `{paramName}/` 디렉토리
- **components/schemas**: 도메인 schema 평면 + cross-cutting 은 `_shared/` 분리
  - 매우 빈번하게 ref 되는 envelope/error schema 는 `_shared/` (단계적 도메인 packing 의 1단계)
  - 도메인 단위 packing 은 follow-up 으로 진행 중
- **components 활용 (현재)**: schemas, securitySchemes 만. responses/parameters/examples 등은 도메인 packing 후 활용 검토.

### 스펙 작성 도구

**VSCode 42Crunch OpenAPI 익스텐션** 사용:

- 실시간 스펙 검증
- 자동 완성 지원
- 시각적 API 문서 미리보기

`@redocly/cli` 가 spec 검증 + bundle:

```bash
pnpm api:lint        # redocly lint (CI 에서 자동)
pnpm api:bundle      # spec → openapi.bundled.yaml
pnpm api:generate    # bundle + orval 자동 chain
```

### 스펙 설계 프로세스

스펙 작성은 CTO 또는 CEO 누구나 시작 가능. 주체는 endpoint 의 도메인에 따라 결정 — FE-주도 endpoint 는 CTO, BE 내부 모델 노출은 CEO 가 초안 작성하는 식.

```text
작성자: spec/paths/v1/<resource>/<sub>.yaml + spec/components/schemas/<Y>.yaml 추가
       + spec/openapi.yaml 의 paths 에 $ref 등록
    ↓
pnpm api:lint (로컬) 통과 확인
    ↓
GitHub PR 생성
    ↓
ci-api-spec (redocly lint) 자동 실행
    ↓
상대 (CEO 또는 CTO): API 스펙 리뷰
    ↓
피드백 반영 및 논의
    ↓
합의 후 dev → main 브랜치 머지
    ↓
API 클라이언트 자동 생성
```

### 공통 응답 포맷

모든 API 는 `ApiResponse<T>` 래퍼 (BE `ApiResponse.java` 와 정렬):

```typescript
// 성공
{ success: true, data: T, error: null }

// 실패
{ success: false, data: null, error: { code: string, status: number, message: string, logLevel: string } }
```

spec 에서는 envelope 을 다음 패턴으로 표현:

```yaml
# spec/paths/v1/members/me.yaml
get:
  operationId: getMyMember
  tags: [Members]
  responses:
    '200':
      description: OK
      content:
        application/json:
          schema:
            allOf:
              - $ref: ../../../../_shared/components/schemas/ApiSuccessResponseBase.yaml
              - type: object
                required: [data]
                properties:
                  data:
                    $ref: ../../../../components/schemas/Member.yaml
    '401':
      description: |
        - `A007` 유효하지 않은 액세스 토큰입니다
        - `A008` 세션이 만료되었습니다
      content:
        application/json:
          schema:
            $ref: ../../../../_shared/components/schemas/ApiErrorResponse.yaml
```

`customFetch` ([packages/api-client/src/client.ts](https://github.com/mortonCareer/bconnect/blob/dev/packages/api-client/src/client.ts)) 가 envelope 을 unwrap 하므로 React Query hook 의 `data` 는 inner `T` 타입 (Generic `ExtractData<T>`).

### 새 endpoint 추가 절차

1. **schema 추가** (필요 시):
   - 도메인 schema → `spec/components/schemas/<Schema>.yaml`
   - cross-cutting (envelope/error 등) → `spec/_shared/components/schemas/<Schema>.yaml` (드물게)
2. **path 파일 추가**: `spec/paths/v1/<resource>/<sub>.yaml`
   - collection root: `<resource>/index.yaml`
   - sub-resource: `<resource>/<sub>.yaml`
   - dynamic param 은 디렉토리: `<resource>/{paramName}/<action>.yaml`
3. **root openapi.yaml 등록**: `paths` 섹션에 URL → `$ref: paths/v1/.../<file>.yaml`
4. **로컬 검증**: `pnpm api:lint` 통과 → `pnpm api:generate` (bundle + orval 자동 chain)
5. **PR 생성**: `ci-api-spec` 통과 확인

---

## API 클라이언트 생성

### Orval을 통한 자동 생성

OpenAPI 스펙에서 TypeScript 타입과 React Query hooks를 자동 생성합니다.

### 생성 명령어

```bash
pnpm api:generate
```

### 생성되는 파일

```text
packages/api-client/src/
├── spec/                       # 분리된 spec (SSOT, gitignored 아님)
├── openapi.bundled.yaml        # redocly bundle 산출물 (gitignored)
└── generated/                  # orval 산출물 (gitignored)
    ├── api.ts                  # 모든 hook + handler aggregator
    └── schemas/                # 도메인 타입 정의
```

### 사용 예시

**데이터 조회:**

```typescript
import { useGetMyMember } from '@morton/api-client'

function MyProfile() {
  const { data, isLoading, error } = useGetMyMember()
  // data 는 envelope 의 inner type (Member). customFetch 가 자동 unwrap.

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{data.name}</div>
}
```

**데이터 변경:**

```typescript
import { useUpdateMyMember } from '@morton/api-client'

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

- `spec/` 수정 후 반드시 `pnpm api:generate` 실행 (bundle + orval 자동 chain)
- 생성된 파일 (`generated/`, `openapi.bundled.yaml`) 은 모두 gitignored — 직접 수정하지 않음
- 타입 불일치 시 spec 수정 후 재생성
- `pnpm api:lint` 로 spec 품질 사전 검증 가능 (CI 에서 `ci-api-spec` 자동 실행)

---

## Mock API

### 현재 상태

개발 중에는 **MSW (Mock Service Worker)** 마이그레이션을 진행 중입니다.  
현재는 `apps/mock-server/server.js`를 임시로 사용하고 있습니다.

### MSW 마이그레이션 계획 (진행 중)

**MSW 사용 시 장점:**

- 브라우저/Node 모두 지원
- 실제 네트워크 레이어에서 인터셉트
- TypeScript 지원 우수
- OpenAPI 스펙과 연동 가능
- 개발/테스트 환경 모두 사용 가능

**예정 구조:**

```
apps/career/src/mocks/
├── handlers/
│   ├── auth.ts       # 인증 관련 mock
│   ├── user.ts       # 사용자 관련 mock
│   └── index.ts
├── browser.ts        # 브라우저용 MSW
└── server.ts         # Node용 MSW (테스트)
```

**핸들러 예시 (예정):**

```typescript
import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/v1/auth/otp/send', async ({ request }) => {
    const { phone } = await request.json()

    return HttpResponse.json({
      success: true,
      data: {
        expiresAt: new Date(Date.now() + 180000).toISOString(),
      },
    })
  }),

  http.post('/api/v1/auth/otp/verify', async ({ request }) => {
    const { phone, code } = await request.json()

    if (code === '123456') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock_token',
          isNew: false,
          user: { id: 1, phone, name: '테스트' },
        },
      })
    }

    return HttpResponse.json(
      {
        success: false,
        error: { code: 'INVALID_CODE', message: '잘못된 인증 코드' },
      },
      { status: 401 }
    )
  }),
]
```

### 개발 환경 설정 (예정)

```typescript
// apps/career/src/main.tsx
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start()
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
})
```

---

## 병렬 개발

### BE 개발 (CEO)

1. ERD 설계 및 엔티티 생성
2. Repository, Service, Controller 구현
3. Spring Boot API 엔드포인트 작성
4. 단위 테스트 작성 (`./gradlew test`)

### FE 개발 (CTO)

1. **퍼블리싱**: Figma 시안 기반 컴포넌트 작성
   - Tailwind CSS 사용
   - shadcn/ui 컴포넌트 활용
   - 반응형 스타일링

2. **MSW Mock 연동**:
   - Mock 핸들러로 UI 동작 확인
   - 로딩/에러 상태 구현
   - Empty state 처리

3. **실제 API 연동**:
   - BE 개발 완료 후 Mock → 실제 API 교체
   - 생성된 React Query hooks 사용
   - 에러 처리 및 재시도 로직 추가

### 병렬 개발 예시

**시나리오: 사용자 프로필 업로드 기능**

```
Day 1-2: API 스펙 합의
  - openapi.yaml에 POST /api/v1/users/{userId}/profile 정의
  - 요청/응답 스키마 정의

Day 3-5: 병렬 개발
  ┌─────────────────────────┐  ┌──────────────────────────┐
  │ CEO: BE 개발             │  │ CTO: FE 개발              │
  │ - User 엔티티 수정       │  │ - MSW 핸들러 작성        │
  │ - 파일 업로드 로직       │  │ - 프로필 업로드 폼 UI    │
  │ - S3 연동               │  │ - 파일 미리보기 구현     │
  │ - API 테스트            │  │ - Mock으로 동작 확인     │
  └─────────────────────────┘  └──────────────────────────┘

Day 6: API 연동
  - FE: Mock 핸들러 비활성화
  - 실제 API 호출로 전환
  - 통합 테스트

Day 7: QA
  - PR 프리뷰 환경에서 QA 진행
```

---

## 개발 환경 설정

### 필수 도구

- **Node.js**: v20+
- **pnpm**: v9+
- **Java**: JDK 21+ (Backend)
- **VSCode 익스텐션**:
  - 42Crunch OpenAPI
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### 환경 변수

환경 변수 관리는 **[AGENTS.md](../AGENTS.md)**의 "Environment Variables" 섹션 참조

### 로컬 개발 서버 실행

```bash
# Frontend (Next.js)
pnpm dev:career    # http://localhost:3000
pnpm dev:plan      # http://localhost:3001

# Backend (Spring Boot)
cd apps/api
./gradlew bootRun  # http://localhost:8080

# Mock API (임시, MSW 마이그레이션 전)
cd apps/mock-server
node server.js     # http://localhost:8080
```

---

## 다음 단계

- **Git 워크플로우**: [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
- **QA 및 테스팅**: [QA_AND_TESTING.md](./QA_AND_TESTING.md)
- **배포**: [DEPLOYMENT.md](./DEPLOYMENT.md)
