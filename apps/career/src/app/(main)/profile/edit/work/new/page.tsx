/**
 * @figma-scaffold 기획 와이어(iGTu8r553...?node-id=1923-2226) 기준 UI 스캐폴드 — 독립 작업물 post.
 * 위치/업체/소요기간은 BE Post 계약에 필드가 없어 표시(입력)만 두고, 실제 게시 배선은 BE·기획 확정까지 홀드 (#769)
 */
'use client'

import { Form, FormSubmitButton, ImageField, TextField, TextareaField, TopBar } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// NOTE: 위치/업체/소요기간은 현재 CreatePostRequest({ taskId?, attachmentIds, content })에 대응 필드가 없다.
// BE Post 확장 또는 기획 확정 전까지 스캐폴드 입력만 두고 제출부에서 사용하지 않는다.
const scaffoldSchema = z.object({
  images: z
    .array(z.custom<File>((v) => v instanceof File))
    .min(1, '작업 사진을 1장 이상 첨부해주세요.'),
  content: z.string().min(1, '본문을 입력해주세요.'),
  location: z.string(),
  company: z.string(),
  durationDays: z.string(),
})
type ScaffoldValues = z.infer<typeof scaffoldSchema>

export default function NewWorkPage() {
  const router = useRouter()

  const form = useForm<ScaffoldValues>({
    resolver: zodResolver(scaffoldSchema),
    mode: 'onTouched',
    defaultValues: { images: [], content: '', location: '', company: '', durationDays: '' },
  })

  // TODO(#769): BE Post 계약(위치/업체/소요기간 필드) + 기획 확정 후 게시 배선.
  // 확정되면 presign 업로드(uploadPostImages) → useCreatePost 로 연결한다. 현재는 스캐폴드 stub.
  const onSubmit = form.handleSubmit(() => {
    // 홀드: 실제 게시 미배선.
  })

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="작업물 게시"
        showAction={false}
        onBack={() => router.back()}
      />

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="px-4 pt-4">
            <ImageField control={form.control} name="images" multiple maxFiles={10} />
          </div>

          {/* 본문 — 라벨 위, 텍스트 아래 (와이어 기준) */}
          <div className="flex flex-col gap-2 px-4 pt-6">
            <span className="text-sm font-semibold text-gray-900">본문</span>
            <TextareaField
              control={form.control}
              name="content"
              aria-label="본문"
              placeholder="자신이 시공한 내용을 입력해주세요"
              className="min-h-30 rounded-none resize-none p-0 border-0 text-sm"
            />
          </div>

          {/* 위치/업체/소요기간 — 스캐폴드 입력 (BE 필드 미존재, 제출 미배선) */}
          <div className="flex flex-col gap-3 px-4 pt-4">
            <TextField
              control={form.control}
              name="location"
              label="위치"
              layout="row"
              placeholder="위치를 입력해주세요"
            />
            <TextField
              control={form.control}
              name="company"
              label="업체"
              layout="row"
              placeholder="업체를 입력해주세요"
            />
            <TextField
              control={form.control}
              name="durationDays"
              label="소요 기간"
              layout="row"
              placeholder="예: 4일"
            />
          </div>

          <div className="px-4 pb-6 pt-8">
            <FormSubmitButton className="w-full" requireAllFilled={false}>
              등록하기
            </FormSubmitButton>
          </div>
        </form>
      </Form>
    </div>
  )
}
