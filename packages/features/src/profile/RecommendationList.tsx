'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { getTradeLabel } from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'
import { ActionDrawer, cn, MoreVerticalIcon, Skeleton, Tab, useExpandableText } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'

type Mode = 'received' | 'sent'

interface RecommendationListProps {
  /** 앱이 resolve 해 내려줌. undefined = 아직 로딩 중 (스켈레톤) */
  received?: Recommendation[]
  sent?: Recommendation[]
  /**
   * full — 전용 페이지/패널: 언더라인 탭 + full-bleed 행. 헤더는 TopBar/PanelShell 이 보유.
   * inline — 프로필 인라인 섹션: 버튼 토글 + inset 행(부모가 px 보유). 헤더는 호출부 SectionHeader.
   */
  variant?: 'full' | 'inline'
  /** owner 전용. 받은 추천서 카드 ⋮ → 숨김. 없으면 받은 탭 케밥 안 그림 (viewer/plan) */
  onHide?: (id: number) => void
  /** owner 전용. 보낸 추천서 카드 ⋮ → 삭제. 없으면 보낸 탭 케밥 안 그림 (viewer/plan) */
  onDelete?: (id: number) => void
}

export function RecommendationList({
  received,
  sent,
  variant = 'full',
  onHide,
  onDelete,
}: RecommendationListProps) {
  const [mode, setMode] = useQueryState(
    'rtab',
    parseAsStringLiteral(['received', 'sent'] as const)
      .withDefault('received')
      .withOptions({ history: 'push' })
  )
  const [openId, setOpenId] = useState<number | null>(null)

  const active = mode === 'received' ? received : sent
  const isLoading = active === undefined
  const items = active ?? []
  const canAct = mode === 'received' ? !!onHide : !!onDelete
  const openRec = items.find((rec) => rec.id === openId)
  const rowPx = variant === 'full' ? 'px-4' : ''

  return (
    <section className={cn('flex flex-col', variant === 'inline' && 'gap-3')}>
      {variant === 'full' ? (
        <Tab
          items={[
            { key: 'received', label: `받은 추천서${received ? `(${received.length})` : ''}` },
            { key: 'sent', label: `보낸 추천서${sent ? `(${sent.length})` : ''}` },
          ]}
          activeKey={mode}
          onChange={(key) => setMode(key as Mode)}
        />
      ) : (
        <div className="flex gap-2">
          <ToggleButton active={mode === 'received'} onClick={() => setMode('received')}>
            받은 추천서
          </ToggleButton>
          <ToggleButton active={mode === 'sent'} onClick={() => setMode('sent')}>
            보낸 추천서
          </ToggleButton>
        </div>
      )}

      {isLoading ? (
        <ul className="flex flex-col divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={cn('flex gap-3 py-3', rowPx)}>
              <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className={cn('py-3 text-r-14 text-gray-500', rowPx)}>
          {mode === 'received' ? '받은 추천서가 없습니다' : '보낸 추천서가 없습니다'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200">
          {items.map((rec) => (
            <RecommendationItem
              key={rec.id}
              recommendation={rec}
              showMenu={canAct}
              onMenuClick={() => setOpenId(rec.id)}
              rowClassName={rowPx}
            />
          ))}
        </ul>
      )}

      <ActionDrawer
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
        items={
          openRec == null
            ? []
            : mode === 'received'
              ? [{ label: '숨김', onSelect: () => onHide?.(openRec.id) }]
              : [
                  { label: '수정', disabled: true, onSelect: () => {} },
                  { label: '삭제', destructive: true, onSelect: () => onDelete?.(openRec.id) },
                ]
        }
      />
    </section>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] leading-[21px] text-[#1B1B1B]',
        active ? 'bg-[#F5F5F5] font-semibold' : 'bg-white font-normal'
      )}
    >
      {children}
    </button>
  )
}

function RecommendationItem({
  recommendation,
  showMenu,
  onMenuClick,
  rowClassName,
}: {
  recommendation: Recommendation
  showMenu?: boolean
  onMenuClick?: () => void
  rowClassName?: string
}) {
  const { member, content, profile } = recommendation
  const { ref, expanded, showToggle, toggle } = useExpandableText([content], 'height')
  const textId = `recommendation-${recommendation.id}`
  // TODO(#473): BE가 MaskedMember.role 미제공 — 추가되면 실제 role 연결
  const role = '반장(Mocked)'
  const subtitle = [getTradeLabel(profile.primaryTrade), role].join(' · ')

  return (
    <li className={cn('flex gap-3 py-3', rowClassName)}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (dicebear SVG·외부 업로드 대응) */}
        <Image
          src={member.picture || getAvatarUrl(member.name)}
          alt={member.name}
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-m-14 text-[#1B1B1B]">{member.name}</span>
          <span className="text-r-12 text-[#7B7B7B]">{subtitle}</span>
        </div>
        <p
          id={textId}
          ref={ref}
          className={cn(
            'whitespace-pre-wrap text-r-12 text-[#1B1B1B]',
            !expanded && 'line-clamp-2'
          )}
        >
          {content}
        </p>
        {showToggle && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={textId}
            className="cursor-pointer self-start text-r-12 text-[#A5A5A5] underline"
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
      {showMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="추천서 작업"
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center self-start text-gray-500"
        >
          <MoreVerticalIcon size={16} />
        </button>
      )}
    </li>
  )
}
