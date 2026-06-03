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
  return isFilledDeep(values)
}

/**
 * 깊이 우선 비-비어있음 검사. nested object 필드 (RHF path "address.city" 등) 도 정확히 다룸.
 * - 원시값: `null`/`undefined`/`''` → false, 그 외 → true (boolean false, number 0 도 의도적 정상값으로 간주)
 * - 객체: 모든 키의 값이 isFilledDeep 통과해야 true
 * - 배열: 길이 > 0 + 모든 원소 통과해야 true (빈 배열 = 미입력 간주)
 */
function isFilledDeep(value: unknown): boolean {
  if (value == null || value === '') return false
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (Array.isArray(value)) return value.length > 0 && value.every(isFilledDeep)
  if (typeof value === 'object') {
    const vals = Object.values(value)
    return vals.length > 0 && vals.every(isFilledDeep)
  }
  return true
}
