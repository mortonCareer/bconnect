import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { sentryBuildOptions } from '@bconnect/config/sentry'

const nextConfig: NextConfig = {
  // Vercel monorepo: apps/career
  // TEMP: CI 캐시 측정용 트리거 — 이 PR 은 머지하지 않고 닫습니다
}

export default withSentryConfig(nextConfig, sentryBuildOptions('career'))
