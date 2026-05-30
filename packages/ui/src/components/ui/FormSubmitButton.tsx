/**
 * @figma-scaffold 폼 제출 버튼 표준 — type=submit + isLoading + 모든 필드 입력 시에만 활성 (#400)
 */
'use client'

import { useFormContext } from 'react-hook-form'
import { useAllFieldsFilled } from '../../hooks/useAllFieldsFilled'
import { Button, type ButtonProps } from './Button'

interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
  /** mutation.isPending 등 — loading 시 spinner + disabled */
  isLoading?: boolean
}

/**
 * `<Form>` (FormProvider) 안의 표준 제출 버튼.
 *
 * 흡수하는 것:
 *  - `type="submit"` 자동
 *  - `isLoading` → spinner + disabled
 *  - 모든 watched 필드 비어있으면 disabled (useAllFieldsFilled)
 *
 * disabled 조건이 zod 검증이 아닌 "필드 채워졌나" 라 입력 도중 빨간 에러 없이도
 * 버튼 활성 시점 제어 가능 — `mode: 'onSubmit'` 와 자연 호환.
 *
 * 옵셔널 필드 섞인 폼은 useAllFieldsFilled 가 부적합 → raw `<Button type="submit">` 사용.
 *
 * @example
 *   <FormSubmitButton isLoading={mutation.isPending}>제출</FormSubmitButton>
 */
export function FormSubmitButton({
  isLoading,
  disabled,
  children,
  ...rest
}: FormSubmitButtonProps) {
  const formContext = useFormContext()
  if (!formContext) {
    throw new Error('<FormSubmitButton> must be used inside <Form> (FormProvider).')
  }
  const allFilled = useAllFieldsFilled(formContext.control)
  return (
    <Button type="submit" isLoading={isLoading} disabled={disabled || !allFilled} {...rest}>
      {children}
    </Button>
  )
}
