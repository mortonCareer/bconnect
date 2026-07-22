/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-14172
 */
import { cn } from '../../lib/utils'

/** 이 값을 넘는 카운트는 `99+` 로 표기 (뱃지 폭 고정) */
const MAX_BADGE_COUNT = 99

export interface CountBadgeProps {
  count?: number
  className?: string
}

/**
 * 인라인 카운트 뱃지 — 라벨(사이드바 메뉴·패널 제목) 옆에 붙는 안 읽음 개수.
 * 0 이하 또는 미정의면 렌더하지 않는다.
 * 아이콘 우상단에 겹치는 오버레이 뱃지는 `TopBar` 내부 전용 변형을 따로 쓴다.
 */
export function CountBadge({ count, className }: CountBadgeProps) {
  if (count === undefined || count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-white',
        className
      )}
    >
      {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
    </span>
  )
}
