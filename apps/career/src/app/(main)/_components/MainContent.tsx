'use client'

import { usePathname } from 'next/navigation'

/** BottomNav가 숨겨지는 경로에서는 padding-bottom을 제거 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideBottomNav = /^\/messages\/\d+/.test(pathname)

  return <main className={hideBottomNav ? '' : 'pb-[70px]'}>{children}</main>
}
