import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://1a5384ac1551a597142a14b44351d09e@o4510971670822912.ingest.us.sentry.io/4510971672330240',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  enableLogs: true,
})
