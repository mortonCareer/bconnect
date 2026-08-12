import { Suspense } from 'react'
import { BottomNavigation } from './_components/BottomNavigation'
import { MainContent } from './_components/MainContent'
import { NotificationPrompt } from '@bconnect/push'
import { RequireRole, UnreadTitlePrefix } from '@bconnect/features'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // min-h-screen(=100vh) 은 모바일에서 주소창이 보여도 주소창 숨김 기준 높이(lvh)로 잡혀
    // 채팅방(h-dvh) 아래에 빈 띠가 남는다. 실제 보이는 높이를 따라가도록 dvh 사용 (#1147).
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <UnreadTitlePrefix />
      <Suspense>
        <MainContent>
          <RequireRole allowed={['CAREER']} fallback="/signup/profile">
            {children}
          </RequireRole>
        </MainContent>
      </Suspense>
      <BottomNavigation />
      <NotificationPrompt />
    </div>
  )
}
