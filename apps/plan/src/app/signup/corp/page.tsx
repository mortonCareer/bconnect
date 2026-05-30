/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15166
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@bconnect/ui'
import { ApiError, useRegisterMember, Role } from '@bconnect/api-client'
import { formatRegistrationNumber } from '@bconnect/config/biz-number'
import Image from 'next/image'
import { useSignupStore } from '@/stores/signup-store'
import { useAuthStore } from '@/stores/auth-store'
import { corpSchema, type CorpFormData } from './schema'
import { FormInput } from '@/components/FormInput'

export default function SignupCorpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { formData, setCorp, reset: resetSignup } = useSignupStore()
  const { login } = useAuthStore()
  const registerMemberMutation = useRegisterMember()

  // signupToken 없으면 로그인으로 리다이렉트
  useEffect(() => {
    if (!formData.signupToken) {
      router.replace('/login')
    } else if (!formData.username || !formData.name) {
      router.replace('/signup/member')
    }
  }, [formData.signupToken, formData.username, formData.name, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CorpFormData>({
    resolver: zodResolver(corpSchema),
    mode: 'onChange',
    defaultValues: {
      companyName: formData.companyName,
      bizNumber: formData.bizNumber,
    },
  })

  const onSubmit = async (data: CorpFormData) => {
    setServerError(null)

    try {
      setCorp({ companyName: data.companyName, bizNumber: data.bizNumber })

      const result = await registerMemberMutation.mutateAsync({
        data: {
          signupToken: formData.signupToken,
          username: formData.username,
          name: formData.name,
          role: Role.CONTRACTOR,
        },
      })

      login(result.accessToken)
      resetSignup()
      router.push('/')
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'A009':
            setServerError('유효하지 않은 가입 토큰입니다. 다시 로그인해주세요.')
            break
          case 'A010':
            setServerError('가입 토큰이 만료되었습니다. 다시 로그인해주세요.')
            break
          default:
            setServerError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
        }
      } else {
        setServerError('회원가입에 실패했습니다. 다시 시도해주세요.')
      }
    }
  }

  if (!formData.signupToken || !formData.username || !formData.name) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {/* Card */}
      <div className="flex w-[480px] flex-col items-center gap-8 rounded-[12px] border border-gray-300 p-10">
        {/* Logo */}
        <Image src="/logo.png" alt="품앗이" width={160} height={56} priority />

        {/* Subtitle */}
        <p className="text-r-16 text-gray-700">신뢰할 수 있는 인테리어 하도급 섭외 · 관리 서비스</p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-[400px] flex-col gap-3">
          {/* 업체명 */}
          <div className="flex flex-col gap-2">
            <p className="text-m-16 text-gray-900">업체명</p>
            <FormInput
              type="text"
              placeholder="모튼디자인"
              error={!!errors.companyName?.message}
              {...register('companyName')}
            />
            {errors.companyName?.message && (
              <p className="text-r-14 text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          {/* 사업자등록번호 */}
          <div className="flex flex-col gap-2">
            <p className="text-m-16 text-gray-900">사업자등록번호</p>
            <p className="text-r-14 text-gray-700">동일한 업장의 중복 가입을 방지해요</p>
            <FormInput
              type="text"
              placeholder="00000-00-000"
              error={!!errors.bizNumber?.message}
              {...register('bizNumber', {
                onChange: (e) => {
                  e.target.value = formatRegistrationNumber(e.target.value)
                },
              })}
            />
            {errors.bizNumber?.message && (
              <p className="text-r-14 text-destructive">{errors.bizNumber.message}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && <p className="text-r-14 text-destructive">{serverError}</p>}

          {/* CTA */}
          <Button
            type="submit"
            variant={isValid ? 'primary' : 'secondary'}
            size="full"
            disabled={!isValid}
            isLoading={isSubmitting || registerMemberMutation.isPending}
            loadingText="가입 중..."
          >
            가입 완료
          </Button>
        </form>
      </div>
    </div>
  )
}
