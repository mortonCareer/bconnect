'use client'

import { usePathname } from 'next/navigation'

/** BottomNav가 숨겨지는 경로에서는 padding-bottom 제거 + 전체 높이 고정 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullScreen = /^\/messages\/\d+/.test(pathname)

  return (
    <main className={isFullScreen ? 'flex h-dvh flex-col overflow-hidden' : 'pb-[70px]'}>
      {children}
    </main>
  )
}
