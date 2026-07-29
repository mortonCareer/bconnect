import { Suspense } from 'react'
import { BottomNavigation } from './_components/BottomNavigation'
import { MainContent } from './_components/MainContent'
import { NotificationPrompt } from '@bconnect/push'
import { RoleGate } from './_components/RoleGate'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate>
      <div className="mx-auto min-h-screen max-w-screen-sm bg-white">
        <Suspense>
          <MainContent>{children}</MainContent>
        </Suspense>
        <BottomNavigation />
        <NotificationPrompt />
      </div>
    </RoleGate>
  )
}
