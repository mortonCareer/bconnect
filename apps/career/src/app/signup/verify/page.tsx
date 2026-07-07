/**
 * @figma-scaffold 가입 완료 재인증 — register(POST /members)가 세션 토큰을 발급하지 않아
 *   OTP 재인증으로 accessToken 확보 후 프로필을 생성하는 임시 단계 (BE가 register 시
 *   세션을 발급하면 이 페이지와 signup-store.pendingProfile 은 제거 예정)
 */
'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { useCreateProfile, useSendOtp, useVerifyOtp } from '@bconnect/api-client'
import { fromE164, toNationalNumber } from '@bconnect/config/phone'
import { Form, FormSubmitButton, TextField, passthroughError, useServerError } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { OtpTimer } from '../_components/OtpTimer'
import { SignupHeader } from '../_components/SignupHeader'

const verifySchema = z.object({
  code: z.string().length(6, '인증번호 6자리를 입력해주세요.'),
})
type VerifyFormData = z.infer<typeof verifySchema>

type Step = 'send' | 'otp'

export default function SignupVerifyPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const { formData } = useSignupStore()
  const phone = formData.phone
  const pendingProfile = formData.pendingProfile

  const [step, setStep] = useState<Step>('send')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  })
  const codeServer = useServerError(form.control, passthroughError<VerifyFormData>('code'))

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()
  const createProfileMutation = useCreateProfile()

  // 흐름 이탈 가드 — 회원 생성·프로필 입력(=pendingProfile)을 거치지 않고 직접 진입 시 처음으로.
  useEffect(() => {
    if (!phone || !pendingProfile) router.replace('/signup/auth')
  }, [phone, pendingProfile, router])

  useEffect(() => {
    if (step === 'otp') form.setFocus('code')
  }, [step, form])

  const codeValue = useWatch({ control: form.control, name: 'code' })
  const isCodeValid = (codeValue ?? '').length === 6

  const sendCode = async () => {
    try {
      const result = await sendCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone) },
      })
      if (result.expiresAt) setExpiresAt(result.expiresAt)
      setStep('otp')
    } catch (err) {
      codeServer.capture(err, form.getValues())
    }
  }

  const verifyAndCreate = async () => {
    if (!pendingProfile) return
    try {
      const result = await verifyCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone), code: form.getValues('code') },
      })
      if (!result.registered) {
        // 방금 register 했으므로 정상 흐름이라면 registered=true. 아니면 가입 유실.
        form.setError('code', {
          message: '가입 정보를 찾을 수 없어요. 처음부터 다시 시도해주세요.',
        })
        return
      }
      login(result.accessToken)
      await createProfileMutation.mutateAsync({ data: pendingProfile })
      // reset 은 최종 도착지(complete)에서 수행 — 여기서 비우면 흐름 이탈 가드가
      // 재발동해 /signup/auth 로 리다이렉트되는 경합이 생긴다.
      router.push('/signup/complete')
    } catch (err) {
      codeServer.capture(err, form.getValues())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'send') {
      await sendCode()
    } else if (await form.trigger('code')) {
      await verifyAndCreate()
    }
  }

  const handleResend = async () => {
    form.setValue('code', '')
    codeServer.reset()
    await sendCode()
  }

  // 가드가 리다이렉트하는 사이 phone 이 비어 toNationalNumber 가 던지지 않도록.
  if (!phone || !pendingProfile) return null

  const isFinalizing = verifyCodeMutation.isPending || createProfileMutation.isPending

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={4} total={4} onBack={() => router.back()} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
              가입을 완료하려면
              <br />
              <span className="text-primary">본인 확인</span>이 한 번 더 필요해요
            </h1>

            <p className="text-base text-gray-600">{fromE164(phone)}로 인증번호를 보내드려요.</p>
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
          {step === 'send' ? (
            <FormSubmitButton
              requireAllFilled={false}
              variant="outline"
              size="full"
              isLoading={sendCodeMutation.isPending}
            >
              인증번호 받기
            </FormSubmitButton>
          ) : (
            <FormSubmitButton
              requireAllFilled={false}
              variant="primary"
              size="full"
              disabled={!isCodeValid}
              isLoading={isFinalizing}
            >
              가입 완료
            </FormSubmitButton>
          )}
        </form>
      </Form>
    </div>
  )
}
