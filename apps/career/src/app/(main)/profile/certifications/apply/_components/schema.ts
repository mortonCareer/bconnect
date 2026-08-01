import { z } from 'zod'
import type { FileValue } from '@bconnect/ui'

export const credentialSchema = z.object({
  file: z.custom<FileValue | null>().refine((v) => v != null, '증빙 파일을 첨부해주세요.'),
  note: z.string(),
})

export type CredentialFormInput = z.input<typeof credentialSchema>
export type CredentialFormValues = z.output<typeof credentialSchema>
