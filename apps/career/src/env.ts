import { z } from 'zod'
import { validateEnv, commonSchemas } from '@morton/config/env'

const careerEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: commonSchemas.apiUrl,
})

export type CareerEnv = z.infer<typeof careerEnvSchema>

/**
 * 검증된 환경 변수
 * 애플리케이션 전체에서 타입 안전하게 사용 가능
 */
export const env = validateEnv(careerEnvSchema)
