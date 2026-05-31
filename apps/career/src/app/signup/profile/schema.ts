import { z } from 'zod'

const experienceLevelSchema = z.enum(['newcomer', '1-3', '3-5', '5-10', '10+'])

export const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이내로 입력해주세요.'),
  fields: z
    .array(z.string())
    .min(1, '시공분야를 1개 이상 선택해주세요.')
    .max(3, '시공분야는 최대 3개까지 선택 가능합니다.'),
  primaryField: z.string(),
  experience: experienceLevelSchema,
  affiliation: z.string().optional(),
  role: z.string().optional(),
  address: z.string().optional(),
  headline: z.string().max(20, '한줄소개는 최대 20글자까지 입력 가능합니다.').optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
