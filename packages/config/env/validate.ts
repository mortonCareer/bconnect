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
 * 환경 변수 검증 헬퍼 함수
 * 프로세스 시작 시 호출하여 환경 변수를 검증합니다
 *
 * @param schema - zod 스키마 객체
 * @param options - 검증 옵션
 * @throws {Error} 환경 변수가 유효하지 않을 경우
 * @returns 검증되고 타입이 지정된 환경 변수 객체
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { validateEnv, commonSchemas } from '@morton/config/env'
 *
 * const envSchema = z.object({
 *   NEXT_PUBLIC_API_URL: commonSchemas.apiUrl,
 *   NEXT_PUBLIC_FEATURE_FLAG: z.string().optional(),
 * })
 *
 * // 기본 사용 (SKIP_ENV_VALIDATION 환경 변수로 제어 가능)
 * export const env = validateEnv(envSchema)
 *
 * // 명시적으로 skip
 * export const env = validateEnv(envSchema, {
 *   skipValidation: process.env.npm_lifecycle_event === 'lint'
 * })
 * ```
 */
export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  options?: {
    /**
     * Skip validation entirely (useful for Docker builds, CI, lint, etc.)
     * Defaults to true when SKIP_ENV_VALIDATION=true is set
     */
    skipValidation?: boolean
  }
): z.infer<z.ZodObject<T>> {
  // SKIP_ENV_VALIDATION 환경 변수로 전역 제어 가능 (T3 Env 패턴)
  const shouldSkip = options?.skipValidation ?? !!process.env.SKIP_ENV_VALIDATION

  if (shouldSkip) {
    console.warn('⚠️  Environment variable validation skipped')
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
