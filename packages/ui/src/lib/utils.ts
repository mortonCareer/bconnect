import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'sb-12',
        'sb-14',
        'sb-16',
        'sb-20',
        'sb-24',
        'm-12',
        'm-14',
        'm-16',
        'r-12',
        'r-14',
        'r-16',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
