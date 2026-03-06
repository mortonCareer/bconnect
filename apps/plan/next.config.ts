import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig, {
  org: 'morton-2l',
  project: 'career',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
