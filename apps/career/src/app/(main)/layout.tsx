import { Suspense } from 'react'
import { BottomNav } from './_components/BottomNav'
import { MainContent } from './_components/MainContent'
import { NotificationPrompt } from '@/components/notification-prompt'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-sm bg-white">
      <NotificationPrompt />
      <Suspense>
        <MainContent>{children}</MainContent>
      </Suspense>
      <BottomNav />
    </div>
  )
}
