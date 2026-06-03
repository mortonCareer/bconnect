'use client'

import { Suspense } from 'react'
import { GuestSidebar } from './_components/GuestSidebar'
import { LoginGateProvider } from './_components/LoginGateProvider'
import { MemberSidebar } from './_components/MemberSidebar'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'
import { useAuthStore } from '@/stores/auth-store'

function GuestSidebarWithCount() {
  const { totalCount } = useTechnicianItems()
  return <GuestSidebar memberCount={totalCount} />
}

export default function MainLayout({
  children,
  panel,
}: {
  children: React.ReactNode
  panel: React.ReactNode
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

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
        <main className="flex h-full min-w-0 flex-1 justify-center overflow-y-auto px-10 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-full max-w-269 flex-col">{children}</div>
        </main>
        {panel}
      </LoginGateProvider>
    </div>
  )
}
