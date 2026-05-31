/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15166
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, FormError, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { useRegisterMember, Role } from '@bconnect/api-client'
import { formatRegistrationNumber } from '@bconnect/config/biz-number'
import Image from 'next/image'
import { useSignupStore } from '@/stores/signup-store'
import { useAuthStore } from '@/stores/auth-store'
import { corpSchema, type CorpFormData } from './schema'

export default function SignupCorpPage() {
  const router = useRouter()
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

  const form = useForm<CorpFormData>({
    resolver: zodResolver(corpSchema),
    mode: 'onTouched',
    defaultValues: {
      companyName: formData.companyName,
      bizNumber: formData.bizNumber,
    },
  })
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form

  const server = useServerError(
    control,
    passthroughError<CorpFormData>(undefined, '회원가입에 실패했습니다. 다시 시도해주세요.')
  )

  const onSubmit = async (data: CorpFormData) => {
    setCorp({ companyName: data.companyName, bizNumber: data.bizNumber })
    try {
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
    } catch (err) {
      server.capture(err, data)
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
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex w-[400px] flex-col gap-3">
            <TextField
              control={control}
              name="companyName"
              type="text"
              label="업체명"
              placeholder="모튼디자인"
            />

            <TextField
              control={control}
              name="bizNumber"
              type="text"
              label="사업자등록번호"
              description="동일한 업장의 중복 가입을 방지해요"
              placeholder="00000-00-000"
              transform={formatRegistrationNumber}
            />

            {/* Server Error (폼 전역) */}
            <FormError error={server.formError} />

            {/* CTA */}
            <Button
              type="submit"
              variant={isValid ? 'primary' : 'secondary'}
              size="full"
              disabled={!isValid}
              isLoading={isSubmitting || registerMemberMutation.isPending}
            >
              가입 완료
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
