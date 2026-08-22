'use client'

import { OfferStatus, TRADE_LABELS } from '@bconnect/api-client'
import type { Address, Trade } from '@bconnect/api-client'
import { Button, cn } from '@bconnect/ui'
import { formatPeriod } from '@bconnect/config/format'
import type { OfferActionKind } from './types'

/** 앱에서 offerId로 조회해 주입하는 섭외 카드 상세. */
export interface OfferMessageDetail {
  offerId: number
  status: OfferStatus
  start?: string
  end?: string
  address?: Address
  trades?: Trade[]
  requirement?: string
}

export interface OfferMessageEntry {
  /** 조회로 채운 상세. 종료 섭외처럼 작업 정보가 없으면 status 만 담긴다. */
  detail?: OfferMessageDetail
  /** 이 섭외의 상세를 아직 조회 중 */
  isLoading?: boolean
  /** 이 섭외의 상세 조회가 실패 — 상세 없음(정상)과 구분해 안내한다. */
  isError?: boolean
}

export interface OfferMessageCardProps {
  /** 미주입 시 상세 행 없이 안내만 — offerId 원문(숫자)은 절대 노출하지 않는다. */
  detail?: OfferMessageDetail
  /** 본인이 보낸 제안인지 여부. */
  isMine?: boolean
  /** 제안받은 기술자 이름. */
  recipientName?: string
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

/** 읽기 전용 카드와 종료된 섭외에 표시할 상태. */
const STATUS_LABELS: Partial<Record<OfferStatus, string>> = {
  [OfferStatus.ACTIVE]: '대기중',
  [OfferStatus.ACCEPTED]: '수락함',
  [OfferStatus.DENIED]: '거절함',
  [OfferStatus.CANCELED]: '취소됨',
  [OfferStatus.EXPIRED]: '만료됨',
}

/** 네 글자 라벨이 줄바꿈되지 않도록 고정 폭을 사용한다. */
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

/** 섭외 카드 전용 공종 칩. */
function TradeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-xs border border-gray-200 px-2 py-1 text-r-12 leading-tight text-gray-900">
      {label}
    </span>
  )
}

/** 카드 안에서는 variant의 색상 테두리를 중립색으로 덮는다. */
const OFFER_BUTTON_CLASS = 'border-gray-200 bg-white font-normal'

/**
 * 채팅방의 섭외 제안(MessageType.OFFER) 카드.
 * 기술자(career)는 여기서 바로 수락/거절하고, 업체(plan)는 같은 카드를 읽기전용으로 본다.
 */
export function OfferMessageCard({
  detail,
  isMine,
  recipientName,
  onAccept,
  onDeny,
  isDetailLoading,
  isDetailError,
  isActionDisabled,
  pendingAction,
}: OfferMessageCardProps) {
  const address = detail?.address
  const trades = detail?.trades ?? []
  // 상세를 상태만 채워 내려주는 경로가 있다(작업 목록에 없는 섭외 = 종료됐거나 내 배정이 아닌 건).
  // detail 유무로 분기하면 행이 하나도 없는 빈 카드가 되므로 실제 행 유무로 가른다.
  const hasRows = Boolean(
    (detail?.start && detail?.end) || address || trades.length > 0 || detail?.requirement
  )
  const canAct = detail?.status === OfferStatus.ACTIVE && (onAccept != null || onDeny != null)
  const statusLabel = detail ? STATUS_LABELS[detail.status] : undefined
  const isAcceptPending = pendingAction === 'accept'
  const isDenyPending = pendingAction === 'deny'
  const actionsDisabled = isActionDisabled || isAcceptPending || isDenyPending

  // 발신 카드에만 기술자명을 주어로 쓴다. 수신 카드의 주어(업체명)는 표시하지 않기로 했다(#1159).
  const title = isMine
    ? recipientName
      ? `${recipientName}님에게 섭외 요청이 전달되었습니다`
      : '섭외 요청이 전달되었습니다'
    : '섭외 요청을 제안받았습니다'

  return (
    // 일반 채팅 말풍선과 같은 방향별 모서리를 사용한다.
    <div
      className={cn(
        'max-w-75 px-4 py-3 break-keep bg-gray-100',
        isMine
          ? 'rounded-tl-xl rounded-bl-xl rounded-br-xl'
          : 'rounded-tr-xl rounded-br-xl rounded-bl-xl'
      )}
    >
      <p className="text-sb-14 font-bold! text-gray-900">{title}</p>

      {detail && hasRows ? (
        <div>
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
      ) : detail ? (
        // 섭외는 찾았지만 작업 상세가 없는 경우 — 종료된 섭외처럼 작업 목록에서 빠진 건은
        // 단건 조회(GET /offers/{id})가 상태만 주고 작업 필드를 주지 않는다.
        <p className="mt-2 text-r-12 text-gray-500">작업 상세를 불러올 수 없습니다</p>
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
