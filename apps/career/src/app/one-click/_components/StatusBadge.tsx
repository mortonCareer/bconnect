import { cn } from '@bconnect/ui'
import type { StatusType } from '../_clients/types'

const variantClasses: Record<StatusType, string> = {
  positive: 'bg-[#E8F5E9] text-[#2E7D32]',
  neutral: 'bg-bconnect-gray-100 text-bconnect-gray-500',
  negative: 'bg-[#FFEBEE] text-[#C62828]',
  error: 'border border-bconnect-error text-bconnect-error bg-transparent',
}

interface StatusBadgeProps {
  status: string
  statusType: StatusType
  className?: string
}

export function StatusBadge({ status, statusType, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        variantClasses[statusType],
        className
      )}
    >
      {status}
    </span>
  )
}
