/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4289
 * @figma-state 에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4273
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, TextField } from '@bconnect/ui'
import { useSignupStore } from '@/stores/signup-store'
import { usernameSchema, type UsernameFormData } from './schema'
import { SignupHeader } from '../_components'

export default function SignupUsernamePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { formData, setUsername } = useSignupStore()

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    mode: 'onChange',
    defaultValues: {
      username: formData.username,
    },
  })
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form

  const onSubmit = async (data: UsernameFormData) => {
    setServerError(null)

    try {
      // TODO: API 호출로 사용자 이름 중복 확인
      setUsername(data.username)
      router.push('/signup/profile')
    } catch {
      setServerError('이미 존재하는 사용자 이름입니다.')
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
            <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
              서비스에서 사용할 ID를
              <br />
              입력해 주세요
            </h1>

            {/* Username Input */}
            <TextField
              control={control}
              name="username"
              type="text"
              description="사용자 이름은 숫자, 영어, 밑줄 및 마침표만 포함할 수 있습니다. 한 번 설정되면 변경할 수 없습니다."
              placeholder="내용을 입력해주세요"
              transform={(raw) => raw.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase()}
              serverError={serverError ?? undefined}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="full"
            disabled={!isValid}
            isLoading={isSubmitting}
          >
            다음으로
          </Button>
        </form>
      </Form>
    </div>
  )
}
