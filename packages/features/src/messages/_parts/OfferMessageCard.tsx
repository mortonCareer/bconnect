'use client'

import { OfferStatus, TRADE_LABELS } from '@bconnect/api-client'
import type { Address, Trade } from '@bconnect/api-client'
import { Button, FilterChip } from '@bconnect/ui'
import { formatPeriod } from '@bconnect/config/format'

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
  /** 제안한 업체명. TODO(BE): offer/task 응답에 업체명(companyId)이 없어 채팅 상대 이름으로 대체 중. */
  companyName?: string
  /** 수락 핸들러. 미주입이면 버튼 없음 (plan = 읽기전용). */
  onAccept?: () => void
  onDeny?: () => void
  /** 처리 중 — 중복 클릭 방지 */
  isPending?: boolean
}

/** ACTIVE(응답 대기) 외 상태는 버튼 대신 결과 텍스트로 표시. */
const STATUS_LABELS: Partial<Record<OfferStatus, string>> = {
  [OfferStatus.ACCEPTED]: '수락함',
  [OfferStatus.DENIED]: '거절함',
  [OfferStatus.CANCELED]: '취소됨',
  [OfferStatus.EXPIRED]: '만료됨',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1">
      <span className="w-16 shrink-0 text-m-14 text-gray-500">{label}</span>
      <span className="text-r-14 text-gray-900">{children}</span>
    </div>
  )
}

/**
 * 채팅방의 섭외 제안(MessageType.OFFER) 카드.
 * 기술자(career)는 여기서 바로 수락/거절하고, 업체(plan)는 같은 카드를 읽기전용으로 본다.
 */
export function OfferMessageCard({
  detail,
  companyName,
  onAccept,
  onDeny,
  isPending,
}: OfferMessageCardProps) {
  const address = detail?.address
  const trades = detail?.trades ?? []
  const canAct = detail?.status === OfferStatus.ACTIVE && (onAccept != null || onDeny != null)
  const statusLabel = detail ? STATUS_LABELS[detail.status] : undefined

  return (
    <div className="max-w-md rounded-xl bg-gray-100 p-4">
      <p className="text-sb-14 text-gray-900">
        {companyName ? `${companyName}로부터` : '업체로부터'} 섭외가 제안되었습니다
      </p>

      {detail ? (
        <div className="mt-2">
          <Row label="업체명">{companyName || '업체명 없음'}</Row>
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
              <span className="flex flex-wrap gap-1.5">
                {trades.map((t) => (
                  <FilterChip key={t} label={TRADE_LABELS[t]} />
                ))}
              </span>
            </Row>
          )}
          {detail.requirement && <Row label="요청사항">{detail.requirement}</Row>}
        </div>
      ) : (
        <p className="mt-2 text-r-14 text-gray-500">제안 상세를 불러올 수 없습니다</p>
      )}

      {canAct ? (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="small" disabled={isPending} onClick={onAccept}>
            수락
          </Button>
          <Button variant="ghost" size="small" disabled={isPending} onClick={onDeny}>
            거절
          </Button>
        </div>
      ) : (
        statusLabel && <p className="mt-3 text-right text-m-14 text-gray-500">{statusLabel}</p>
      )}
    </div>
  )
}
