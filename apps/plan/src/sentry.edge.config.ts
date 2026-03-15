import * as Sentry from '@sentry/nextjs'
import { serverSentryOptions } from '@morton/config/sentry'

Sentry.init(serverSentryOptions)
