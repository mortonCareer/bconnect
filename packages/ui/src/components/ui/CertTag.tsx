/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12113
 */
import { cn } from '../../lib/utils'

export interface CertTagProps {
  label: string
  className?: string
}

export function CertTag({ label, className }: CertTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[7px] border border-gray-300 bg-gray-100 px-2 py-1 text-r-14 text-gray-700',
        className
      )}
    >
      {label}
    </span>
  )
}
