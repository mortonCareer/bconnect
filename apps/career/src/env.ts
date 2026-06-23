import { z } from 'zod'
import { validateEnv, commonSchemas } from '@bconnect/config/env'

// NOTE: Firebase Cloud Messaging NEXT_PUBLIC_FIREBASE_* 는 이 스키마에서 제외.
// validateEnv() 를 거치면 클라이언트 번들에서 process.env 가 빈 객체가 되어 undefined 로 떨어지기 때문에,
// @bconnect/push (firebase.ts / request-push-permission.ts) 에서 `process.env.NEXT_PUBLIC_FIREBASE_*` 를 직접 참조해야 Next.js 빌드 타임 인라인이 적용됨 (소스 소비 패키지라 앱 빌드가 인라인).
const careerEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: commonSchemas.apiUrl,
})

export type CareerEnv = z.infer<typeof careerEnvSchema>

/**
 * 검증된 환경 변수
 * 애플리케이션 전체에서 타입 안전하게 사용 가능
 */
export const env = validateEnv(careerEnvSchema)
