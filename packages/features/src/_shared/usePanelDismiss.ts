'use client'

import { useEffect, useRef } from 'react'

/**
 * 패널 공통 a11y — 마운트 시 root 포커스, Esc 로 onClose. root ref 를 반환한다.
 * @panel 뷰(Profile/Messages/Chat/Notifications)가 공유.
 */
export function usePanelDismiss(onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return rootRef
}
