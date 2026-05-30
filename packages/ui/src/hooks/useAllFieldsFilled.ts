'use client'

import { useWatch, type Control, type FieldValues } from 'react-hook-form'

/**
 * 폼의 모든 watched 필드가 truthy 값인지 (= 모두 입력됐는지) 반환.
 *
 * "모든 필드 required" 패턴의 폼에서 제출 버튼 활성화 조건으로 적합 —
 * zod 검증과 분리돼 입력 도중 빨간 에러 없이도 "비어있을 땐 비활성" UX 가능.
 * 옵셔널 필드가 섞인 폼이면 `useWatch({ name: [...required] })` 로 직접 골라 watch.
 *
 * React Compiler 호환 (`form.watch()` 가 아닌 `useWatch` 훅 사용).
 *
 * @example
 *   const allFilled = useAllFieldsFilled(form.control)
 *   <Button disabled={!allFilled}>제출</Button>
 */
export function useAllFieldsFilled<T extends FieldValues>(control: Control<T>): boolean {
  const values = useWatch({ control })
  return Object.values(values).every((v) => v != null && v !== '')
}
