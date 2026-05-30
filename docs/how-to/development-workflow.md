# 개발 워크플로우

> **For**: 모든 개발자.
> **You'll be able to**: BE 구현 → 스펙 갱신 → 클라이언트 codegen → FE 작업 → 연동 절차 수행.

기능 개발 프로세스

---

## 전체 플로우

BE 코드를 API 기준(SSOT)으로 하는 BE-first 사이클 ([ADR-0014](../explanation/adr/0014-be-code-as-api-ssot.md)).

```
1. 디자인 (스프린트 단위)
   └─ Figma 시안 → Ready for Dev

2. API 설계 합의 (스펙 코드 작성 전)
   └─ CTO ↔ CEO: 엔드포인트/요청-응답 형태 합의

3. BE 구현 (CEO)
   └─ Spring Boot controller/DTO/service 작성
   └─ 단위 테스트
   └─ 구현 과정에서 결정된 세부 형태 반영

4. 스펙 갱신 (보통 BE PR과 같이)
   └─ packages/api-client/src/spec/ 갱신 (BE 코드 형태에 맞춰)
   └─ pnpm api:generate → TypeScript 타입 + React Query hooks + MSW mock 자동 생성

5. FE 작업 (CTO, FE 개발자)
   └─ 퍼블리싱 (Figma → Tailwind 컴포넌트)
   └─ Generated hooks + MSW mock으로 동작 구현
   └─ 실제 API 연동 확인 (preview 환경)

6. QA (PR 프리뷰 환경)
   └─ 상세 프로세스: [qa-and-testing.md](./qa-and-testing.md) 참조

7. 완료
   └─ PR 머지 → 프로덕션 배포
```

퍼블리싱(UI/UX 구현)은 BE와 무관하게 진행 가능합니다. 다만 데이터 연동(generated hook 사용)은 4번 머지 후 가능합니다.

---

## API 스펙 관리

API 스펙은 BE 구현을 따라가는 산출물입니다 ([ADR-0014](../explanation/adr/0014-be-code-as-api-ssot.md)). `packages/api-client/src/spec/` 하위에 분리 관리되며, `@redocly/cli` 로 lint/bundle, `orval` 로 TypeScript hook + MSW mock 자동 생성합니다.

### 스펙 갱신 워크플로

```text
BE 구현 완료
    ↓
spec/ 갱신 (BE 코드 형태에 맞춰)
    ↓
GitHub PR 생성 (보통 BE 변경과 같은 PR)
    ↓
ci-api-spec (redocly lint) 자동 실행
    ↓
리뷰 → dev 머지
    ↓
API 클라이언트 자동 생성 (orval)
    ↓
FE 앱(Career, Plan)에서 generated hook 사용
```

> **상세 작성 가이드 (디렉토리 구조, envelope 패턴, 새 endpoint 추가 절차, axis 결정 근거 등) 는 [`packages/api-client/CLAUDE.md`](../../packages/api-client/CLAUDE.md) 참조**. 본 문서는 워크플로 관점만 다룸.

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
├── spec/                       # 분리된 spec (BE 코드를 따라가는 산출물)
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

## Mock API (MSW)

dev 환경에서 모든 API 요청은 **MSW (Mock Service Worker)** 가 가로채서 mock 응답으로 답합니다. production 빌드에선 `NODE_ENV` 가드로 `@bconnect/mocks` 가 tree-shake.

상세는 패키지 SoT:

- spec + orval codegen + 새 endpoint 추가 절차: [`packages/api-client/CLAUDE.md`](../../packages/api-client/CLAUDE.md)
- 핸들러 / stateful override / 브라우저·테스트 entry / race-safe gate / 새 override 추가 절차: [`packages/mocks/CLAUDE.md`](../../packages/mocks/CLAUDE.md)

career / plan 둘 다 자동 적용됨 (둘 다 `@bconnect/mocks` 사용).

---

## BE-first 개발

[ADR-0014](../explanation/adr/0014-be-code-as-api-ssot.md)에 따라 BE 코드를 API 기준(SSOT)으로 하는 BE-first 사이클로 진행합니다.

### BE 개발 (CEO)

1. ERD 설계 및 엔티티 생성
2. Repository, Service, Controller 구현
3. Spring Boot API 엔드포인트 작성
4. 단위 테스트 작성 (`./gradlew test`)
5. 구현 마무리 시점에 스펙 갱신
   - `packages/api-client/src/spec/v1/<도메인>.yaml` 수정
   - `pnpm api:lint && pnpm api:generate`로 검증
   - 보통 BE 코드 변경과 같은 PR에 포함

### FE 개발 (CTO, FE 개발자)

1. **퍼블리싱** (BE와 무관하게 진행 가능):
   - Figma 시안 기반 컴포넌트 작성
   - Tailwind CSS + shadcn/ui
   - 반응형 스타일링

2. **MSW Mock 연동** (BE + 스펙 갱신 머지 후):
   - 자동 생성된 mock 응답으로 UI 동작 확인
   - 로딩/에러 상태 구현
   - Empty state 처리

3. **실제 API 연동 확인**:
   - 동일 generated hooks 사용 (mock과 동일 인터페이스)
   - dev 환경 mock → preview/prod에서 실제 BE 호출
   - 에러 처리 및 재시도 로직 추가

### 개발 흐름 예시

**시나리오: 사용자 프로필 업로드 기능**

```
Day 1-2: API 설계 합의 (스펙 코드 작성 전)
  - CTO ↔ CEO: POST /api/v1/users/{userId}/profile 엔드포인트 합의
  - 요청/응답 대략적인 형태 합의

Day 3-5: BE 구현 (CEO)
  - User 엔티티 수정
  - 파일 업로드 controller/service 작성
  - S3 연동
  - 단위 테스트
  - 구현 마무리 후 스펙 갱신 (같은 PR에 포함)

Day 3-5 (병렬): 퍼블리싱 (CTO, FE 개발자)
  - Figma 시안 기반 컴포넌트 작성
  - UI/UX 동작 구현 (데이터 연동 전)

Day 6-7: FE 데이터 연동 (BE PR 머지 후)
  - generated hook + MSW mock으로 데이터 흐름 구현
  - 파일 미리보기 등 구현
  - preview 환경에서 실제 BE 호출 확인

Day 8: QA
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
