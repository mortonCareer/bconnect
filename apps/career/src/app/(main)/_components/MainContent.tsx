'use client'

import { usePathname } from 'next/navigation'
import { isChatDetailRoute, isChromelessRoute } from './route-chrome'

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const className = isChatDetailRoute(pathname)
    ? 'flex h-dvh flex-col overflow-hidden'
    : isChromelessRoute(pathname)
      ? ''
      : 'pb-[70px]'

  return <main className={className}>{children}</main>
}
