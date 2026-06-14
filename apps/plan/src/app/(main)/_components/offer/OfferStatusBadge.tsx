import { cn } from '@bconnect/ui'
import type { OfferStatus } from '@/stores/offer-queue-store'

const STYLES: Record<OfferStatus, string> = {
  offered: 'border-primary bg-secondary font-semibold text-primary',
  waiting: 'border-[#e5e5e5] bg-white font-normal text-[#a5a5a5]',
}

const LABELS: Record<OfferStatus, string> = {
  offered: '섭외중',
  waiting: '대기중',
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border px-2 text-[11px] leading-[16.5px]',
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  )
}
