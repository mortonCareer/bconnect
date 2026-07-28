import { experienceSchema } from '@/lib/experience-range'
import { addressField } from '@bconnect/config/address'
import { ProfileRole } from '@bconnect/api-client'
import { consentField } from '@bconnect/config/consent'
import { z } from 'zod'

export const MAX_TRADES = 3

export const profileSchema = z.object({
  fields: z
    .array(z.string())
    .min(1, '시공분야를 1개 이상 선택해주세요.')
    .max(MAX_TRADES, `시공분야는 최대 ${MAX_TRADES}개까지 선택 가능합니다.`),
  primaryField: z.string({ error: '대표분야를 선택해주세요.' }),
  experience: experienceSchema,
  role: z.enum(ProfileRole, { error: '유형을 선택해주세요.' }),
  address: addressField(),
  headline: z.string().max(20, '한줄소개는 최대 20글자까지 입력 가능합니다.').optional(),
  agreements: consentField,
})

export type ProfileFormData = z.infer<typeof profileSchema>
