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
import { Button, Form, TextareaField, TopBar, passthroughError, useServerError } from '@bconnect/ui'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type AboutFormValues = { about: NonNullable<UpdateProfileAboutRequest['about']> }

export default function EditAboutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: profile } = useGetMyProfile({ query: { retry: false } })

  const form = useForm<AboutFormValues>({ values: { about: profile?.about ?? '' } })

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
      <TopBar variant="default" title="소개" showAction={false} onBack={() => router.back()} />

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-4">
          <TextareaField
            control={form.control}
            name="about"
            placeholder="자기소개를 작성해주세요..."
            className="min-h-100"
            serverError={server.fieldError('about')}
            disabled={isPending}
          />

          {/* 소개는 필수가 아니기에 FormSubmitButton 미사용 */}
          <Button type="submit" variant="primary" size="full" isLoading={isPending}>
            저장
          </Button>
        </form>
      </Form>
    </div>
  )
}
