const DSN =
  'https://1a5384ac1551a597142a14b44351d09e@o4510971670822912.ingest.us.sentry.io/4510971672330240'

/** 서버/엣지 런타임 공통 옵션 */
export const serverSentryOptions = {
  dsn: DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: true,
}

/** 클라이언트 런타임 공통 옵션 (NEXT_PUBLIC_* 환경변수 사용) */
export const clientSentryOptions = {
  dsn: DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: true,
}

/** next.config.ts용 withSentryConfig 옵션 */
export function sentryBuildOptions(project: string) {
  return {
    org: 'morton-2l',
    project,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  }
}
