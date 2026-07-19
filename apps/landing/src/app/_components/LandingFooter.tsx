import Link from 'next/link'
import { SITE_URL } from '@bconnect/config/site'

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6">
        <span className="text-xl font-extrabold text-white">품앗이</span>
        <div className="flex items-center gap-5 text-sm text-gray-400">
          <Link href="/career" className="transition-colors hover:text-white">
            기술자용
          </Link>
          <a href="mailto:morton.career@gmail.com" className="transition-colors hover:text-white">
            문의사항
          </a>
          <a
            href={`${SITE_URL.plan}/terms`}
            className="font-semibold text-gray-200 transition-colors hover:text-white"
          >
            이용약관
          </a>
          <a
            href={`${SITE_URL.plan}/privacy`}
            className="font-semibold text-gray-200 transition-colors hover:text-white"
          >
            개인정보 처리방침
          </a>
          <span>© 2026 Morton. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
