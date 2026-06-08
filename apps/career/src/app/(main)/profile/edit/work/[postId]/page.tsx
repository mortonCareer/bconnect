/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7490
 */
'use client'

import {
  AddressSearchDrawer,
  cn,
  Form,
  FormControl,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  ImageField,
  Input,
  Label,
  TextareaField,
  TopBar,
  useScrollToError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  detail: z.string().optional(),
  trade: z
    .string()
    .min(1, '시공분야를 입력해주세요.')
    .register(fieldMeta, { label: '시공분야', placeholder: '시공분야를 입력해주세요' }),
  description: z
    .string()
    .min(1, '작업 설명을 입력해주세요.')
    .register(fieldMeta, { label: '작업 설명', placeholder: '작업 내용을 입력해주세요' }),
  images: z.custom<File>((value) => value instanceof File).nullable(),
})
type WorkFormValues = z.infer<typeof workSchema>

const META_FIELD_NAMES = ['company', 'period', 'trade'] as const

export default function EditWorkPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  // TODO: 초기 데이터 받아와서 폼 기본 값 채우기 (#197)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _postId = Number(params.postId)

  const [addressOpen, setAddressOpen] = useState(false)

  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    mode: 'onTouched',
    defaultValues: {
      company: '',
      period: '',
      address: '',
      detail: '',
      trade: '',
      description: '',
      images: null,
    },
  })

  const scrollToError = useScrollToError()
  const onSave = form.handleSubmit(() => {
    // TODO: Post + Task 수정 API 연동 (#197)
    router.back()
  }, scrollToError)

  const descriptionMeta = fieldMeta.get(workSchema.shape.description)
  const address = useWatch({ control: form.control, name: 'address' })

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

      <Form {...form}>
        <form onSubmit={onSave}>
          <div className="px-4 pt-4">
            <ImageField control={form.control} name="images" />
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-col gap-3 px-4 pt-6">
            {META_FIELD_NAMES.map((name) => {
              const meta = fieldMeta.get(workSchema.shape[name])
              return (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <FormItem className="flex items-start gap-2">
                      <FormLabel className="w-20 shrink-0 text-gray-900">{meta?.label}</FormLabel>
                      <div className="flex flex-1 flex-col gap-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={meta?.placeholder}
                            className={cn(
                              'h-auto rounded-none border-0 p-0 text-sm text-gray-700',
                              fieldState.error && 'ring-1 ring-destructive'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )
            })}
          </div>

          {/* 현장주소 */}
          <div className="flex items-start gap-2 px-4 pt-3">
            <Label htmlFor="work-address" className="w-20 shrink-0 text-gray-900">
              현장주소
            </Label>
            <div className="flex flex-1 flex-col gap-1">
              <button
                id="work-address"
                type="button"
                onClick={() => setAddressOpen(true)}
                data-invalid={form.formState.errors.address ? true : undefined}
                className="cursor-pointer text-left text-sm text-gray-700"
              >
                {address || <span className="text-gray-400">현장주소를 검색해주세요</span>}
              </button>
              <FormError error={form.formState.errors.address?.message} />
            </div>
          </div>
          <AddressSearchDrawer
            open={addressOpen}
            onOpenChange={setAddressOpen}
            onComplete={(result) =>
              form.setValue('address', result.roadAddress, { shouldValidate: true })
            }
          />

          {/* 상세주소 */}
          <div className="flex items-start gap-2 px-4 pt-3">
            <Label htmlFor="work-detail" className="w-20 shrink-0 text-gray-900">
              상세주소
            </Label>
            <div className="flex flex-1 flex-col gap-1">
              <Input
                id="work-detail"
                {...form.register('detail')}
                placeholder="상세주소를 입력해주세요 (동/호 등)"
                className="h-auto rounded-none border-0 p-0 text-sm text-gray-700"
              />
              <FormError error={form.formState.errors.detail?.message} />
            </div>
          </div>

          {/* 설명 */}
          <div className="px-4 pt-6">
            <TextareaField
              control={form.control}
              name="description"
              aria-label={descriptionMeta?.label}
              placeholder={descriptionMeta?.placeholder}
              className="min-h-50 rounded-none resize-none p-0 border-0 text-sm"
            />
          </div>
        </form>
      </Form>
    </div>
  )
}
