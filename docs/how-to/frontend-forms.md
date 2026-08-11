# 프론트엔드 폼 작성

> **For**: BConnect FE 개발자 — `apps/career`·`apps/plan`에 폼을 만드는 사람.
> **You'll be able to**: 검증·제출 로딩·클라이언트/서버 에러를 갖춘 폼을 표준 패턴으로 작성한다.

폼 처리 표준의 결정 배경·대안 검토는 [ADR 0013](../explanation/adr/0013-form-handling-standard.md). 이 문서는 그 표준대로 폼을 _어떻게 만드는지_ 의 레시피다.

> **상태**: 여기 나오는 `@bconnect/ui`의 `TextField`·`useServerError`·`Form` suite 는 ADR 0013 채택에 따라 도입 _진행 중_. 도입 완료 전까지 이 문서는 목표 상태를 기술한다.

---

## 0. 폼인가? — react-hook-form 사용 기준

**검증 또는 제출이 있으면 폼** → `react-hook-form`. 그 외 입력은 폼이 아니다.

|               | 폼                          | 폼 아님             |
| ------------- | --------------------------- | ------------------- |
| 예            | 로그인·회원가입·프로필 편집 | 검색창·필터·탭      |
| 상태 관리     | `useForm` (RHF)             | `useState` / `nuqs` |
| 입력 컴포넌트 | `TextField`                 | bare `Input`        |

검색창에 `useForm`을 쓰지 말 것 — 오버킬. 이 문서의 1~5는 _폼_ 에만 해당한다.

---

## 1. 검증 스키마 — `schema.ts`

페이지 폴더에 `schema.ts`를 두고 zod **v4**로 스키마를 정의한다. `zod/v3` import 금지.

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

공통 데이터(전화번호·주소 등)는 `@bconnect/config/*` 유틸로 검증한다 — 직접 정규식 작성 금지.

---

## 2. `useForm` 설정

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema, type LoginFormData } from './schema'

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  mode: 'onTouched', // blur 후 검증
  defaultValues: { phone: '', code: '' },
})
```

`mode: 'onTouched'` — 필드를 한 번 벗어난(blur) 뒤부터 검증해 갱신한다. `isValid` 게이팅 버튼은 유지하면서 첫 타이핑 중 에러 노출을 피한다. (`onSubmit` 은 제출 전 `isValid` 가 안 갱신돼 게이팅 버튼이 안 열리고, `onChange` 는 첫 글자부터 naggy.)

---

## 3. UI — `TextField`

`<Form>`으로 감싸고 각 필드를 `TextField`로 선언한다. raw `FormField`를 직접 쓰지 않는다.

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

`TextField`가 라벨·설명·입력·에러 메시지와 접근성 배선(`aria-invalid`·`aria-describedby`·`htmlFor`)을 모두 처리한다. 클라이언트(zod) 검증 에러는 자동 표시 — 호출부가 손댈 게 없다.

---

## 4. 서버 에러 — `useServerError`

API 실패는 `useServerError` 훅으로 다룬다. 서버 에러를 _제출 시점 입력값_ 에 묶어, 사용자가 입력을 바꾸면 자동으로 사라지게 한다(derive). `setError('root')`나 onChange마다 `clearErrors` 호출하는 방식은 금지.

기본은 BE envelope 의 `error.message` 를 그대로 표시한다 (ADR-0014: BE = API SSOT). 표준 헬퍼 `passthroughError` 사용:

```tsx
import { useServerError, passthroughError } from '@bconnect/ui'

// 'code' 필드 밑에 BE 메시지 그대로 표시. 폼 전역으로 띄우려면 passthroughError() (인자 없이).
const server = useServerError(form.control, passthroughError('code'))
```

특수 분기가 필요한 경우 (특정 에러 코드만 FE 가 자체 메시지로 덮어쓰기) 에만 콜백 직접 작성:

```tsx
import { useServerError, passthroughError, isApiErrorShape } from '@bconnect/ui'

const server = useServerError(form.control, (err) =>
  isApiErrorShape(err) && err.code === 'OTP_RATE_LIMITED'
    ? { field: 'code', message: '시도 횟수 초과 — 5분 후 다시 시도해주세요.' }
    : passthroughError<LoginFormData>('code')(err)
)
```

`TextField`에 연결하고, 폼 전역 에러는 따로 렌더:

```tsx
<TextField ... serverError={server.fieldError('code')} />

{server.formError && (
  <p className="text-center text-r-14 text-destructive">{server.formError}</p>
)}
```

`fieldError`는 클라이언트(zod) 에러와 한 슬롯에서 합성된다 — zod 에러 우선, 없으면 서버 에러.

---

## 5. 제출 처리

`form.handleSubmit`으로 핸들러를 만들고 catch에서 `server.capture`를 호출한다.

```tsx
const onSubmit = form.handleSubmit(async (data) => {
  try {
    await sendOtp.mutateAsync({ data })
    router.push('/next')
  } catch (err) {
    server.capture(err, data) // 제출값과 함께 에러 캡처
  }
})
```

제출 로딩은 RHF `isSubmitting`과 React Query `isPending`을 OR로 묶는다:

```tsx
<Button isLoading={form.formState.isSubmitting || sendOtp.isPending}>제출</Button>
```

---

## 폼 값을 렌더에서 읽을 때 — `useWatch`

버튼 활성화 판정 등으로 폼 값을 렌더 중에 읽어야 하면 **`useWatch`** 를 쓴다. `form.watch()`는 금지 — React Compiler가 해당 컴포넌트 최적화를 건너뛴다(bail-out).

```tsx
import { useWatch } from 'react-hook-form'

// ❌ const phone = form.watch('phone')
// ✅
const phone = useWatch({ control: form.control, name: 'phone' })
```

---

## 멀티스텝 폼

한 화면에서 단계가 바뀌는 폼(로그인 phone→otp 등)은 단일 `useForm`에 모든 필드를 두고 `step`만 별도 `useState`로 둔다.

```tsx
const [step, setStep] = useState<'phone' | 'otp'>('phone')

// phone 단계 제출 — 그 필드만 부분 검증
const goNext = async () => {
  if (!(await form.trigger('phone'))) return
  await sendOtp.mutateAsync(/* ... */)
  setStep('otp')
}
```

`formState.isValid`는 _전체 스키마_ 기준이라 단계별 게이팅엔 못 쓴다 — `trigger(field)` 또는 개별 판정을 쓴다.

---

## 추상화를 벗어날 때 — raw `FormField`

`TextField`(및 `*Field` 패밀리)는 일반적인 필드를 덮는다. 디자이너 시안이 `*Field`로 표현되지 않는 커스텀 레이아웃을 요구하면 — shadcn raw primitive(`FormField`/`FormItem`/`FormControl`/`FormMessage`)로 내려가도 된다. **지양하되 금지는 아니다.** 그 경우에도 `Form` 컨텍스트·zod·`useServerError`는 동일하게 쓴다.

---

## 비-폼 입력

검색창·필터처럼 검증·제출이 없는 입력은 폼이 아니다 — `useForm` 대신 `useState`/`nuqs`, `TextField` 대신 bare `Input`을 쓴다.

```tsx
import { Input } from '@bconnect/ui'
import { useQueryState } from 'nuqs'

const [keyword, setKeyword] = useQueryState('q')
;<Input value={keyword ?? ''} onChange={(e) => setKeyword(e.target.value)} />
```

---

## 참고

- [ADR 0013 — 프론트엔드 폼 처리 표준](../explanation/adr/0013-form-handling-standard.md) — 왜 이렇게 정했나
