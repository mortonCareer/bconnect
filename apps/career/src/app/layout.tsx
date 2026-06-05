import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import '@bconnect/ui/styles'
import { SERVICE_NAME, SITE_URL, BRAND_COLOR } from '@bconnect/config/site'
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
  themeColor: BRAND_COLOR,
}

const description =
  '기술자(조공, 준조공, 기공)가 작업물을 업로드 하고 일감을 받을 수 있는 서비스입니다.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL.career),
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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
