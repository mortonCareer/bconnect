import type { ReactNode } from 'react'
import type { Memo } from '../types'

export interface MemoCardProps {
  memo: Memo
  /** 헤더 우측 케밥(수정/삭제) — 앱이 메뉴 프리미티브로 렌더. */
  renderKebab?: (memo: Memo) => ReactNode
}

function formatMemoDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 메모 표시 (날짜 + 케밥 + 멀티라인 본문). 테두리 없음 — 목록에서 divider 로 구분. */
export function MemoCard({ memo, renderKebab }: MemoCardProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400">{formatMemoDate(memo.createdAt)}</span>
        {renderKebab?.(memo)}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-gray-900">{memo.content}</p>
    </div>
  )
}
