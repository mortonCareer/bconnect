'use client'

import { OfferStatus, TRADE_LABELS } from '@bconnect/api-client'
import type { Address, Trade } from '@bconnect/api-client'
import { Button } from '@bconnect/ui'
import { formatPeriod, withParticle } from '@bconnect/config/format'
import type { OfferActionKind } from './types'

/**
 * OFFER 메시지 카드에 필요한 섭외 상세. 앱이 offerId 로 resolve 해 내려준다
 * (career: useGetTasks 의 task.offer). BE 메시지 자체는 offerId 만 담는다.
 */
export interface OfferMessageDetail {
  offerId: number
  status: OfferStatus
  start?: string
  end?: string
  address?: Address
  trades?: Trade[]
  requirement?: string
}

export interface OfferMessageCardProps {
  /** 미주입 시 상세 행 없이 안내만 — offerId 원문(숫자)은 절대 노출하지 않는다. */
  detail?: OfferMessageDetail
  /**
   * 제안한 업체명. 지금은 앱이 넘기지 않아 항상 placeholder 로 렌더된다.
   * BE 가 업체명을 내려주면 이 prop 만 채우면 된다 — COMPANY_NAME_PLACEHOLDER 주석 참고.
   */
  companyName?: string
  /** 수락 핸들러. 미주입이면 버튼 없음 (plan = 읽기전용). */
  onAccept?: () => void
  onDeny?: () => void
  /** 상세 조회 중 — 숫자 offerId 대신 loading 안내를 보여준다. */
  isDetailLoading?: boolean
  /** 상세 조회 실패 — 액션을 숨기고 실패 안내를 보여준다. */
  isDetailError?: boolean
  /** 다른 카드까지 포함해 처리 중인 액션이 있으면 중복 요청 방지 */
  isActionDisabled?: boolean
  /** 현재 카드에서 처리 중인 액션 — 해당 버튼에 spinner 표시 */
  pendingAction?: OfferActionKind | null
}

/**
 * TODO(BE): 섭외/작업 응답에 업체명 필드가 없다. 채팅 상대 이름으로 대체하면 업체가 아니라
 * 담당자 개인명이 "업체명"으로 찍히므로, 필드가 생길 때까지 시안의 placeholder 를 그대로 쓴다.
 * BE 에 업체명이 추가되면 이 상수를 지우고 ChatView 에서 companyName 을 주입할 것.
 */
const COMPANY_NAME_PLACEHOLDER = 'OOO업체'

/** ACTIVE(응답 대기) 외 상태는 버튼 대신 결과 텍스트로 표시. */
const STATUS_LABELS: Partial<Record<OfferStatus, string>> = {
  [OfferStatus.ACCEPTED]: '수락함',
  [OfferStatus.DENIED]: '거절함',
  [OfferStatus.CANCELED]: '취소됨',
  [OfferStatus.EXPIRED]: '만료됨',
}

/**
 * 시안(1572:13100 등): gap 8 · py 4 · 라벨 45px · 12px.
 * 토큰 기본 line-height(1.6)면 행 높이가 시안(23px)보다 4px 커져 leading-tight(=15px)로 맞춘다.
 * 라벨 폭은 시안(45px, Inter 기준)이 아니라 12px 한글 4자(=48px) 기준 — 45px 로 두면
 * "작업기간"·"현장주소"·"요청사항"이 두 줄로 접힌다. nowrap 으로 한 번 더 막는다.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1 leading-tight">
      <span className="w-12 shrink-0 whitespace-nowrap text-m-12 leading-tight text-gray-900">
        {label}
      </span>
      <span className="text-r-12 leading-tight text-gray-900">{children}</span>
    </div>
  )
}

/**
 * 시안 공종 칩(1572:13112) — 배경 채우기 없이(카드 회색이 비침) 테두리만 + 각진 모서리(2px).
 * FilterChip(알약형 파란 칩)과 다른 형태라 카드 로컬로 둔다.
 */
function TradeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-xs border border-gray-200 px-2 py-1 text-r-12 leading-tight text-gray-900">
      {label}
    </span>
  )
}

