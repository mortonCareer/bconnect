'use client'

import { Suspense } from 'react'
import { GuestSidebar } from './_components/GuestSidebar'
import { LoginGateProvider } from './_components/LoginGateProvider'
import { MemberSidebar } from './_components/MemberSidebar'
import { PanelHost } from './_components/panel/PanelHost'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'
import { useAuthStore } from '@/stores/auth-store'
import { usePathname } from 'next/navigation'

function GuestSidebarWithCount() {
  const { totalCount } = useTechnicianItems()
  return <GuestSidebar memberCount={totalCount} />
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const flush = usePathname().startsWith('/projects/')

  return (
    <div className="flex h-screen overflow-hidden bg-white">
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
        <main
          className={`flex h-full min-w-0 flex-1 justify-start overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${flush ? '' : 'px-10 py-10'}`}
        >
          <div className={`flex w-full flex-col ${flush ? '' : 'max-w-269'}`}>{children}</div>
        </main>
        <Suspense>
          <PanelHost />
        </Suspense>
      </LoginGateProvider>
    </div>
  )
}
