import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import '@bconnect/ui/styles'
import { Toaster } from '@bconnect/ui'
import { SERVICE_NAME, SITE_URL, BRAND_COLOR } from '@bconnect/config/site'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { env } from '@/env'

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
  viewportFit: 'cover',
  themeColor: BRAND_COLOR,
}

const description =
  '건설 현장의 업체와 기술자를 잇는 품앗이. 업체 소개, 기술자 소개, 사업자 원클릭 조회를 한곳에서.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL.landing),
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
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
        {env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  )
}
