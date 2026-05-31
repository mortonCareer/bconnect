import { z } from 'zod'
import { usernameField } from '@bconnect/config/username'

export const usernameSchema = z.object({
  username: usernameField,
})

export type UsernameFormData = z.infer<typeof usernameSchema>
