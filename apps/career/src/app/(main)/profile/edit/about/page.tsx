/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7050
 */
'use client'

import {
  getGetMyProfileQueryKey,
  useGetMyProfile,
  useQueryClient,
  useUpdateMyProfileAbout,
  type UpdateProfileAboutRequest,
} from '@bconnect/api-client'
import { Form, TextareaField, TopBar, passthroughError, useServerError } from '@bconnect/ui'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type AboutFormValues = { about: NonNullable<UpdateProfileAboutRequest['about']> }

export default function EditAboutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: profile } = useGetMyProfile()

  const form = useForm<AboutFormValues>({
    mode: 'onTouched',
    values: { about: profile?.about ?? '' },
  })

  const server = useServerError(form.control, passthroughError<AboutFormValues>('about'))

  const { mutate: updateAbout, isPending } = useUpdateMyProfileAbout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() })
        router.back()
      },
      onError: (err) => server.capture(err, form.getValues()),
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    updateAbout({ data: { about: data.about } })
  })

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        variant="default"
        title="소개"
        actionLabel={isPending ? '저장 중...' : '완료'}
        onAction={onSubmit}
        onBack={() => router.back()}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-4">
          <TextareaField
            control={form.control}
            name="about"
            placeholder="자기소개를 작성해주세요..."
            className="min-h-100 rounded-none border-0 px-0"
            serverError={server.fieldError('about')}
            disabled={isPending}
          />
        </form>
      </Form>
    </div>
  )
}
