# 입력 폼 작성법

> 대상: 프론트엔드 개발자<br>
> 학습 목표: 검증 · 제출 로딩 · 에러 처리 가능한 폼을 표준 패턴으로 작성할 수 있다.

## 1. 검증 스키마

각 페이지별 `schema.ts`파일에 스키마를 정의합니다.

```typescript
// app/login/schema.ts
import { isValidPhoneNumber } from '@bconnect/config/phone'
import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().refine(isValidPhoneNumber, '휴대전화 번호를 정확히 입력해주세요.'),
  code: z.string().length(6, '인증번호 6자리를 입력해주세요.'),
})

export type LoginFormData = z.infer<typeof loginSchema>
```

전화번호·주소 등 공통 데이터는 `@bconnect/config/*` 유틸로 검증합니다.

## 2. useForm 설정

첫 입력부터 안내 문구를 보여주기보다 필드를 한 번 벗어난 뒤 안내 문구를 보여줄 수 있도록 `onTouched`를 사용합니다. `onTouched`는 필드를 한 번 벗어난 시점에 각 필드를 검증·갱신합니다.

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema, type LoginFormData } from './schema'

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  mode: 'onTouched',
  defaultValues: { phone: '', code: '' },
})
```

## 3. 입력 폼 작성

각 필드에 대한 공통 처리(형식, 에러, 접근성 등)을 처리하는 `Form`, `TextField` 컴포넌트를 제공합니다. `<FormField>`를 직접 사용하지 않습니다.

```tsx
import { formatPhoneNumber } from '@bconnect/config/phone'
import { Button, Form, TextField } from '@bconnect/ui'
;<Form {...form}>
  <form onSubmit={onSubmit}>
    <TextField
      control={form.control}
      name="phone"
      label="휴대전화"
      description="품앗이 서비스는 인증된 사용자만 이용하실 수 있어요."
      transform={formatPhoneNumber} // RHF 저장 전 입력값 가공
      type="tel"
      placeholder="010-0000-0000"
    />
    <Button type="submit" size="full" isLoading={form.formState.isSubmitting}>
      제출
    </Button>
  </form>
</Form>
```

별도의 `*Field` 컴포넌트가 제공되지 않는 형식의 입력폼은 shadcn raw primitive로 렌더합니다.

## 4. API 에러 처리

API 실패는 `useServerError` 훅으로 처리합니다.

- 기본적으로 API 공통 응답 형식의 `error.message` 를 그대로 표시합니다.
- 필드 수준이 아닌 폼 전체 에러를 표시하려면 `passthroughError`를 사용합니다.
- 사용자가 입력을 바꾸면 에러가 자동으로 사라집니다.

```tsx
import { useServerError, passthroughError } from '@bconnect/ui'

const server = useServerError(form.control, passthroughError('code'))
```

특정 응답/에러 코드에 대한 분기가 필요한 경우 콜백을 작성합니다.

```tsx
import { useServerError, passthroughError, isApiErrorShape } from '@bconnect/ui'

const server = useServerError(form.control, (err) =>
  isApiErrorShape(err) && err.code === 'OTP_RATE_LIMITED'
    ? { field: 'code', message: '시도 횟수 초과 — 5분 후 다시 시도해주세요.' }
    : passthroughError<LoginFormData>('code')(err)
)
```

`TextField`에 연결하고 폼 전체 에러는 별도로 렌더합니다.

```tsx
<TextField ... serverError={server.fieldError('code')} />

{server.formError && (
  <p className="text-center text-r-14 text-destructive">{server.formError}</p>
)}
```

`fieldError`는 스키마 검증과 API 예외처리를 함께 처리하며, 스키마 검증을 우선합니다.

## 5. 제출 처리

`form.handleSubmit`으로 핸들러를 만들고 try-catch 문에서 `server.capture`를 호출합니다.

```tsx
const onSubmit = form.handleSubmit(async (data) => {
  try {
    await sendOtp.mutateAsync({ data })
    router.push('/next')
  } catch (err) {
    server.capture(err, data)
  }
})
```

제출 로딩은 RHF `isSubmitting`과 TanStack Query `isPending`을 OR로 묶습니다.

```tsx
<Button isLoading={form.formState.isSubmitting || sendOtp.isPending}>제출</Button>
```

## 입력값에 따른 동작

렌더링 중 입력값에 따른 동작을 구한하기 위해 `useWatch` 를 사용합니다 (예: 버튼 활성화 판정).
React 컴포넌트 최적화를 위해 `form.watch()` 사용을 금지합니다.

```tsx
import { useWatch } from 'react-hook-form'

const phone = useWatch({ control: form.control, name: 'phone' })
```

## 멀티 스텝 폼

여러 화면에 걸쳐 폼을 입력해야 하는 경우 (예: 본인인증, 회원가입 등) 단일 `useForm`에 모든 필드를 두고, `step`만 별도 state로 관리합니다.

```tsx
const [step, setStep] = useState<'phone' | 'otp'>('phone')

// 각 단계별 별도 게이팅
const goNext = async () => {
  if (!(await form.trigger('phone'))) return
  await sendOtp.mutateAsync(/* ... */)
  setStep('otp')
}
```

`formState.isValid` 대신 `trigger(field)` 또는 커스텀 로직을 통해 게이팅합니다.

## 폼 작성 대상이 아님

검증·제출이 없는 검색창·필터 같은 입력은 폼이 아닙니다.

- `useForm` 대신 `useState`, `nuqs`를 사용합니다.
- `TextField` 대신 `Input`을 사용합니다.

```tsx
import { Input } from '@bconnect/ui'
import { useQueryState } from 'nuqs'

const [keyword, setKeyword] = useQueryState('q')
<Input value={keyword ?? ''} onChange={(e) => setKeyword(e.target.value)} />
```

## 참조

- [ADR-0013: 프론트엔드 폼 처리 표준](../explanation/adr/0013-form-handling-standard.md)
