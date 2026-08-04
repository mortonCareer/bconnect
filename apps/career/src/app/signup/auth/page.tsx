/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4394
 * @figma-state OTP대기 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4405
 * @figma-state OTP에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4420
 */
'use client'

import { login } from '@bconnect/features'
import { useSignupStore } from '@/stores/signup-store'
import { useSendOtp, useVerifyOtp } from '@bconnect/api-client'
import { formatPhoneNumber, isValidPhoneNumber, toNationalNumber } from '@bconnect/config/phone'
import { Form, FormSubmitButton, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { OtpTimer } from '../_components/OtpTimer'
import { SignupHeader } from '../_components/SignupHeader'
import { authSchema, type AuthFormData } from './schema'

type Step = 'phone' | 'otp'

export default function SignupAuthPage() {
  const router = useRouter()
  const { setSignupToken } = useSignupStore()

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
    try {
      const result = await sendCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone) },
      })
      if (result.expiresAt) {
        setExpiresAt(result.expiresAt)
      }
      setStep('otp')
    } catch (err) {
      phoneServer.capture(err, form.getValues())
    }
  }

  const lastFailedAttempt = useRef<{ code: string; error: unknown } | null>(null)

  const verifyCode = async ({ silent = false }: { silent?: boolean } = {}) => {
    const { phone, code } = form.getValues()
    if (lastFailedAttempt.current?.code === code) {
      if (!silent) codeServer.capture(lastFailedAttempt.current.error, form.getValues())
      return
    }
    try {
      const result = await verifyCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone), code },
      })
      lastFailedAttempt.current = null
      if (result.registered) {
        // 이미 가입된 회원 — 로그인 처리 후 복귀 (member 정보는 useGetMyMember 로 별도 조회)
        login(result.accessToken)
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        // router.push 금지 — 라우터 캐시가 로그아웃 시점의 미들웨어 redirect 를 재생해
        // 인증 페이지로 즉시 돌아온다. 하드 내비게이션으로 캐시를 통째로 리셋 (#855).
        window.location.assign(
          redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
        )
      } else {
        // 신규 유저 — signupToken 저장 후 회원가입 진행
        setSignupToken(result.signupToken)
        router.push('/signup/username')
      }
    } catch (err) {
      lastFailedAttempt.current = { code, error: err }
      if (!silent) codeServer.capture(err, form.getValues())
    }
  }

  const lastAutoVerifiedCode = useRef<string | null>(null)

  useEffect(() => {
    if (step !== 'otp' || !isCodeValid || verifyCodeMutation.isPending) return
    if (lastAutoVerifiedCode.current === codeValue) return
    lastAutoVerifiedCode.current = codeValue
    void verifyCode({ silent: true })
  }, [step, isCodeValid, codeValue, verifyCodeMutation.isPending, verifyCode])

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
              requireValid={false}
              variant="outline"
              size="full"
              disabled={!isPhoneValid}
              isLoading={sendCodeMutation.isPending}
            >
              다음
            </FormSubmitButton>
          ) : (
            <FormSubmitButton
              requireValid={false}
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
