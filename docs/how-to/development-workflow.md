# 개발 워크플로우

기능 개발 프로세스

---

## 전체 플로우

```
1. 디자인 (스프린트 단위)
   └─ Figma 시안 → Ready for Dev

2. API 스펙 설계
   └─ CTO: OpenAPI 스펙 초안 작성
   └─ CEO: 리뷰
   └─ 합의 후 머지

3. API 클라이언트 생성
   └─ pnpm api:generate 실행
   └─ TypeScript 타입 및 React Query hooks 자동 생성

4. 병렬 개발 (엔티티/페이지 단위)
   ┌────────────────────────────┐
   │  ERD + BE (CEO)            │
   │       ↕ Mock API (MSW)     │
   │  퍼블리싱 → FE (CTO, FE)    │
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

API 스펙은 `packages/api-client/src/spec/` 하위에 분리 관리되며, `@redocly/cli` 로 lint/bundle, `orval` 로 TypeScript hook + MSW mock 자동 생성합니다.

### 스펙 작성 워크플로

```text
spec/ 수정
    ↓
GitHub PR 생성
    ↓
ci-api-spec (redocly lint) 자동 실행
    ↓
상대 (CEO 또는 CTO): API 스펙 리뷰
    ↓
합의 후 dev → main 브랜치 머지
    ↓
API 클라이언트 자동 생성 (orval)
    ↓
FE 앱(Career, Plan)에서 API 훅 사용
```

> **상세 작성 가이드 (디렉토리 구조, envelope 패턴, 새 endpoint 추가 절차, axis 결정 근거 등) 는 [`packages/api-client/CLAUDE.md`](../packages/api-client/CLAUDE.md) 참조**. 본 문서는 워크플로 관점만 다룸.

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
├── spec/                       # 분리된 spec (SSOT)
├── openapi.bundled.yaml        # redocly bundle 산출물 (gitignored)
└── generated/                  # orval 산출물 (gitignored), FE가 참조
    ├── api.ts                  # 모든 hook + handler aggregator
    └── schemas/                # 도메인 타입 정의
```

### 사용 예시

**데이터 조회:**

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

**데이터 변경:**

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

### FE 개발 (CTO, FE 개발자)

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
  - OpenAPI 스펙에 POST /api/v1/users/{userId}/profile 정의
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

환경 변수 관리는 [CLAUDE.md](../CLAUDE.md)의 "Environment Variables" 섹션 참조

### 로컬 개발 서버 실행

```bash
# Frontend (Next.js)
pnpm dev:career    # http://localhost:3000
pnpm dev:plan      # http://localhost:3001

# Backend (Spring Boot)
cd apps/api
./gradlew bootRun  # http://localhost:8080
```
