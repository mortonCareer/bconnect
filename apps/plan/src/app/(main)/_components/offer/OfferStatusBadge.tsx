import { cn } from '@bconnect/ui'
import type { OfferStatus } from '@/stores/offer-queue-store'

const STYLES: Record<OfferStatus, string> = {
  offered: 'border-primary bg-secondary text-primary',
  waiting: 'border-gray-300 bg-white text-gray-400',
}

const LABELS: Record<OfferStatus, string> = {
  offered: '섭외중',
  waiting: '대기중',
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={cn(
        'text-r-12 inline-flex h-[22px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border px-2',
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  )
}
