/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7490
 */
'use client'

import { cn, Form, FormError, Input, Label, TextareaField, TopBar } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const fieldMeta = z.registry<{ label: string; placeholder: string }>()

const workSchema = z.object({
  company: z
    .string()
    .min(1, '업체명을 입력해주세요.')
    .register(fieldMeta, { label: '업체명', placeholder: '업체명을 입력해주세요' }),
  period: z
    .string()
    .min(1, '시공기간을 입력해주세요.')
    .register(fieldMeta, { label: '시공기간', placeholder: '예: 12.25 ~ 12.26' }),
  address: z
    .string()
    .min(1, '현장주소를 입력해주세요.')
    .register(fieldMeta, { label: '현장주소', placeholder: '현장주소를 입력해주세요' }),
  trade: z
    .string()
    .min(1, '시공분야를 입력해주세요.')
    .register(fieldMeta, { label: '시공분야', placeholder: '시공분야를 입력해주세요' }),
  description: z
    .string()
    .min(1, '작업 설명을 입력해주세요.')
    .register(fieldMeta, { label: '작업 설명', placeholder: '작업 내용을 입력해주세요' }),
})
type WorkFormValues = z.infer<typeof workSchema>

const META_FIELD_NAMES = ['company', 'period', 'address', 'trade'] as const

export default function EditWorkPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  // TODO: 초기 데이터 받아와서 폼 기본 값 채우기 (#197)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _postId = Number(params.postId)

  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    mode: 'onTouched',
    defaultValues: { company: '', period: '', address: '', trade: '', description: '' },
  })

  const onSave = form.handleSubmit(() => {
    // TODO: Post + Task 수정 API 연동 (#197)
    router.back()
  })

  const descriptionMeta = fieldMeta.get(workSchema.shape.description)

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="작업물 수정"
        actionLabel="완료"
        onAction={onSave}
        showAction
        onBack={() => router.back()}
      />

      {/* TODO: 이미지 업로드 공통 컴포넌트로 교체 (#424) */}
      <div className="mx-4 mt-4 flex h-50 items-center justify-center rounded-lg bg-gray-100">
        <span className="text-r-12 text-gray-500">이미지</span>
      </div>

      <Form {...form}>
        <form onSubmit={onSave}>
          {/* 메타 정보 */}
          <div className="flex flex-col gap-3 px-4 pt-6">
            {META_FIELD_NAMES.map((name) => {
              const meta = fieldMeta.get(workSchema.shape[name])
              return (
                <div key={name} className="flex items-start gap-2">
                  <Label htmlFor={`work-${name}`} className="w-20 shrink-0 text-gray-900">
                    {meta?.label}
                  </Label>
                  <div className="flex flex-1 flex-col gap-1">
                    <Input
                      id={`work-${name}`}
                      {...form.register(name)}
                      placeholder={meta?.placeholder}
                      className={cn(
                        'h-auto rounded-none border-0 p-0 text-sm text-gray-700 focus:ring-0',
                        form.formState.errors[name] && 'ring-1 ring-destructive'
                      )}
                    />
                    <FormError error={form.formState.errors[name]?.message} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 설명 */}
          <div className="px-4 pt-6">
            <TextareaField
              control={form.control}
              name="description"
              aria-label={descriptionMeta?.label}
              placeholder={descriptionMeta?.placeholder}
              className="min-h-50 rounded-none resize-none p-0 border-0 text-sm focus:ring-0"
            />
          </div>
        </form>
      </Form>
    </div>
  )
}
