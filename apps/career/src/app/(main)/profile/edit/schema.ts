import { z } from 'zod'
import { Trade } from '@bconnect/api-client'
import { addressField } from '@bconnect/config/address'
import { experienceSchema } from '@/lib/experience-range'

const tradeValues = Object.values(Trade) as [string, ...string[]]

export const MAX_TRADES = 3

export const profileEditSchema = z.object({
  // Member fields
  phone: z.string().optional(),

  // Profile fields
  primaryTrade: z.enum(tradeValues).optional(),
  trades: z
    .array(z.enum(tradeValues))
    .min(1, '공종을 1개 이상 선택해주세요')
    .max(MAX_TRADES, `공종은 최대 ${MAX_TRADES}개까지 선택 가능합니다`),
  experience: experienceSchema,
  headline: z.string().max(50, '한 줄 소개는 50자 이내로 입력해주세요').optional().nullable(),
  about: z.string().max(500, '소개는 500자 이내로 입력해주세요').optional().nullable(),
  address: addressField(),
})

export type ProfileEditFormData = z.infer<typeof profileEditSchema>
