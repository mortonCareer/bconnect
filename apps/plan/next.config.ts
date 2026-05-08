import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { sentryBuildOptions } from '@bconnect/config/sentry'

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig, sentryBuildOptions('plan'))
