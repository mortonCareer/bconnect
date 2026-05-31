import { isValidPhoneNumber } from '@bconnect/config/phone'
import { z } from 'zod'

export const authSchema = z.object({
  phone: z.string().refine(isValidPhoneNumber, '유효하지 않은 전화번호입니다.'),
  code: z.string().regex(/^\d{6}$/, '인증번호 6자리를 입력해주세요.'),
})

export type AuthFormData = z.infer<typeof authSchema>
