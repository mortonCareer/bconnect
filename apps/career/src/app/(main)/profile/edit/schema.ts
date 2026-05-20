import { z } from 'zod'
import { Trade } from '@bconnect/api-client'

const tradeValues = Object.values(Trade) as [string, ...string[]]

export const profileEditSchema = z.object({
  // Member fields
  name: z.string().min(1, '이름을 입력해주세요').max(20, '이름은 20자 이내로 입력해주세요'),
  phone: z.string().optional(),

  // Profile fields
  primaryTrade: z.enum(tradeValues).optional(),
  trades: z.array(z.enum(tradeValues)).max(3, '시공분야는 최대 3개까지 선택 가능합니다').optional(),
  experience: z
    .number({ error: '경력을 입력해주세요' })
    .int('정수만 입력 가능합니다')
    .min(0, '경력은 0년 이상이어야 합니다')
    .max(50, '경력은 50년 이하로 입력해주세요'),
  headline: z.string().max(50, '한 줄 소개는 50자 이내로 입력해주세요').optional().nullable(),
  about: z.string().max(500, '소개는 500자 이내로 입력해주세요').optional().nullable(),
  city: z.string().max(20, '지역은 20자 이내로 입력해주세요').optional(),
})

export type ProfileEditFormData = z.infer<typeof profileEditSchema>
