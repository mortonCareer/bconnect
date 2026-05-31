import { Role } from '@bconnect/api-client'
import { z } from 'zod'

export const MAX_TRADES = 3

const experienceLevelSchema = z.enum(['newcomer', '1-3', '3-5', '5-10', '10+'])

export const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이내로 입력해주세요.'),
  fields: z
    .array(z.string())
    .min(1, '시공분야를 1개 이상 선택해주세요.')
    .max(MAX_TRADES, `시공분야는 최대 ${MAX_TRADES}개까지 선택 가능합니다.`),
  primaryField: z.string(),
  experience: experienceLevelSchema,
  affiliation: z.string().min(1, '소속을 입력해주세요.'),
  role: z.enum(Role, { error: '유형을 선택해주세요.' }),
  address: z.string().optional(),
  headline: z.string().max(20, '한줄소개는 최대 20글자까지 입력 가능합니다.').optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
