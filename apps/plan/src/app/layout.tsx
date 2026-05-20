import '@bconnect/ui/styles'
import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Plan',
  description: 'Bconnect Plan — 시공/하도급 인력 처음부터 끝까지',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 디자인 시스템 --font-sans = 'Pretendard Variable'. career 앱과 동일하게 CDN 로드 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