/**
 * 시안 버튼(3394:9360·9363) — 흰 배경 + 회색 테두리에 글자만 brand/red.
 * 디자인시스템 outline/destructive 는 테두리까지 색이 들어가 카드 안에서 과하게 튄다.
 */
const OFFER_BUTTON_CLASS = 'border-gray-200 bg-white font-normal'

/**
 * 채팅방의 섭외 제안(MessageType.OFFER) 카드.
 * 기술자(career)는 여기서 바로 수락/거절하고, 업체(plan)는 같은 카드를 읽기전용으로 본다.
 */
export function OfferMessageCard({
  detail,
  companyName,
  onAccept,
  onDeny,
  isDetailLoading,
  isDetailError,
  isActionDisabled,
  pendingAction,
}: OfferMessageCardProps) {
  const company = companyName || COMPANY_NAME_PLACEHOLDER
  const address = detail?.address
  const trades = detail?.trades ?? []
  const canAct = detail?.status === OfferStatus.ACTIVE && (onAccept != null || onDeny != null)
  const statusLabel = detail ? STATUS_LABELS[detail.status] : undefined
  const isAcceptPending = pendingAction === 'accept'
  const isDenyPending = pendingAction === 'deny'
  const actionsDisabled = isActionDisabled || isAcceptPending || isDenyPending

  return (
    // 수신 버블 규칙(ChatMessage variant="theirs")과 동일하게 좌상단만 각지게 둔다.
    // break-keep: 한글이 어절 중간("제안되었습니/다")에서 끊기지 않도록 — word-break 는 상속된다.
    <div className="max-w-75 rounded-tr-xl rounded-br-xl rounded-bl-xl bg-gray-100 px-4 py-3 break-keep">
      {/* 시안 타이틀은 Bold(700). 토큰 text-sb-14 는 600 이라 weight 만 덮는다 */}
      <p className="text-sb-14 font-bold! text-gray-900">
        {withParticle(company, '으로부터', '로부터', true)} 섭외가 제안되었습니다
      </p>

      {detail ? (
        // 시안(1572:13097)은 타이틀 바로 아래에 행이 붙는다 — 사이 여백 없음
        <div>
          <Row label="업체명">{company}</Row>
          {detail.start && detail.end && (
            <Row label="작업기간">{formatPeriod(detail.start, detail.end)}</Row>
          )}
          {address && (
            <Row label="현장주소">
              {address.street}
              {address.detail ? ` ${address.detail}` : ''}
            </Row>
          )}
          {trades.length > 0 && (
            <Row label="공종">
              <span className="flex flex-wrap gap-1">
                {trades.map((t) => (
                  <TradeChip key={t} label={TRADE_LABELS[t]} />
                ))}
              </span>
            </Row>
          )}
          {detail.requirement && <Row label="요청사항">{detail.requirement}</Row>}
        </div>
      ) : isDetailLoading ? (
        <p className="mt-2 text-r-12 text-gray-500">제안 상세를 불러오는 중입니다</p>
      ) : isDetailError ? (
        <p className="mt-2 text-r-12 text-destructive">
          제안 상세를 불러오지 못했습니다. 잠시 후 다시 시도해주세요
        </p>
      ) : (
        <p className="mt-2 text-r-12 text-gray-500">제안 상세를 찾을 수 없습니다</p>
      )}

      {canAct ? (
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="small"
            className={OFFER_BUTTON_CLASS}
            disabled={actionsDisabled}
            isLoading={isAcceptPending}
            onClick={onAccept}
          >
            {isAcceptPending ? '수락 중' : '수락'}
          </Button>
          <Button
            variant="destructive"
            size="small"
            className={OFFER_BUTTON_CLASS}
            disabled={actionsDisabled}
            isLoading={isDenyPending}
            onClick={onDeny}
          >
            {isDenyPending ? '거절 중' : '거절'}
          </Button>
        </div>
      ) : (
        statusLabel && <p className="mt-3 text-right text-m-12 text-gray-500">{statusLabel}</p>
      )}
    </div>
  )
}
