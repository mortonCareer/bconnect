/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15166
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AgreementField,
  Button,
  Form,
  FormError,
  Logo,
  TextField,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { Role, useCreateMember } from '@bconnect/api-client'
import type { RegisterMemberResponse } from '@bconnect/api-client'
import { formatRegistrationNumber } from '@bconnect/config/biz-number'
import { CONSENT_DEFAULT, CONSENT_ITEMS } from '@bconnect/config/consent'
import { useSignupStore } from '@/stores/signup-store'
import { useAuthStore } from '@/stores/auth-store'
import { corpSchema, type CorpFormData } from './schema'

function requireRegisterAccessToken(result: RegisterMemberResponse) {
  // TODO: BE required 처리 후 type narrowing 필요.
  // RegisterMemberResponse.accessToken은 세션 필수값인데 optional emit이다.
  if (!result.accessToken) {
    throw new Error('회원가입 세션 토큰이 응답에 없습니다.')
  }

  return result.accessToken
}

export default function SignupCorpPage() {
  const router = useRouter()
  const { formData, setCorp, reset: resetSignup } = useSignupStore()
  const { login, isAuthenticated } = useAuthStore()
  const registerMemberMutation = useCreateMember({
    request: { headers: { 'X-Signup-Token': formData.signupToken } },
  })

  // signupToken 없으면 로그인으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) return
    if (!formData.signupToken) {
      router.replace('/login')
    } else if (!formData.username || !formData.name) {
      router.replace('/signup/member')
    }
  }, [isAuthenticated, formData.signupToken, formData.username, formData.name, router])

  const form = useForm<CorpFormData>({
    resolver: zodResolver(corpSchema),
    mode: 'onTouched',
    defaultValues: {
      companyName: formData.companyName,
      bizNumber: formData.bizNumber,
      agreements: CONSENT_DEFAULT,
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
          username: formData.username,
          name: formData.name,
          // BE auth Role은 GUEST/USER/ADMIN만 가진다.
          // 업체 유형은 별도 회사/프로필 도메인에서 다룬다.
          role: Role.USER,
        },
      })
      login(requireRegisterAccessToken(result))
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
      <div className="flex w-120 flex-col items-center gap-8 rounded-xl border border-gray-300 p-10">
        {/* Logo */}
        <Logo width={160} height={56} />

        {/* Subtitle */}
        <p className="text-r-16 text-gray-700">신뢰할 수 있는 인테리어 하도급 섭외 · 관리 서비스</p>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex w-100 flex-col gap-3">
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

            {/* 약관·개인정보 동의 (#733) */}
            <AgreementField control={control} name="agreements" items={CONSENT_ITEMS} />

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
