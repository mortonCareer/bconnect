import { Suspense } from 'react'
import { BottomNavigation } from './_components/BottomNavigation'
import { MainContent } from './_components/MainContent'
import { NotificationPrompt } from '@/components/notification-prompt'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-sm bg-white">
      <NotificationPrompt />
      <Suspense>
        <MainContent>{children}</MainContent>
      </Suspense>
      <BottomNavigation />
    </div>
  )
}
