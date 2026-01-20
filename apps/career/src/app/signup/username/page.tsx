'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@morton/ui'
import { useSignupStore } from '@/stores/signup-store'
import { usernameSchema, type UsernameFormData } from './schema'
import { SignupHeader, FormInput, FormError } from '../_components'

export default function SignupUsernamePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { formData, setUsername } = useSignupStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    mode: 'onChange',
    defaultValues: {
      username: formData.username,
    },
  })

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

  const error = errors.username?.message || serverError

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={2} onBack={() => router.back()} />

      {/* Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-6 px-4 pt-3">
        {/* Title Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
            서비스에서 사용할 ID를
            <br />
            입력해 주세요
          </h1>

          <p className="text-sm leading-[1.6] text-[#9C9C9C]">
            사용자 이름은 숫자, 영어, 밑줄 및 마침표만 포함할 수 있습니다.
            <br />한 번 설정되면 변경할 수 없습니다.
          </p>
          <FormError message={error} />

          {/* Username Input */}
          <FormInput
            type="text"
            placeholder="내용을 입력해주세요"
            error={!!error}
            {...register('username', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase()
              },
            })}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="full"
          disabled={!isValid}
          isLoading={isSubmitting}
          loadingText="확인 중..."
        >
          다음으로
        </Button>
      </form>
    </div>
  )
}
