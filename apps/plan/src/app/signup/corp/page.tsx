/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15166
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormError,
  Logo,
  TextField,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { Role, useCreateMember, useCreateCompany } from '@bconnect/api-client'
import type { RegisterMemberResponse } from '@bconnect/api-client'
import { formatRegistrationNumber } from '@bconnect/config/biz-number'
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
  const createCompanyMutation = useCreateCompany()
  const [issuedAccessToken, setIssuedAccessToken] = useState<string | null>(null)

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
      // register 는 signupToken(X-Signup-Token 헤더)을 소비 — 회사 생성 실패 후 재시도 시
      // 재호출하지 않도록 발급된 accessToken을 보관한다.
      // 회원 가입 유형은 auth 레벨 Role.USER 고정 (업체 유형은 별도 회사 도메인에서 다룸).
      const accessToken =
        issuedAccessToken ??
        requireRegisterAccessToken(
          await registerMemberMutation.mutateAsync({
            data: {
              username: formData.username,
              name: formData.name,
              role: Role.USER,
            },
          })
        )

      if (!issuedAccessToken) {
        setIssuedAccessToken(accessToken)
      }

      login(accessToken)
      await createCompanyMutation.mutateAsync({
        data: { name: data.companyName, brn: data.bizNumber },
      })

      resetSignup()
      router.push('/')
    } catch (err) {
      // capture 는 라이브 폼 값(getValues)으로 스냅샷 — data 는 zod transform(bizNumber digit화)을
      // 거쳐 useWatch 가 보는 표시값과 달라, 넘기면 staleness 판정이 에러를 즉시 숨긴다.
      server.capture(err, form.getValues())
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

            {/* Server Error (폼 전역) */}
            <FormError error={server.formError} />

            {/* CTA */}
            <Button
              type="submit"
              variant={isValid ? 'primary' : 'secondary'}
              size="full"
              disabled={!isValid}
              isLoading={
                isSubmitting || registerMemberMutation.isPending || createCompanyMutation.isPending
              }
            >
              가입 완료
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
