'use client'

import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'

export type DragMode = 'move' | 'resize-start' | 'resize-end'

// 이 미만 이동은 클릭으로 간주, 드래그 시작 안 함
const DRAG_THRESHOLD_PX = 4

/**
 * 간트 바 1축 제약 드래그 (#576). 이동/좌우 리사이즈가 같은 snap 메커니즘 공유:
 * pointerdown → deltaX 추적 → round(deltaX/dayWidth) 일 단위 snap → pointerup 에 commit.
 * 임계 미만으로 끝난 좌클릭은 onTap (작업 편집 패널 진입, #582).
 */
export function useBarDrag(
  dayWidth: number,
  onCommit: (mode: DragMode, deltaDays: number) => void,
  onTap?: () => void
) {
  const [drag, setDrag] = useState<{ mode: DragMode; deltaDays: number } | null>(null)
  const originX = useRef(0)
  const activated = useRef(false)

  function handleDown(mode: DragMode) {
    return (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      originX.current = e.clientX
      activated.current = false
      setDrag({ mode, deltaDays: 0 })
    }
  }

  function handleMove(e: PointerEvent<HTMLElement>) {
    const deltaX = e.clientX - originX.current
    if (!activated.current && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return
    activated.current = true
    const deltaDays = Math.round(deltaX / dayWidth)
    setDrag((prev) => (prev && prev.deltaDays !== deltaDays ? { ...prev, deltaDays } : prev))
  }

  function handleUp() {
    if (drag) {
      if (activated.current && drag.deltaDays !== 0) onCommit(drag.mode, drag.deltaDays)
      else if (!activated.current) onTap?.()
    }
    activated.current = false
    setDrag(null)
  }

  function handleCancel() {
    activated.current = false
    setDrag(null)
  }

  return {
    drag,
    moveHandleProps: {
      onPointerDown: handleDown('move'),
      onPointerMove: handleMove,
      onPointerUp: handleUp,
      onPointerCancel: handleCancel,
    },
    startHandleDown: handleDown('resize-start'),
    endHandleDown: handleDown('resize-end'),
  }
}
