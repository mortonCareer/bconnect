import { z } from 'zod'
import { birthField } from '@bconnect/config/signup'
import { usernameField } from '@bconnect/config/username'

export const memberSchema = z.object({
  username: usernameField,
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이내로 입력해주세요.'),
  birth: birthField,
})

export type MemberFormData = z.infer<typeof memberSchema>
