'use client'

import { Minus, Plus } from 'lucide-react'
import type { BoardRow } from '../types'

export interface BoardMetadataTableProps {
  rows: BoardRow[]
  onChange: (rows: BoardRow[]) => void
  addLabel?: string
  /** 행 추가 시 다음 칸에 미리 채울 템플릿 key 목록 (career 업로드 보드작성). */
  templateKeys?: string[]
  readOnly?: boolean
}

/**
 * 동산보드 동적 key-value 편집표 (⭐ 공유 centerpiece). 고정 컬럼 아님 — 행 추가/삭제 가능.
 * controlled(rows/onChange) — RHF(useFieldArray→replace)·비RHF 양쪽서 재사용.
 * 소비처: plan 파일상세 편집, career 보드작성(step2)·사진정보입력(step3).
 */
export function BoardMetadataTable({
  rows,
  onChange,
  addLabel = '새로운 행 추가하기',
  templateKeys,
  readOnly,
}: BoardMetadataTableProps) {
  const update = (index: number, patch: Partial<BoardRow>) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index))
  const add = () => onChange([...rows, { key: templateKeys?.[rows.length] ?? '', value: '' }])

  if (readOnly) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-300">
        {rows.map((r, i) => (
          <div key={i} className="flex border-b border-gray-200 last:border-b-0">
            <div className="w-24 shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              {r.key}
            </div>
            <div className="flex-1 px-3 py-2 text-sm text-gray-900">{r.value}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center border-b border-gray-200 last:border-b-0">
          <input
            aria-label={`항목 ${i + 1} 제목`}
            value={r.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="항목"
            className="w-24 shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <input
            aria-label={`항목 ${i + 1} 값`}
            value={r.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="내용 입력"
            className="min-w-0 flex-1 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            aria-label={`항목 ${i + 1} 삭제`}
            onClick={() => remove(i)}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-400 transition-colors hover:text-destructive"
          >
            <Minus size={16} aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
      >
        <Plus size={16} aria-hidden />
        {addLabel}
      </button>
    </div>
  )
}
