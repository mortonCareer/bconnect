import type { BoardPosition, BoardRow } from '../types'

export interface BoardOverlayProps {
  rows: BoardRow[]
  position: BoardPosition
  /** 'sm' 썸네일(기본) / 'md' 상세. */
  size?: 'sm' | 'md'
  className?: string
}

const POSITION_CLASS: Record<BoardPosition, string> = {
  tl: 'top-2 left-2',
  tr: 'top-2 right-2',
  bl: 'bottom-2 left-2',
  br: 'bottom-2 right-2',
}

/**
 * 동산보드 스탬프 — 사진 위 코너에 메타데이터를 오버레이(CSS, 서버 합성 없음).
 * relative 래퍼 안에서 absolute 로 배치. 캐릭터 크기는 size 로.
 */
export function BoardOverlay({ rows, position, size = 'sm', className }: BoardOverlayProps) {
  const visible = rows.filter((r) => r.key || r.value)
  if (visible.length === 0) return null
  const textCls = size === 'md' ? 'text-xs' : 'text-[10px]'
  return (
    <div
      className={`pointer-events-none absolute ${POSITION_CLASS[position]} max-w-[80%] rounded-sm bg-black/55 px-2 py-1 text-white ${textCls} ${className ?? ''}`}
    >
      {visible.map((r, i) => (
        <p key={i} className="leading-snug">
          {r.key && <span className="font-semibold">{r.key} </span>}
          <span>{r.value}</span>
        </p>
      ))}
    </div>
  )
}
