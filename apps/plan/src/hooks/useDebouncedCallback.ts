'use client'

import { useEffect, useMemo, useRef } from 'react'

export interface DebouncedCallback<A extends unknown[]> {
  (...args: A): void
  /** 대기 중이면 즉시 실행 — 패널 닫기/unmount 시 마지막 입력 유실 방지용 */
  flush: () => void
  cancel: () => void
}

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): DebouncedCallback<A> {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  // 클로저 let 재할당은 react-compiler 가 금지 — 타이머/대기 인자는 ref 로 보관
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgsRef = useRef<A | null>(null)

  const debounced = useMemo(() => {
    const invoke = () => {
      const args = pendingArgsRef.current
      if (args) {
        pendingArgsRef.current = null
        fnRef.current(...args)
      }
    }
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const call = (...args: A) => {
      pendingArgsRef.current = args
      clear()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        invoke()
      }, delayMs)
    }
    call.flush = () => {
      clear()
      invoke()
    }
    call.cancel = () => {
      clear()
      pendingArgsRef.current = null
    }
    return call
  }, [delayMs])

  // unmount 시 대기분 발사 — 저장 유실 방지
  useEffect(() => () => debounced.flush(), [debounced])

  return debounced
}
