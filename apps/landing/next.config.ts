import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { sentryBuildOptions } from '@bconnect/config/sentry'

const nextConfig: NextConfig = {
  // Vercel monorepo: apps/landing
}

export default withSentryConfig(nextConfig, sentryBuildOptions('landing'))
