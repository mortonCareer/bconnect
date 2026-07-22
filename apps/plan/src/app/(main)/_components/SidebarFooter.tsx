import { Logo } from '@bconnect/ui'
import Link from 'next/link'

export function SidebarFooter() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Logo width={70} height={24} />
      <p className="text-r-12 text-gray-500">무료 요금제</p>
      <div className="flex gap-3 text-r-12 text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">
          이용약관
        </Link>
        <Link href="/privacy" className="hover:text-gray-600">
          개인정보 처리방침
        </Link>
      </div>
    </div>
  )
}
