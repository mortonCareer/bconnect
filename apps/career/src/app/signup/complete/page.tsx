'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@morton/ui'
import { useAuthStore } from '@/stores/auth-store'

export default function SignupCompletePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const handleStart = () => {
    router.push('/')
  }

  // 사용자 이름 (없으면 기본값)
  const userName = user?.name || '회원'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Title */}
        <h1 className="text-center text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
          {userName}님,
          <br />
          회원가입이 완료되었어요
        </h1>

        {/* Check Icon */}
        <div className="mt-8 flex size-[100px] items-center justify-center rounded-full bg-[#386DFF]">
          <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 25L21.875 34.375L37.5 15.625"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-8 pt-4">
        <Button variant="primary" size="full" onClick={handleStart}>
          시작하기
        </Button>
      </div>
    </div>
  )
}
