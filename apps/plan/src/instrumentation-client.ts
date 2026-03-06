import * as Sentry from '@sentry/nextjs'
import { clientSentryOptions } from '@morton/config/sentry'

Sentry.init({
  ...clientSentryOptions,

  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
