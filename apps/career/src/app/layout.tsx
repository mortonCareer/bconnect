import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import '@bconnect/ui/styles'
import { Providers } from './providers'

const pretendard = localFont({
  src: '../../../../packages/ui/src/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  style: 'normal',
  variable: '--font-pretendard',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Career',
  description:
    '기술자(조공, 준조공, 기공)가 작업물을 업로드 하고 일감을 받을 수 있는 서비스입니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
