import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://1a5384ac1551a597142a14b44351d09e@o4510971670822912.ingest.us.sentry.io/4510971672330240',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  enableLogs: true,

  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
