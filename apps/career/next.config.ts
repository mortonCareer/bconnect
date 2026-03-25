import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { sentryBuildOptions } from '@morton/config/sentry'

const nextConfig: NextConfig = {
  // Vercel monorepo: apps/career
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    return {
      // fallback: Route Handler에서 처리 안 된 요청만 실제 BE로 프록시
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/api/v1/:path*`,
        },
      ],
    }
  },
  // Capacitor 빌드 시 static export 사용 (CAPACITOR_BUILD=1)
  ...(process.env.CAPACITOR_BUILD === '1' && {
    output: 'export',
  }),
}

export default withSentryConfig(nextConfig, sentryBuildOptions('career'))
