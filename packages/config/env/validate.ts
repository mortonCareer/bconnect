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
 * export const env = validateEnv(envSchema)
 * ```
 */
export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  // Next.js 빌드 타임(SSG) 중에는 환경 변수 검증 스킵
  // 빌드는 process.env.NEXT_PHASE가 설정되어 있거나
  // 브라우저 환경이 아닌 곳에서 실행됨
  const isBuildTime =
    typeof window === 'undefined' &&
    (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production')

  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    if (isBuildTime) {
      // 빌드 타임에는 경고만 출력하고 빈 객체 반환
      console.warn('⚠️  Environment variables not set during build time')
      return {} as unknown as z.infer<z.ZodObject<T>>
    }

    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}
