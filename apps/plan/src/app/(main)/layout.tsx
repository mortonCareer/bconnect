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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-bconnect-gray-300">
        {isAuthenticated ? (
          <MemberSidebar />
        ) : (
          <Suspense fallback={<GuestSidebar memberCount={0} />}>
            <GuestSidebarWithCount />
          </Suspense>
        )}
      </aside>
      <main className="flex h-full flex-1 min-w-0 justify-center overflow-y-auto px-10 py-10">
        <div className="flex w-full max-w-[1076px] flex-col">
          <LoginGateProvider>{children}</LoginGateProvider>
        </div>
      </main>
    </div>
  )
}
