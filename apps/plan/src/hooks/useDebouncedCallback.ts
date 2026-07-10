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

  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let pendingArgs: A | null = null

    const invoke = () => {
      if (pendingArgs) {
        const args = pendingArgs
        pendingArgs = null
        fnRef.current(...args)
      }
    }
    const clear = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const call = (...args: A) => {
      pendingArgs = args
      clear()
      timer = setTimeout(() => {
        timer = null
        invoke()
      }, delayMs)
    }
    call.flush = () => {
      clear()
      invoke()
    }
    call.cancel = () => {
      clear()
      pendingArgs = null
    }
    return call
  }, [delayMs])

  // unmount 시 대기분 발사 — 저장 유실 방지
  useEffect(() => () => debounced.flush(), [debounced])

  return debounced
}
