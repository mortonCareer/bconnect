import { z } from 'zod'
import { validateEnv, commonSchemas } from '@bconnect/config/env'

const landingEnvSchema = z.object({
  NEXT_PUBLIC_GA_ID: commonSchemas.gaId,
})

export type LandingEnv = z.infer<typeof landingEnvSchema>

export const env = validateEnv(landingEnvSchema)
