'use client'

import { useCallback, useEffect, useState } from 'react'

export interface UnsavedGuard {
  /** ConfirmDialog open 바인딩 */
  confirmOpen: boolean
  setConfirmOpen: (open: boolean) => void
  /** dirty 면 확인 다이얼로그를 띄우고, 아니면 즉시 proceed 실행 */
  requestClose: (proceed: () => void) => void
  /** ConfirmDialog onConfirm 바인딩 — 보류 중이던 proceed 실행 */
  confirmProceed: () => void
}

/**
 * 미저장 변경 가드 (편집 중 이탈 경고). PanelTask 의 beforeunload + requestClose 패턴을 훅으로 추출.
 *
 * - dirty=true 동안 브라우저 새로고침/닫기에 beforeunload 경고.
 * - requestClose(proceed): dirty 면 ConfirmDialog 를 띄우고(확인 시 proceed), 아니면 즉시 proceed.
 *
 * 한계: Next 소프트 네비게이션(<Link>) 이탈까지는 막지 못한다(ESC/명시적 닫기/새로고침만). PanelTask 동일.
 */
export function useUnsavedGuard(dirty: boolean): UnsavedGuard {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState<{ run: () => void } | null>(null)

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const requestClose = useCallback(
    (proceed: () => void) => {
      if (dirty) {
        setPending({ run: proceed })
        setConfirmOpen(true)
      } else {
        proceed()
      }
    },
    [dirty]
  )

  const confirmProceed = useCallback(() => {
    setConfirmOpen(false)
    pending?.run()
    setPending(null)
  }, [pending])

  return { confirmOpen, setConfirmOpen, requestClose, confirmProceed }
}
