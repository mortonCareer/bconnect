import Link from 'next/link'
import { Button, Logo } from '@bconnect/ui'
import { SITE_URL } from '@bconnect/config/site'

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="품앗이 홈">
          <Logo className="h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/career"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            기술자용
          </Link>
          <Button asChild size="small">
            <a href={`${SITE_URL.plan}/login`}>시작하기</a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
