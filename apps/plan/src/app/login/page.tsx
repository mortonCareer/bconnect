/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1416-1534
 * @figma-state 인증오류 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1506-15119
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
  Logo,
  TextField,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { OtpTimer } from './_components/OtpTimer'
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
      if ('accessToken' in result) {
        // 기존 회원 — 바로 로그인
        login(result.accessToken)
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        router.push(
          redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
        )
      } else {
        // 미가입 유저 — signupToken 저장 후 회원가입 진행
        setSignupPhone(toE164(phone))
        setSignupToken(result.signupToken)
        router.push('/signup/member')
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

  const isSubmitDisabled = step === 'phone' ? !isPhoneValid : !isCodeValid
  const isSubmitLoading =
    step === 'phone' ? sendCodeMutation.isPending : verifyCodeMutation.isPending

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
          <form onSubmit={handleSubmit} className="flex w-100 flex-col gap-3">
            <TextField
              control={form.control}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              enterKeyHint="next"
              label="휴대전화"
              description="품앗이 서비스는 인증된 사용자만 이용하실 수 있어요."
              placeholder="010-0000-0000"
              disabled={step === 'otp'}
              transform={formatPhoneNumber}
              serverError={phoneServer.fieldError('phone')}
            />

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
            <FormSubmitButton
              requireAllFilled={false}
              variant={isSubmitDisabled ? 'secondary' : 'primary'}
              size="full"
              disabled={isSubmitDisabled}
              isLoading={isSubmitLoading}
            >
              {step === 'phone' ? '인증번호 받기' : '인증 완료'}
            </FormSubmitButton>
          </form>
        </Form>
      </div>
    </div>
  )
}
