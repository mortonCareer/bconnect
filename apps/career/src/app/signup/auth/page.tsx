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
import { Form, FormSubmitButton, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { OtpTimer } from '../_components/OtpTimer'
import { SignupHeader } from '../_components/SignupHeader'
import { authSchema, type AuthFormData } from './schema'

type Step = 'phone' | 'otp'

export default function SignupAuthPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setSignupToken, setPhone: setSignupPhone } = useSignupStore()

  const [step, setStep] = useState<Step>('phone')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { phone: '', code: '' },
    mode: 'onTouched',
  })

  const phoneServer = useServerError(form.control, passthroughError<AuthFormData>('phone'))
  const codeServer = useServerError(form.control, passthroughError<AuthFormData>('code'))

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()

  useEffect(() => {
    if (step === 'otp') form.setFocus('code')
  }, [step, form])

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
      if (result.registered) {
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={1} onBack={() => (step === 'otp' ? setStep('phone') : router.back())} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
              신뢰할 수 있는 계약을 위해
              <br />
              <span className="text-primary">본인 확인</span>이 필요해요
            </h1>

            {/* Phone Input */}
            <TextField
              control={form.control}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="010-1234-5678"
              description="품앗이 서비스는 인증된 기술자만 이용하실 수 있어요."
              disabled={step === 'otp'}
              transform={formatPhoneNumber}
              serverError={phoneServer.fieldError('phone')}
            />
          </div>

          {/* OTP Section (step === 'otp') */}
          {step === 'otp' && (
            <TextField
              control={form.control}
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="done"
              placeholder="숫자 6자리"
              hint="타인에게 인증번호를 공유하지 마세요."
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
          )}

          {/* Submit Button */}
          {step === 'phone' ? (
            <FormSubmitButton
              requireAllFilled={false}
              variant="outline"
              size="full"
              disabled={!isPhoneValid}
              isLoading={sendCodeMutation.isPending}
            >
              다음
            </FormSubmitButton>
          ) : (
            <FormSubmitButton
              requireAllFilled={false}
              variant="primary"
              size="full"
              disabled={!isCodeValid}
              isLoading={verifyCodeMutation.isPending}
            >
              다음으로
            </FormSubmitButton>
          )}
        </form>
      </Form>
    </div>
  )
}
