/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1503-12064
 */
import { cn } from '../../lib/utils'
import { XIcon } from '../../icons/XIcon'

export interface FilterChipProps {
  label: string
  onRemove: () => void
  className?: string
}

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${label} 필터 제거`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1 text-m-14 text-primary transition-opacity hover:opacity-80',
        className
      )}
    >
      {label}
      <XIcon size={12} />
    </button>
  )
}
