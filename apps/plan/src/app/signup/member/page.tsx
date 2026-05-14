/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15140
 * @figma-state 에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15161
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@bconnect/ui'
import Image from 'next/image'
import { useSignupStore } from '@/stores/signup-store'
import { memberSchema, type MemberFormData } from './schema'
import { FormInput } from '@/components/FormInput'

export default function SignupMemberPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { formData, setMember } = useSignupStore()

  // signupToken 없으면 로그인으로 리다이렉트
  useEffect(() => {
    if (!formData.signupToken) {
      router.replace('/login')
    }
  }, [formData.signupToken, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    mode: 'onChange',
    defaultValues: {
      username: formData.username,
      name: formData.name,
    },
  })

  const onSubmit = async (data: MemberFormData) => {
    setServerError(null)

    try {
      // TODO: 사용자 ID 중복 확인 API 호출
      setMember({ username: data.username, name: data.name })
      router.push('/signup/corp')
    } catch {
      setServerError('이미 존재하는 사용자 이름입니다.')
    }
  }

  const usernameError = errors.username?.message || serverError

  if (!formData.signupToken) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {/* Card */}
      <div className="flex w-[480px] flex-col items-center gap-8 rounded-[12px] border border-bconnect-gray-300 p-10">
        {/* Logo */}
        <Image src="/logo.png" alt="품앗이" width={160} height={56} priority />

        {/* Subtitle */}
        <p className="text-r-16 text-bconnect-gray-700">
          신뢰할 수 있는 인테리어 하도급 섭외 · 관리 서비스
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-[400px] flex-col gap-3">
          {/* 사용자 ID */}
          <p className="text-m-16 text-bconnect-gray-900">사용자 ID</p>
          <p className="text-r-14 text-bconnect-gray-700">
            동일한 사용자를 구분하는데 활용되며, 한 번 설정하면 변경이 불가해요.
          </p>
          <FormInput
            type="text"
            placeholder="user_id"
            error={!!usernameError}
            {...register('username', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase()
              },
            })}
          />
          {usernameError && <p className="text-r-14 text-bconnect-error">{usernameError}</p>}

          {/* 이름 */}
          <p className="text-m-16 text-bconnect-gray-900">이름</p>
          <FormInput
            type="text"
            placeholder="홍길동"
            error={!!errors.name?.message}
            {...register('name')}
          />
          {errors.name?.message && (
            <p className="text-r-14 text-bconnect-error">{errors.name.message}</p>
          )}

          {/* CTA */}
          <Button
            type="submit"
            variant={isValid ? 'primary' : 'secondary'}
            size="full"
            disabled={!isValid}
            isLoading={isSubmitting}
            loadingText="확인 중..."
          >
            다음으로
          </Button>
        </form>
      </div>
    </div>
  )
}
