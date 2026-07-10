'use client'

import type { Address, Trade } from '@bconnect/api-client'
import { TRADE_LABELS } from '@bconnect/api-client'
import { TopBar } from '@bconnect/ui'
import type { ReactNode } from 'react'
import { formatWorkPeriod } from '../_lib/formatWorkPeriod'

/** 등록/수정 화면 상단에 읽기전용으로 표시되는 작업(Task) 메타 — 입력 필드가 아니라 taskId 연결값. */
export interface WorkPostMeta {
  company?: string
  start: string
  end: string
  address?: Address
  trades: Trade[]
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-sm text-gray-900">{label}</span>
      <span className="flex-1 text-sm text-gray-500">{children}</span>
    </div>
  )
}

function WorkPostMetaRows({ meta }: { meta: WorkPostMeta }) {
  const address = meta.address
    ? `${meta.address.street ?? ''}${meta.address.detail ? ` ${meta.address.detail}` : ''}`.trim()
    : ''
  return (
    <div className="flex flex-col gap-3 px-4 pt-6">
      <MetaRow label="업체명">{meta.company || '-'}</MetaRow>
      <MetaRow label="시공기간">{formatWorkPeriod(meta.start, meta.end)}</MetaRow>
      <MetaRow label="현장주소">{address || '-'}</MetaRow>
      <MetaRow label="시공분야">
        {meta.trades.length > 0 ? meta.trades.map((t) => TRADE_LABELS[t]).join(', ') : '-'}
      </MetaRow>
    </div>
  )
}

interface WorkPostFormProps {
  /** 상단 타이틀 — 등록 "작업물 게시" / 수정 "작업물 수정" */
  title: string
  /** 상단 우측 액션 라벨 — 등록 "게시" / 수정 "완료" */
  actionLabel: string
  onAction: () => void
  onBack: () => void
  actionDisabled?: boolean
  /** 읽기전용 작업 메타. null 이면 메타 영역 생략(빈 상태 등). */
  meta: WorkPostMeta | null
  /** 이미지 영역 — 등록: 편집 가능한 ImageField / 수정: 표시전용 */
  imageSlot: ReactNode
  /** 작업 설명 영역 — TextareaField 등 */
  contentSlot: ReactNode
}

/**
 * 작업물 등록·수정 공용 폼 셸. 이슈 #769: 등록 화면은 수정 디자인(node 1239-7490)을 재사용하고
 * 타이틀/액션 문구·내부 호출만 다르다. task 메타(업체명/시공기간/현장주소/시공분야)는 읽기전용,
 * 사용자 입력은 이미지 + 작업 설명뿐.
 */
export function WorkPostForm({
  title,
  actionLabel,
  onAction,
  onBack,
  actionDisabled,
  meta,
  imageSlot,
  contentSlot,
}: WorkPostFormProps) {
  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title={title}
        actionLabel={actionLabel}
        onAction={onAction}
        showAction
        actionDisabled={actionDisabled}
        onBack={onBack}
      />
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="px-4 pt-4">{imageSlot}</div>
        {meta && <WorkPostMetaRows meta={meta} />}
        <div className="px-4 pt-6">{contentSlot}</div>
      </form>
    </div>
  )
}
