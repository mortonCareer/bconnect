/**
 * @figma-pending 로그인 페이지 디자인 없음
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
import {
  Form,
  FormSubmitButton,
  TextField,
  TopBar,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { OtpTimer } from '../signup/_components/OtpTimer'
import { loginSchema, type LoginFormData } from './schema'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setPhone: setSignupPhone, setSignupToken } = useSignupStore()

  const [step, setStep] = useState<Step>('phone')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', code: '' },
    mode: 'onTouched',
  })

  const phoneServer = useServerError(form.control, passthroughError<LoginFormData>('phone'))
  const codeServer = useServerError(form.control, passthroughError<LoginFormData>('code'))

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
        // 기존 회원 — 바로 로그인 (member 정보는 useGetMyMember 로 별도 조회)
        login(result.accessToken)
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        // router.push 금지 — 라우터 캐시가 로그아웃 시점의 미들웨어 redirect 를 재생해
        // 로그인 페이지로 즉시 돌아온다. 하드 내비게이션으로 캐시를 통째로 리셋 (#855).
        window.location.assign(
          redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
        )
      } else {
        // 미가입 유저 — signupToken 저장 후 회원가입 진행 (OTP 재인증 불필요)
        setSignupPhone(toE164(phone))
        setSignupToken(result.signupToken)
        router.push('/signup/username')
      }
    } catch (err) {
      codeServer.capture(err, form.getValues())
    }
  }

  const lastAutoVerifiedCode = useRef<string | null>(null)

  useEffect(() => {
    if (step !== 'otp' || !isCodeValid || verifyCodeMutation.isPending) return
    if (lastAutoVerifiedCode.current === codeValue) return
    lastAutoVerifiedCode.current = codeValue
    void verifyCode()
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
      <TopBar
        variant="default"
        title="로그인"
        showAction={false}
        onBack={() => (step === 'otp' ? setStep('phone') : router.back())}
      />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-black">
              휴대폰 번호로
              <br />
              <span className="text-primary">간편하게 로그인</span>하세요
            </h1>

            <TextField
              control={form.control}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="010-1234-5678"
              description="가입하신 휴대폰 번호를 입력해주세요."
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
              로그인
            </FormSubmitButton>
          )}
        </form>
      </Form>
    </div>
  )
}
