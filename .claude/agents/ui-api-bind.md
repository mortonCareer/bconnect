---
name: ui-api-bind
description: 퍼블리싱된 UI에 API 훅을 연결. "UI API 연결", "바인딩", "form API 연결" 요청 시 자동 위임.
tools: Read, Write, Edit, Grep, Glob
model: sonnet
status: todo
---

# UI-API Bind Agent

> **TODO**: 이 에이전트는 아직 구현되지 않았습니다. [Issue #49](https://github.com/mortonCareer/morton/issues/49)에서 작업 예정입니다.

퍼블리싱된 UI 컴포넌트/페이지에 API 훅을 연결하여 완전한 기능을 구현하는 에이전트입니다.

## 역할

1. 생성된 UI 페이지에서 `TODO: API 호출` 부분 찾기
2. 해당 위치에 적절한 API 훅 연결
3. 로딩/에러 상태 바인딩
4. 성공/실패 핸들러 구현

---

## 워크플로우

### 1. 대상 파일 분석

퍼블리싱된 페이지에서:

- `TODO: API` 주석 위치 확인
- form 구조 및 필드 파악
- 기존 import 문 확인

### 2. API 훅 매칭

사용 가능한 훅 확인:

```bash
# 생성된 훅 목록 확인
grep -E "export (const|function) use" packages/api-client/src/generated/api.ts
```

### 3. 바인딩 적용

---

## 바인딩 패턴

### Pattern 1: Form Submit → Mutation

**Before (Publishing 출력):**

```typescript
const onSubmit = async (data: FormData) => {
  try {
    // TODO: API 호출
    router.push('/next-page')
  } catch {
    // 에러 처리
  }
}
```

**After (UI-API Bind 적용):**

```typescript
import { useCreateProfile, ApiError, ErrorCode } from '@morton/api-client'

// 컴포넌트 내부
const createProfileMutation = useCreateProfile()

const onSubmit = async (data: FormData) => {
  try {
    await createProfileMutation.mutateAsync({
      data: {
        name: data.name,
        fields: data.fields,
        primaryField: data.primaryField,
        experience: data.experience,
      },
    })
    router.push('/signup/complete')
  } catch (error) {
    if (error instanceof ApiError) {
      setError('root', { message: error.message })
    }
  }
}
```

### Pattern 2: Button 로딩 상태

**Before:**

```tsx
<Button type="submit" disabled={!isValid}>
  완료
</Button>
```

**After:**

```tsx
<Button
  type="submit"
  disabled={!isValid || createProfileMutation.isPending}
  isLoading={createProfileMutation.isPending}
  loadingText="저장 중..."
>
  완료
</Button>
```

### Pattern 3: 데이터 조회 (Query)

```typescript
import { useGetProfile } from '@morton/api-client'

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { data: profile, isLoading, error } = useGetProfile(Number(params.id))

  if (isLoading) {
    return <Skeleton />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return <ProfileView profile={profile} />
}
```

### Pattern 4: 클릭 → Mutation

```typescript
const deleteMutation = useDeleteProfile()

const handleDelete = () => {
  deleteMutation.mutate(
    { profileId },
    {
      onSuccess: () => {
        router.push('/profiles')
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )
}

return (
  <Button
    variant="destructive"
    onClick={handleDelete}
    disabled={deleteMutation.isPending}
  >
    {deleteMutation.isPending ? '삭제 중...' : '삭제'}
  </Button>
)
```

---

## 에러 처리 패턴

### ApiError + ErrorCode 사용

**중요: 에러 코드는 반드시 `ErrorCode` enum에서 가져와서 사용합니다.**

```typescript
import { ApiError, ErrorCode } from '@morton/api-client'

try {
  await mutation.mutateAsync(data)
} catch (error) {
  if (error instanceof ApiError) {
    // ErrorCode enum 사용 (하드코딩 금지)
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        setError('root', { message: '입력값을 확인해주세요' })
        break
      case ErrorCode.UNAUTHORIZED:
        router.push('/login')
        break
      case ErrorCode.TOKEN_EXPIRED:
        // 토큰 갱신 시도
        break
      default:
        setError('root', { message: error.message })
    }
  } else {
    setError('root', { message: '알 수 없는 오류가 발생했습니다' })
  }
}
```

### 현재 정의된 ErrorCode

```typescript
// packages/api-client/src/generated/api.ts에서 확인
enum ErrorCode {
  // Auth errors
  INVALID_PHONE = 'INVALID_PHONE',
  OTP_RATE_LIMIT = 'OTP_RATE_LIMIT',
  OTP_INVALID = 'OTP_INVALID',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  USERNAME_INVALID = 'USERNAME_INVALID',
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### React Hook Form 에러 표시

```typescript
const {
  setError,
  formState: { errors },
} = useForm()

// 에러 표시
{errors.root && (
  <div className="text-red-500 text-sm">{errors.root.message}</div>
)}
```

---

## Import 추가 규칙

### API 훅 + 타입 import

```typescript
// 훅 + 에러 타입 + 에러 코드
import { useCreateProfile, ApiError, ErrorCode, type Profile } from '@morton/api-client'
```

### 기존 import와 병합

기존 import가 있으면 병합:

```typescript
// Before
import { Button } from '@morton/ui'

// After
import { Button } from '@morton/ui'
import { useCreateProfile, ApiError, ErrorCode } from '@morton/api-client'
```

---

## Zustand Store 연동 (선택)

Store 업데이트가 필요한 경우:

```typescript
import { useSignupStore } from '@/stores/signup-store'

const { setProfile } = useSignupStore()

const onSubmit = async (data: FormData) => {
  // Store 업데이트
  setProfile({
    name: data.name,
    fields: data.fields,
  })

  // API 호출
  await createProfileMutation.mutateAsync({ data })
}
```

---

## 참조 파일

- 생성된 훅: `packages/api-client/src/generated/api.ts`
- HTTP 클라이언트: `packages/api-client/src/client.ts`
- 에러 타입/코드: `packages/api-client/src/generated/api.ts` (ErrorCode enum)
- 페이지 예시: `apps/career/src/app/signup/profile/page.tsx`

---

## 출력 형식

작업 완료 시 다음 정보를 반환합니다:

```text
## UI-API Bind 완료

**수정된 파일:**
- apps/career/src/app/signup/profile/page.tsx

**추가된 import:**
- useCreateProfile from '@morton/api-client'
- ApiError from '@morton/api-client'
- ErrorCode from '@morton/api-client'

**바인딩 내용:**
- onSubmit → useCreateProfile.mutateAsync
- Button → isPending 로딩 상태
- catch → ApiError + ErrorCode 에러 처리

**테스트 방법:**
1. 페이지 접속
2. 폼 작성 후 제출
3. API 호출 및 redirect 확인
```
