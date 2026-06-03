/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1120
 */
import type { SVGProps } from 'react'

interface ChevronDownIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ChevronDownIcon({ size = 16, ...props }: ChevronDownIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        transform="translate(3.2 6.4)"
        d="M0.144247 0.168567C0.345708 -0.0463238 0.683223 -0.0572037 0.898103 0.144247L4.8 3.80228L8.70187 0.144247C8.9168 -0.0572037 9.2543 -0.0463238 9.45579 0.168567C9.65718 0.383458 9.6463 0.720972 9.43147 0.922423L5.16477 4.92246C4.95962 5.11478 4.64039 5.11478 4.43523 4.92246L0.168567 0.922423C-0.0463238 0.720972 -0.0572037 0.383458 0.144247 0.168567Z"
        fill="currentColor"
      />
    </svg>
  )
}
