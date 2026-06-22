/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1503-12064
 */
import { cn } from '../../lib/utils'
import { XIcon } from '../../icons/XIcon'

export interface FilterChipProps {
  label: string
  /** 제거 핸들러. 생략 시 X 없는 읽기전용 칩(표시용). */
  onRemove?: () => void
  className?: string
}

const chipClass =
  'inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1 text-m-14 text-primary'

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  if (!onRemove) {
    return <span className={cn(chipClass, className)}>{label}</span>
  }
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${label} 필터 제거`}
      className={cn(chipClass, 'cursor-pointer transition-opacity hover:opacity-80', className)}
    >
      {label}
      <XIcon size={12} />
    </button>
  )
}
