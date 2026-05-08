# React Form Page 템플릿

React Hook Form + Zod 기반 페이지 템플릿입니다.

## 사용 시점

- Figma 디자인에서 폼이 포함된 페이지 생성 시
- 회원가입, 프로필 설정 등 사용자 입력 페이지 구현 시

---

## 파일 구조

```text
apps/career/src/app/[feature]/[step]/
├── page.tsx              # 메인 페이지 컴포넌트
├── schema.ts             # Zod 스키마
├── types.ts              # TypeScript 타입 (필요시)
├── constants.ts          # 상수 정의 (필요시)
└── components/           # 페이지 전용 컴포넌트 (필요시)
    └── FieldSelector.tsx
```

---

## 페이지 템플릿

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@morton/ui'
import { formSchema, type FormData } from './schema'

export default function PageName() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      // Figma 폼 필드에서 추출한 초기값
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      // TODO: API 호출 (ui-api-bind 에이전트에서 채움)
      console.log('Form data:', data)
      router.push('/next-page')
    } catch (error) {
      console.error('Submit error:', error)
      // 에러 처리
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header (필요시) */}

      {/* Main Content */}
      <main className="flex-1 px-5 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              {...register('fieldName')}
              placeholder="입력해주세요"
              error={errors.fieldName?.message}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant={isValid ? 'primary' : 'secondary'}
            size="full"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '다음'}
          </Button>
        </form>
      </main>
    </div>
  )
}
```

---

## Zod 스키마 템플릿

### schema.ts

```typescript
import { z } from 'zod'

export const formSchema = z.object({
  // 필수 문자열
  name: z.string().min(1, '이름을 입력해주세요'),

  // 선택적 문자열
  nickname: z.string().optional(),

  // 이메일
  email: z.string().email('올바른 이메일 형식이 아닙니다'),

  // 전화번호
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),

  // 배열 (최소 1개)
  selectedItems: z.array(z.string()).min(1, '최소 1개를 선택해주세요'),

  // Enum
  experienceLevel: z.enum(['none', 'beginner', 'intermediate', 'expert'], {
    errorMap: () => ({ message: '경력을 선택해주세요' }),
  }),

  // 숫자 범위
  age: z.number().min(18, '18세 이상이어야 합니다').max(100),

  // Boolean
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해주세요',
  }),
})

export type FormData = z.infer<typeof formSchema>
```

---

## 상수 템플릿

### constants.ts

```typescript
export const FIELD_OPTIONS = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
] as const

export const EXPERIENCE_LEVELS = [
  { value: 'none', label: '없음' },
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'expert', label: '고급' },
] as const
```

---

## 타입 템플릿

### types.ts

```typescript
export interface FieldOption {
  value: string
  label: string
}

export interface PageProps {
  // 필요시 정의
}
```

---

## useForm 주요 옵션

| 옵션            | 설명                   | 권장값                |
| --------------- | ---------------------- | --------------------- |
| `resolver`      | 유효성 검사 라이브러리 | `zodResolver(schema)` |
| `mode`          | 검증 시점              | `'onChange'` (실시간) |
| `defaultValues` | 초기값                 | Figma 폼에서 추출     |

### 자주 사용하는 훅 반환값

```typescript
const {
  register,      // input에 연결
  handleSubmit,  // form onSubmit에 연결
  control,       // Controller 컴포넌트용
  watch,         // 값 실시간 관찰
  setValue,      // 프로그래밍적 값 설정
  reset,         // 폼 리셋
  formState: {
    errors,       // 필드별 에러 객체
    isSubmitting, // 제출 중 여부
    isValid,      // 전체 유효성
    isDirty,      // 변경 여부
  },
} = useForm<FormData>({...})
```

---

## Controller 패턴 (커스텀 컴포넌트용)

```typescript
import { Controller } from 'react-hook-form'

<Controller
  name="selectedTags"
  control={control}
  render={({ field }) => (
    <TagSelector
      value={field.value}
      onChange={field.onChange}
      options={TAG_OPTIONS}
    />
  )}
/>
```

---

## 레이아웃 패턴

### 모바일 우선 (360px 기준)

```typescript
<div className="flex min-h-screen flex-col bg-white">
  {/* TopBar: 회원가입 플로우 (진행바) */}
  <TopBar variant="progress" step={2} totalSteps={5} onBack={() => router.back()} />

  {/* 또는 일반 페이지 헤더 */}
  {/* <TopBar variant="default" title="프로필 설정" onBack={() => router.back()} /> */}

  {/* 메인 콘텐츠: 유동 높이 */}
  <main className="flex-1 px-5 py-6">
    {/* 제목 */}
    <h1 className="mb-6 text-2xl font-bold text-gray-900">
      페이지 제목
    </h1>

    {/* 폼 */}
    <form className="space-y-6">
      {/* ... */}
    </form>
  </main>

  {/* 푸터: 고정 (버튼 등) */}
  <footer className="px-5 pb-8">
    <Button variant="primary" size="full">
      다음
    </Button>
  </footer>
</div>
```

---

## Figma → 폼 필드 매핑

| Figma 요소      | React 구현                                         |
| --------------- | -------------------------------------------------- |
| Text Input      | `<Input {...register('field')} />`                 |
| Textarea        | `<textarea {...register('field')} />`              |
| Checkbox        | `<input type="checkbox" {...register('field')} />` |
| Radio Group     | Controller + RadioGroup 컴포넌트                   |
| Select/Dropdown | Controller + Select 컴포넌트                       |
| Tag 선택        | Controller + TagSelector 컴포넌트                  |

---

## 에러 처리 패턴

```typescript
// 필드 레벨 에러
{errors.fieldName && (
  <p className="mt-1 text-sm text-red-500">
    {errors.fieldName.message}
  </p>
)}

// Input 컴포넌트에 에러 전달
<Input
  {...register('name')}
  error={errors.name?.message}
/>
```

---

## 참조

- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- 예시: `apps/career/src/app/signup/profile/page.tsx`
