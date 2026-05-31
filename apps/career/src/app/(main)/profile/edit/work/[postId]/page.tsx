/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7490
 */
'use client'

import { Form, TextField, TextareaField, TopBar } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const workSchema = z.object({
  company: z.string().min(1, '업체명을 입력해주세요.'),
  period: z.string().min(1, '시공기간을 입력해주세요.'),
  address: z.string().min(1, '현장주소를 입력해주세요.'),
  trade: z.string().min(1, '시공분야를 입력해주세요.'),
  description: z.string().min(1, '작업 설명을 입력해주세요.'),
})
type WorkFormValues = z.infer<typeof workSchema>

export default function EditWorkPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const _postId = Number(params.postId)

  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    mode: 'onChange',
    defaultValues: { company: '', period: '', address: '', trade: '', description: '' },
  })

  const handleSave = form.handleSubmit(() => {
    // TODO: Post + Task 수정 API 연동 (#197)
    router.back()
  })

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="작업물"
        actionLabel="저장"
        onAction={handleSave}
        showAction
        onBack={() => router.back()}
      />

      {/* 이미지 영역 */}
      <div className="mx-4 mt-4 flex h-[200px] items-center justify-center rounded-lg bg-gray-100">
        <span className="text-r-12 text-gray-500">이미지</span>
      </div>

      <Form {...form}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 px-4 pt-6">
          <TextField
            control={form.control}
            name="company"
            label="업체명"
            placeholder="업체명을 입력해주세요"
          />
          <TextField
            control={form.control}
            name="period"
            label="시공기간"
            placeholder="시공기간을 입력해주세요"
          />
          <TextField
            control={form.control}
            name="address"
            label="현장주소"
            placeholder="현장주소를 입력해주세요"
          />
          <TextField
            control={form.control}
            name="trade"
            label="시공분야"
            placeholder="시공분야를 입력해주세요"
          />
          <TextareaField
            control={form.control}
            name="description"
            label="설명"
            rows={6}
            placeholder="작업 내용을 입력해주세요"
          />
        </form>
      </Form>
    </div>
  )
}
