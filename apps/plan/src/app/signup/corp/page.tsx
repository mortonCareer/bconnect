/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15166
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AgreementField,
  FormSubmitButton,
  Form,
  FormError,
  Logo,
  TextField,
  passthroughError,
  toast,
  useServerError,
} from '@bconnect/ui'
import {
  ERROR_CODE,
  hasErrorCode,
  isRegisterMemberSignupSessionError,
  hasAuthHint,
  refreshAccessToken,
  useCreateMember,
  useCreateCompany,
  requireRegisterAccessToken,
} from '@bconnect/api-client'
import { formatRegistrationNumber } from '@bconnect/config/biz-number'
import { CONSENT_DEFAULT, CONSENT_ITEMS } from '@bconnect/config/consent'
import { BIRTH_PLACEHOLDER } from '@bconnect/config/signup'
import { login } from '@bconnect/features'
import { useSignupStore } from '@/stores/signup-store'
import { corpSchema, type CorpFormData } from './schema'

export default function SignupCorpPage() {
  const router = useRouter()
  const { formData, setCorp, reset: resetSignup, setRegisterError } = useSignupStore()
  const registerMemberMutation = useCreateMember({
    request: { headers: { 'X-Signup-Token': formData.signupToken } },
  })
  const createCompanyMutation = useCreateCompany()
  const [issuedAccessToken, setIssuedAccessToken] = useState<string | null>(null)

  const form = useForm<CorpFormData>({
    resolver: zodResolver(corpSchema),
    mode: 'onTouched',
    defaultValues: {
      companyName: formData.companyName,
      bizNumber: formData.bizNumber,
      agreements: CONSENT_DEFAULT,
    },
  })
  const { control, handleSubmit } = form

  const server = useServerError(
    control,
    passthroughError<CorpFormData>(undefined, '회원가입에 실패했습니다. 다시 시도해주세요.')
  )

  const onSubmit = async (data: CorpFormData) => {
    setCorp({ companyName: data.companyName, bizNumber: data.bizNumber })
    try {
      // register 는 signupToken(X-Signup-Token 헤더)을 소비 — 회사 생성 실패 후 재시도 시
      // 재호출하지 않도록 발급된 accessToken을 보관한다.
      // 로그인 상태로 이 화면에 온 경우(RequireRole 이 보냄)는 회원이 이미 있으므로 register 를 건너뛴다.
      // 판정 소스는 게이트와 같은 표시 쿠키 — 동기 읽기라 제출 시점에 판정이 밀리지 않는다.
      if (!hasAuthHint()) {
        let accessToken: string
        try {
          accessToken =
            issuedAccessToken ??
            requireRegisterAccessToken(
              await registerMemberMutation.mutateAsync({
                data: {
                  // TODO(#1177): 생년월일 입력 화면이 생기면 폼 입력으로 교체
                  birth: BIRTH_PLACEHOLDER,
                  username: formData.username,
                  name: formData.name,
                },
              })
            )
        } catch (err) {
          // 토큰 소진·만료, 그리고 이미 가입된 번호 — 모두 가입 화면에서는 풀 수 없다.
          // 인증부터 다시 하면 토큰 재발급 또는 기존 계정 로그인으로 이어진다.
          if (
            isRegisterMemberSignupSessionError(err) ||
            hasErrorCode(err, ERROR_CODE.MEMBER.DUPLICATE_PHONE)
          ) {
            toast({ description: err.message, variant: 'error' })
            resetSignup()
            router.replace('/login')
            return
          }
          // 사용자명 중복은 이 화면에 입력칸이 없다 — 안내와 함께 입력 단계로 되돌린다.
          if (hasErrorCode(err, ERROR_CODE.MEMBER.DUPLICATE_USERNAME)) {
            setRegisterError(err.message)
            router.replace('/signup/member')
            return
          }
          throw err
        }

        if (!issuedAccessToken) {
          setIssuedAccessToken(accessToken)
        }

        login(accessToken)
      }
      await createCompanyMutation.mutateAsync({
        data: { name: data.companyName, brn: data.bizNumber },
      })
      await refreshAccessToken()

      resetSignup()
      router.push('/')
    } catch (err) {
      // capture 는 라이브 폼 값(getValues)으로 스냅샷 — data 는 zod transform(bizNumber digit화)을
      // 거쳐 useWatch 가 보는 표시값과 달라, 넘기면 staleness 판정이 에러를 즉시 숨긴다.
      server.capture(err, form.getValues())
    }
  }

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
            <FormSubmitButton size="full">가입 완료</FormSubmitButton>
          </form>
        </Form>
      </div>
    </div>
  )
}
