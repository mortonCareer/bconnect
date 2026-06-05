/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4388
 */
'use client'

import { useGetMyMember } from '@bconnect/api-client'
import { Button, CheckIcon } from '@bconnect/ui'
import Link from 'next/link'

export default function SignupCompletePage() {
  const { data: member } = useGetMyMember()

  const userName = member?.name || '회원'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Title */}
        <h1 className="text-center text-sb-24 text-[#1B1B1B]">
          {userName}님,
          <br />
          회원가입이 완료되었어요
        </h1>

        {/* Check Icon */}
        <div className="mt-8 flex size-25 items-center justify-center rounded-full bg-primary">
          <CheckIcon className="text-white" size={83} />
        </div>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-8 pt-4">
        <Button asChild variant="primary" size="full">
          <Link href="/">시작하기</Link>
        </Button>
      </div>
    </div>
  )
}
