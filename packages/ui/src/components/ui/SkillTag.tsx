/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12099
 * @figma-state 미선택 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12102
 */
import { cn } from '../../lib/utils'

export interface SkillTagProps {
  label: string
  selected?: boolean
  className?: string
}

export function SkillTag({ label, selected, className }: SkillTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-m-12',
        selected
          ? 'border-primary bg-secondary text-primary'
          : 'border-gray-300 bg-white text-gray-700',
        className
      )}
    >
      {label}
    </span>
  )
}
