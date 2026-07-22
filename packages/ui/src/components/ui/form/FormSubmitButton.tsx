/**
 * @figma-scaffold 폼 제출 버튼 표준 — type=submit + isLoading + 모든 필드 입력 시에만 활성 (#400)
 */
'use client'

import { useFormContext } from 'react-hook-form'
import { useAllFieldsFilled } from '../../../hooks/useAllFieldsFilled'
import { Button, type ButtonProps } from '../Button'

interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
  /** mutation.isPending 등 — loading 시 spinner + disabled */
  isLoading?: boolean
  /**
   * 모든 필드가 채워져야 활성화. 기본 true.
   * 필수 필드가 없는 폼(예: 선택 입력만)은 false 로 두면 채움 게이트를 끈다.
   */
  requireAllFilled?: boolean
}

/**
 * `<Form>` (FormProvider) 안의 표준 제출 버튼.
 *  - `type="submit"` 자동
 *  - `isLoading` → spinner + disabled
 *  - `requireAllFilled` (기본 true) → 모든 watched 필드 비면 disabled
 *
 * @example
 *   <FormSubmitButton isLoading={mutation.isPending}>제출</FormSubmitButton>
 *   <FormSubmitButton requireAllFilled={false}>저장</FormSubmitButton>
 */
export function FormSubmitButton({
  isLoading,
  disabled,
  requireAllFilled = true,
  children,
  ...rest
}: FormSubmitButtonProps) {
  const formContext = useFormContext()
  if (!formContext) {
    throw new Error('<FormSubmitButton> must be used inside <Form> (FormProvider).')
  }
  const allFilled = useAllFieldsFilled(formContext.control)
  return (
    <Button
      type="submit"
      isLoading={isLoading}
      disabled={disabled || (requireAllFilled && !allFilled)}
      {...rest}
    >
      {children}
    </Button>
  )
}
