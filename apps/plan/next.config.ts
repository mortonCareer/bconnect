import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { sentryBuildOptions } from '@bconnect/config/sentry'
import { noindexHeaders } from '@bconnect/config/seo'

const nextConfig: NextConfig = {
  headers: async () => noindexHeaders(),
}

export default withSentryConfig(nextConfig, sentryBuildOptions('plan'))
