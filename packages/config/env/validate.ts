import { z } from 'zod'

/**
 * 공통으로 사용되는 환경 변수 스키마들
 */
export const commonSchemas = {
  apiUrl: z.string().url({
    message: 'Must be a valid URL',
  }),
  nodeEnv: z.enum(['development', 'production', 'test']),
}

/**
 * 환경 변수 검증 함수
 *
 * 검증 시점: 서버 런타임 (next dev / next start)
 * 스킵 시점: 클라이언트, 빌드 타임, SKIP_ENV_VALIDATION=true
 */
export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  options?: {
    /**
     * Skip validation entirely (useful for Docker builds, CI, lint, etc.)
     * Defaults to true when npm_lifecycle_event is 'build' or SKIP_ENV_VALIDATION=true
     */
    skipValidation?: boolean
  }
): z.infer<z.ZodObject<T>> {
  // 클라이언트 사이드에서는 검증 스킵 (NEXT_PUBLIC_* 외 접근 불가)
  const isClient = typeof window !== 'undefined'
  // 빌드 타임에는 검증 스킵
  const isBuildTime = process.env.npm_lifecycle_event === 'build'

  const shouldSkip =
    options?.skipValidation === true ||
    isClient ||
    isBuildTime ||
    process.env.SKIP_ENV_VALIDATION === 'true'

  if (shouldSkip) {
    if (!isClient) {
      console.warn('⚠️  Environment variable validation skipped')
    }
    return process.env as unknown as z.infer<z.ZodObject<T>>
  }

  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/** MSW(API mocking) 활성 여부 — msw-provider(SW 등록 게이트)·proxy(인증 가드 우회) 공용 SSOT. */
export function isApiMockingEnabled(): boolean {
  return (
    (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') &&
    process.env.NEXT_PUBLIC_API_MOCKING !== 'disabled'
  )
}
