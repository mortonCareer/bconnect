import { z } from 'zod'
import { usernameField } from '@bconnect/config/username'

export const usernameSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이내로 입력해주세요.'),
  username: usernameField,
})

export type UsernameFormData = z.infer<typeof usernameSchema>
