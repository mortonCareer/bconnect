import { Suspense } from 'react'
import { BottomNavigation } from './_components/BottomNavigation'
import { MainContent } from './_components/MainContent'
import { CareerRoleGate } from '@/components/CareerRoleGate'
import { NotificationPrompt } from '@bconnect/push'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-sm bg-white">
      <Suspense>
        <MainContent>
          <Suspense>
            <CareerRoleGate>{children}</CareerRoleGate>
          </Suspense>
        </MainContent>
      </Suspense>
      <BottomNavigation />
      <NotificationPrompt />
    </div>
  )
}
