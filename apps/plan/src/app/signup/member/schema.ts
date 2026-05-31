import { z } from 'zod'

export const memberSchema = z.object({
  username: z
    .string()
    .min(3, '최소 3자 이상 입력해주세요.')
    .max(30, '최대 30자까지 입력 가능합니다.')
    .regex(/^[a-zA-Z0-9_.]+$/, '숫자, 영어, 밑줄 및 마침표만 사용할 수 있습니다.')
    .transform((val) => val.toLowerCase()),
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이내로 입력해주세요.'),
})

export type MemberFormData = z.infer<typeof memberSchema>
