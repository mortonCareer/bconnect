'use client'

import { Suspense } from 'react'
import { GuestSidebar } from './_components/GuestSidebar'
import { LoginGateProvider } from './_components/LoginGateProvider'
import { MemberSidebar } from './_components/MemberSidebar'
import { PanelHost } from './_components/panel/PanelHost'
import { NotificationPromptToast } from '@bconnect/push'
import { UnreadTitlePrefix } from '@bconnect/features'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'
import { useAuthStore } from '@/stores/auth-store'

function GuestSidebarWithCount() {
  // '검증된 프로필' 카피라 가입 회원 수만 — 크롤링(미검증) 프로필은 제외
  const { memberCount } = useTechnicianItems()
  return <GuestSidebar memberCount={memberCount} />
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <UnreadTitlePrefix />
      <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-gray-300">
        {isAuthenticated ? (
          <MemberSidebar />
        ) : (
          <Suspense fallback={<GuestSidebar memberCount={0} />}>
            <GuestSidebarWithCount />
          </Suspense>
        )}
      </aside>
      <LoginGateProvider>
        <main className="flex h-full min-w-0 flex-1 justify-start overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-h-full w-full flex-col">{children}</div>
        </main>
        <Suspense>
          <PanelHost />
        </Suspense>
      </LoginGateProvider>
      <NotificationPromptToast />
    </div>
  )
}
