/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1472-11199
 */
'use client'

import { cn } from '../../lib/utils'

/** 이 값을 넘는 카운트는 `99+` 로 표기 (뱃지 폭 고정) */
const MAX_TITLE_COUNT = 99

export interface TitleCountBadgeProps {
  /** 0·undefined 면 렌더하지 않는다 (읽을 알림이 없으면 뱃지도 없음) */
  count?: number
  className?: string
}

/**
 * 헤더 제목 우측에 인라인으로 붙는 카운트 뱃지 (#1016).
 * 아이콘 위에 겹쳐 띄우는 `TopBar` 내부 `CountBadge`(absolute) 와 달리 제목과 같은 줄에 흐른다.
 * 패널 헤더(`PanelHeader`, plan)와 풀페이지 헤더(`TopBar`, career)가 같은 시안을 공유하므로 ui 로 뺐다.
 */
export function TitleCountBadge({ count, className }: TitleCountBadgeProps) {
  if (count == null || count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white',
        className
      )}
    >
      {count > MAX_TITLE_COUNT ? `${MAX_TITLE_COUNT}+` : count}
    </span>
  )
}
