import { Trade } from '@bconnect/api-client'
import type { Address } from '@bconnect/api-client'
import { z } from 'zod'

/**
 * 작업 생성 폼. 제목 1개 → taskTitle=eventTitle 양쪽 매핑(갭1).
 * request/memo 는 수집하되 API 필드 부재로 미전송(갭2).
 */
export const createTaskSchema = z
  .object({
    title: z.string().min(1, '제목을 입력해주세요.'),
    company: z.string().min(1, '업체명을 입력해주세요.'),
    start: z.string().min(1, '시작일을 선택해주세요.'),
    end: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.custom<Address>(
      (v) => v != null && typeof v === 'object',
      '현장주소를 입력해주세요.'
    ),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
    request: z.string(),
    memo: z.string(),
  })
  .refine((v) => v.start <= v.end, { message: '종료일은 시작일 이후여야 해요.', path: ['end'] })

export type CreateTaskValues = z.infer<typeof createTaskSchema>
