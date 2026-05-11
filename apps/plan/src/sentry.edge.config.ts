import * as Sentry from '@sentry/nextjs'
import { serverSentryOptions } from '@bconnect/config/sentry'

Sentry.init(serverSentryOptions)
