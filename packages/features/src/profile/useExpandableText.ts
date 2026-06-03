'use client'

import { useEffect, useRef, useState, type DependencyList } from 'react'

type Axis = 'height' | 'width'

/**
 * 더보기/접기 텍스트 공통 로직 — overflow 측정 + 펼침 상태.
 * axis='height': 세로 line-clamp (scrollHeight), axis='width': 가로 truncate (scrollWidth).
 * 레이아웃/마크업은 호출부가 소유한다 (RecommendationItem 세로, WorkCard 가로).
 */
export function useExpandableText(deps: DependencyList, axis: Axis = 'height') {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (expanded) return
    const el = ref.current
    if (!el) return
    setTruncated(
      axis === 'height' ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth
    )
  }, [expanded, axis, ...deps])

  return {
    ref,
    expanded,
    truncated,
    showToggle: expanded || truncated,
    toggle: () => setExpanded((v) => !v),
  }
}
