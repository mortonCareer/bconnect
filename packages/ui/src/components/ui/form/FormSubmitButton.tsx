/**
 * @figma-scaffold 폼 제출 버튼 표준 — type=submit + isLoading + 스키마 검증 통과 시에만 활성 (#400, #993)
 */
'use client'

import { useFormContext, useFormState } from 'react-hook-form'
import { Button, type ButtonProps } from '../Button'

interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
  /** mutation.isPending 등 — loading 시 spinner + disabled */
  isLoading?: boolean
  /**
   * 폼 전체가 스키마 검증을 통과해야 활성화. 기본 true.
   * 한 폼을 여러 단계로 나눠 제출하는 화면(예: OTP phone → code)은 false 로 두고
   * `disabled` 로 단계별 조건을 직접 지정한다.
   */
  requireValid?: boolean
}

/**
 * `<Form>` (FormProvider) 안의 표준 제출 버튼.
 *  - `type="submit"` 자동
 *  - `isLoading` → spinner + disabled
 *  - `requireValid` (기본 true) → `formState.isValid` 가 false 면 disabled
 *
 * `useForm` 에 `resolver` 와 `mode: 'onTouched' | 'onChange'` 가 있어야 `isValid` 가 입력 중 갱신된다.
 * resolver 가 없는 폼은 `isValid` 가 항상 true 라 이 게이트가 no-op 이며, `disabled` 로 직접 판정한다.
 *
 * @example
 *   <FormSubmitButton isLoading={mutation.isPending}>제출</FormSubmitButton>
 *   <FormSubmitButton requireValid={false} disabled={!isPhoneValid}>인증번호 받기</FormSubmitButton>
 */
export function FormSubmitButton({
  isLoading,
  disabled,
  requireValid = true,
  children,
  ...rest
}: FormSubmitButtonProps) {
  const formContext = useFormContext()
  if (!formContext) {
    throw new Error('<FormSubmitButton> must be used inside <Form> (FormProvider).')
  }
  const { isValid } = useFormState({ control: formContext.control })
  return (
    <Button
      type="submit"
      isLoading={isLoading}
      disabled={disabled || (requireValid && !isValid)}
      {...rest}
    >
      {children}
    </Button>
  )
}
