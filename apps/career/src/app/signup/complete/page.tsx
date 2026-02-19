'use client'

import Link from 'next/link'
import { buttonVariants, CheckIcon } from '@morton/ui'
import { useAuthStore } from '@/stores/auth-store'

export default function SignupCompletePage() {
  const member = useAuthStore((state) => state.member)

  // 사용자 이름 (없으면 기본값)
  const userName = member?.name || '회원'

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
          <CheckIcon className="text-white" />
        </div>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-8 pt-4">
        <Link href="/" className={buttonVariants({ variant: 'primary', size: 'full' })}>
          시작하기
        </Link>
      </div>
    </div>
  )
}
