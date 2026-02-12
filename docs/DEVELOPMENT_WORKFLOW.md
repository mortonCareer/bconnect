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

모든 API 스펙은 **`packages/api-client/src/openapi.yaml`** 파일에서 관리됩니다.

### 스펙 작성 도구

**VSCode 42Crunch OpenAPI 익스텐션** 사용:

- 실시간 스펙 검증
- 자동 완성 지원
- 시각적 API 문서 미리보기

### 스펙 설계 프로세스

```
CTO: openapi.yaml 초안 작성
    ↓
GitHub PR 생성
    ↓
CEO: API 스펙 리뷰
    ↓
피드백 반영 및 논의
    ↓
합의 후 main 브랜치 머지
    ↓
API 클라이언트 자동 생성
```

### 스펙 작성 가이드

**엔드포인트 정의:**

```yaml
paths:
  /api/v1/users/{userId}:
    get:
      summary: 사용자 정보 조회
      tags: [User]
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse_User'
        '404':
          description: 사용자 없음
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse_Error'
```

**공통 응답 포맷:**

모든 API는 `ApiResponse<T>` 래퍼를 사용합니다:

```typescript
// 성공
{ success: true, data: T }

// 실패
{ success: false, error: { code: string, message: string } }
```

---

## API 클라이언트 생성

### Orval을 통한 자동 생성

OpenAPI 스펙에서 TypeScript 타입과 React Query hooks를 자동 생성합니다.

### 생성 명령어

```bash
pnpm api:generate
```

### 생성되는 파일

```
packages/api-client/src/
├── openapi.yaml          # API 스펙 (SSOT)
├── generated/
│   ├── api.ts            # API 클라이언트
│   ├── models.ts         # TypeScript 타입
│   └── hooks.ts          # React Query hooks
```

### 사용 예시

**데이터 조회:**

```typescript
import { useGetUserQuery } from '@morton/api-client'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useGetUserQuery({ userId })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{data.name}</div>
}
```

**데이터 변경:**

```typescript
import { useUpdateUserMutation } from '@morton/api-client'

function EditProfile() {
  const { mutate, isPending } = useUpdateUserMutation()

  const handleSubmit = (formData: ProfileFormData) => {
    mutate(
      { userId: '123', data: formData },
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

- `openapi.yaml` 수정 후 반드시 `pnpm api:generate` 실행
- 생성된 파일(`generated/` 폴더)은 직접 수정하지 않음
- 타입 불일치 시 스펙 수정 후 재생성

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
- **Java**: JDK 17+ (Backend)
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
