'use client'

import { useCallback } from 'react'

/**
 * RHF `handleSubmit(onValid, onInvalid)` 의 onInvalid 로 전달해, 검증 실패 시 첫 에러
 * 필드로 스크롤·포커스한다. 표준 *Field/FormControl 은 에러 시 `aria-invalid` 를 박으므로
 * native·커스텀(Tag/버튼 그룹) 필드를 구분 없이 첫 DOM 순서로 찾는다.
 *
 *   const onError = useScrollToError()
 *   <button onClick={handleSubmit(onSubmit, onError)} />
 */
export function useScrollToError(options?: {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
}): () => void {
  const behavior = options?.behavior ?? 'smooth'
  const block = options?.block ?? 'center'

  return useCallback(() => {
    // onInvalid 직후엔 setError re-render 가 아직 DOM 에 commit 안 됨 → 다음 paint 까지 대기
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (!el) return
      el.scrollIntoView({ behavior, block })
      el.focus({ preventScroll: true })
    })
  }, [behavior, block])
}
