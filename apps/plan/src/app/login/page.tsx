/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1416-1534
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
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { OtpTimer } from './_components'

type Step = 'phone' | 'otp'

const schema = z.object({
  phone: z.string().refine(isValidPhoneNumber, '유효하지 않은 전화번호입니다.'),
  code: z.string().regex(/^\d{6}$/, '인증번호 6자리를 입력해주세요.'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setPhone: setSignupPhone, setSignupToken } = useSignupStore()

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
        router.push('/')
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
      <div className="flex w-[480px] flex-col items-center gap-8 rounded-[12px] border border-gray-300 p-10">
        {/* Logo */}
        <Image src="/logo.png" alt="품앗이" width={160} height={56} priority />

        {/* Subtitle */}
        <p className="text-r-16 text-gray-700">신뢰할 수 있는 인테리어 하도급 섭외 · 관리 서비스</p>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex w-[400px] flex-col gap-3">
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
            <Button
              type="submit"
              variant={isSubmitDisabled ? 'secondary' : 'primary'}
              size="full"
              disabled={isSubmitDisabled}
              isLoading={isSubmitLoading}
            >
              {step === 'phone' ? '인증번호 받기' : '인증 완료'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
