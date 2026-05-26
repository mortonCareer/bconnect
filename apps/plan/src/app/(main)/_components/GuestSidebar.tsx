import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@bconnect/ui'

interface GuestSidebarProps {
  memberCount: number
}

export function GuestSidebar({ memberCount }: GuestSidebarProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      {/* 안내 + CTA */}
      <div className="flex flex-col gap-5 px-5 py-10">
        <p className="text-r-14 text-bconnect-gray-700">
          검증된 프로필을 가진
          <br />
          {memberCount.toLocaleString()}명의 기술자를 만나보세요.
        </p>

        {/* 이동 동작 */}
        <div className="flex flex-col gap-2">
          <Button asChild variant="primary" size="full" className="h-[40px]">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline" size="full" className="h-[40px]">
            <Link href="/signup/member">회원가입</Link>
          </Button>
        </div>
      </div>

      {/* 푸터: 로고 + 무료 요금제 캡션 */}
      <div className="flex flex-col gap-3 p-5">
        <Image src="/logo.png" alt="품앗이" width={70} height={24} priority />
        <p className="text-r-12 text-bconnect-gray-500">무료 요금제</p>
      </div>
    </div>
  )
}
