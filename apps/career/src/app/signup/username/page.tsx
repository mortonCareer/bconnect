/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4289
 * @figma-state 에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4273
 */
'use client'

import { useSignupStore } from '@/stores/signup-store'
import { checkUsername } from '@bconnect/api-client'
import { formatUsername } from '@bconnect/config/username'
import { Form, FormSubmitButton, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { SignupHeader } from '../_components/SignupHeader'
import { usernameSchema, type UsernameFormData } from './schema'

export default function SignupUsernamePage() {
  const router = useRouter()
  const { formData, setUsername } = useSignupStore()

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    mode: 'onTouched',
    defaultValues: {
      username: formData.username,
    },
  })
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const server = useServerError(control, passthroughError<UsernameFormData>('username'))

  const onSubmit = async (data: UsernameFormData) => {
    try {
      const { available } = await checkUsername({ username: data.username })
      if (!available) {
        form.setError('username', { message: '이미 존재하는 사용자 이름입니다.' })
        return
      }
      setUsername(data.username)
      router.push('/signup/profile')
    } catch (err) {
      server.capture(err, data)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={2} onBack={() => router.back()} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-black">
              서비스에서 사용할 ID를
              <br />
              입력해 주세요
            </h1>

            {/* Username Input */}
            <TextField
              control={control}
              name="username"
              type="text"
              autoComplete="username"
              description="ID는 프로필과 검색에 활용되며, 한 번 설정하면 변경이 불가해요."
              placeholder="내용을 입력해주세요"
              transform={formatUsername}
              serverError={server.fieldError('username')}
            />
          </div>

          {/* Submit Button */}
          <FormSubmitButton size="full" isLoading={isSubmitting}>
            다음으로
          </FormSubmitButton>
        </form>
      </Form>
    </div>
  )
}
