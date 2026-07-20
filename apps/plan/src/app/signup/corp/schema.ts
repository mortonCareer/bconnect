import { z } from 'zod'
import { extractDigits, isValidRegistrationNumber } from '@bconnect/config/biz-number'
import { consentField } from '@bconnect/config/consent'

export const corpSchema = z.object({
  companyName: z
    .string()
    .min(1, '업체명을 입력해주세요.')
    .max(100, '업체명은 100자 이내로 입력해주세요.'),
  bizNumber: z.string().transform(extractDigits).refine(isValidRegistrationNumber, {
    message: '존재하지 않는 사업자등록번호입니다.',
  }),
  agreements: consentField,
})

export type CorpFormData = z.infer<typeof corpSchema>
