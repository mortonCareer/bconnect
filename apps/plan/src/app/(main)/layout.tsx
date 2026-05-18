'use client'

import { Suspense } from 'react'
import { GuestSidebar } from './_components/GuestSidebar'
import { useTechnicianItems } from '@/hooks/useTechnicianItems'

function SidebarWithCount() {
  const { totalCount } = useTechnicianItems()
  return <GuestSidebar memberCount={totalCount} />
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-[270px] shrink-0 flex-col border-r border-bconnect-gray-300">
        <Suspense fallback={<GuestSidebar memberCount={0} />}>
          <SidebarWithCount />
        </Suspense>
      </aside>
      <main className="flex flex-1 min-w-0 justify-center px-10 py-10">
        <div className="flex w-full max-w-[1076px] flex-col">{children}</div>
      </main>
    </div>
  )
}
