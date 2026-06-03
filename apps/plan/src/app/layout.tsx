import '@bconnect/ui/styles'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Providers } from './providers'

const pretendard = localFont({
  src: '../../../../packages/ui/src/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  style: 'normal',
  variable: '--font-pretendard',
})

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
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
