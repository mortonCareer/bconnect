'use client'

import { usePathname } from 'next/navigation'
import { isChatDetailRoute, isBottomNavHidden } from './nav-visibility'

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const className = isChatDetailRoute(pathname)
    ? 'flex h-dvh flex-col overflow-hidden'
    : isBottomNavHidden(pathname)
      ? ''
      : 'pb-[70px]'

  return <main className={className}>{children}</main>
}
