import { z } from 'zod'
import { validateEnv, commonSchemas } from '@bconnect/config/env'

const planEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: commonSchemas.apiUrl,
  NEXT_PUBLIC_API_MOCKING: commonSchemas.apiMocking,
  NEXT_PUBLIC_GA_ID: commonSchemas.gaId,
})

/**
 * 검증된 환경 변수
 * 애플리케이션 전체에서 타입 안전하게 사용 가능
 */
export const env = validateEnv(planEnvSchema)
