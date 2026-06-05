import '@bconnect/ui/styles'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { SERVICE_NAME, SITE_URL } from '@bconnect/config/site'
import { Providers } from './providers'

const pretendard = localFont({
  src: '../../../../packages/ui/src/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  style: 'normal',
  variable: '--font-pretendard',
})

const description = '시공/하도급 인력 처음부터 끝까지'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL.plan),
  title: {
    default: SERVICE_NAME,
    template: `%s | ${SERVICE_NAME}`,
  },
  description,
  applicationName: SERVICE_NAME,
  openGraph: {
    type: 'website',
    siteName: SERVICE_NAME,
    title: SERVICE_NAME,
    description,
    url: '/',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: SERVICE_NAME,
    description,
  },
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
