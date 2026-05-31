/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4394
 * @figma-state OTP대기 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4405
 * @figma-state OTP에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4420
 */
'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { useSendOtp, useVerifyOtp } from '@bconnect/api-client'
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  toE164,
  toNationalNumber,
} from '@bconnect/config/phone'
import { Button, Form, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { OtpTimer, SignupHeader } from '../_components'

type Step = 'phone' | 'otp'

const schema = z.object({
  phone: z.string().refine(isValidPhoneNumber, '유효하지 않은 전화번호입니다.'),
  code: z.string().regex(/^\d{6}$/, '인증번호 6자리를 입력해주세요.'),
})
type FormValues = z.infer<typeof schema>

export default function SignupAuthPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setSignupToken, setPhone: setSignupPhone } = useSignupStore()

  const [step, setStep] = useState<Step>('phone')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', code: '' },
    mode: 'onSubmit',
  })

  // 단계별 서버 에러 분리: 발송 실패는 phone, 검증 실패(A003)는 code 필드에 합성.
  // ADR-0015 — BE envelope message 를 그대로 표시 (코드별 분기 없음).
  const phoneServer = useServerError(form.control, passthroughError<FormValues>('phone'))
  const codeServer = useServerError(form.control, passthroughError<FormValues>('code'))

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()

  const phoneValue = useWatch({ control: form.control, name: 'phone' })
  const codeValue = useWatch({ control: form.control, name: 'code' })
  const isPhoneValid = isValidPhoneNumber(phoneValue ?? '')
  const isCodeValid = (codeValue ?? '').length === 6

  const sendCode = async () => {
    const phone = form.getValues('phone')
    setPhoneNumber(toE164(phone))
    try {
      const result = await sendCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone) },
      })
      if (result.expiresAt) {
        setCodeSent(result.expiresAt)
        setExpiresAt(result.expiresAt)
      }
      setStep('otp')
    } catch (err) {
      phoneServer.capture(err, form.getValues())
    }
  }

  const verifyCode = async () => {
    const { phone, code } = form.getValues()
    try {
      const result = await verifyCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone), code },
      })
      if ('accessToken' in result) {
        // 이미 가입된 회원 — 로그인 처리 후 홈으로 (member 정보는 useGetMyMember 로 별도 조회)
        login(result.accessToken)
        router.push('/')
      } else {
        // 신규 유저 — signupToken 저장 후 회원가입 진행
        setSignupPhone(toE164(phone))
        setSignupToken(result.signupToken)
        router.push('/signup/username')
      }
    } catch (err) {
      codeServer.capture(err, form.getValues())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'phone') {
      if (await form.trigger('phone')) await sendCode()
    } else {
      if (await form.trigger()) await verifyCode()
    }
  }

  const handleResend = async () => {
    form.setValue('code', '')
    codeServer.reset()
    await sendCode()
  }

  const hasCodeError = !!form.formState.errors.code || !!codeServer.fieldError('code')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={1} onBack={() => (step === 'otp' ? setStep('phone') : router.back())} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
              신뢰할 수 있는 계약을 위해 <span className="text-[#386DFF]">본인 확인</span>이
              필요해요
            </h1>
            <p className="text-sm leading-[1.6] text-[#9C9C9C]">
              공방터 서비스는 인증된 기술자만 이용하실 수 있어요.
            </p>

            {/* Phone Input */}
            <TextField
              control={form.control}
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="010-1234-5678"
              disabled={step === 'otp'}
              transform={formatPhoneNumber}
              serverError={phoneServer.fieldError('phone')}
            />
          </div>

          {/* OTP Section (step === 'otp') */}
          {step === 'otp' && (
            <div className="flex flex-col gap-2">
              <TextField
                control={form.control}
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="숫자 6자리"
                maxLength={6}
                transform={(raw) => raw.replace(/\D/g, '').slice(0, 6)}
                serverError={codeServer.fieldError('code')}
                rightElement={
                  <OtpTimer
                    expiresAt={expiresAt}
                    onResend={handleResend}
                    isResending={sendCodeMutation.isPending}
                  />
                }
              />
              {!hasCodeError && (
                <p className="text-sm leading-[1.6] text-[#9C9C9C]">
                  타인에게 인증번호를 공유하지 마세요.
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          {step === 'phone' ? (
            <Button
              type="submit"
              variant="outline"
              size="full"
              disabled={!isPhoneValid}
              isLoading={sendCodeMutation.isPending}
            >
              다음
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={!isCodeValid}
              isLoading={verifyCodeMutation.isPending}
            >
              다음으로
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}
