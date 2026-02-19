'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { ApiError, ErrorCode, useSendOtp, useVerifyOtp } from '@morton/api-client'
import { formatPhoneNumber, isValidPhoneNumber, toE164 } from '@morton/config/phone'
import { Button } from '@morton/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { FormInput, OtpTimer, SignupHeader, FormError } from '../_components'

type Step = 'phone' | 'otp'

export default function SignupAuthPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setSignupToken, setPhone: setSignupPhone } = useSignupStore()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()

  // 인증번호 발송
  const handleSendCode = useCallback(async () => {
    setError(null)
    const e164Phone = toE164(phone)
    setPhoneNumber(e164Phone)

    try {
      const result = await sendCodeMutation.mutateAsync({ data: { phone: e164Phone } })
      if (result.expiresAt) {
        setCodeSent(result.expiresAt)
        setExpiresAt(result.expiresAt)
      }
      setStep('otp')
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case ErrorCode.OTP_RATE_LIMIT:
            setError('인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
            break
          case ErrorCode.INVALID_PHONE:
            setError('유효하지 않은 전화번호입니다.')
            break
          default:
            setError(err.message || '인증번호 발송에 실패했습니다.')
        }
      } else {
        setError('인증번호 발송에 실패했습니다.')
      }
    }
  }, [phone, setPhoneNumber, setCodeSent, sendCodeMutation])

  // 인증번호 확인
  const handleVerifyCode = useCallback(async () => {
    setError(null)
    const e164Phone = toE164(phone)

    try {
      const result = await verifyCodeMutation.mutateAsync({
        data: { phone: e164Phone, code },
      })
      if (result.registered) {
        // 이미 가입된 회원 — 로그인 처리 후 홈으로
        login({ phone: e164Phone }, result.accessToken)
        router.push('/')
      } else {
        // 신규 유저 — signupToken 저장 후 회원가입 진행
        setSignupPhone(e164Phone)
        setSignupToken(result.signupToken)
        router.push('/signup/username')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case ErrorCode.OTP_INVALID:
            setError('올바르지 않은 인증번호입니다.')
            break
          case ErrorCode.OTP_EXPIRED:
            setError('인증번호가 만료되었습니다. 재요청해주세요.')
            break
          case ErrorCode.OTP_MAX_ATTEMPTS:
            setError('인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.')
            break
          default:
            setError(err.message || '인증에 실패했습니다.')
        }
      } else {
        setError('인증에 실패했습니다.')
      }
    }
  }, [phone, code, login, router, verifyCodeMutation, setSignupPhone, setSignupToken])

  // 재발송
  const handleResend = useCallback(async () => {
    setCode('')
    setError(null)
    await handleSendCode()
  }, [handleSendCode])

  const isPhoneValid = isValidPhoneNumber(phone)
  const isCodeValid = code.length === 6

  // 엔터키 submit 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone' && isPhoneValid && !sendCodeMutation.isPending) {
        handleSendCode()
      } else if (step === 'otp' && isCodeValid && !verifyCodeMutation.isPending) {
        handleVerifyCode()
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={1} onBack={() => (step === 'otp' ? setStep('phone') : router.back())} />

      {/* Content */}
      <main className="flex flex-1 flex-col gap-6 px-4 pt-3">
        {/* Title Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
            신뢰할 수 있는 계약을 위해 <span className="text-[#386DFF]">본인 확인</span>이 필요해요
          </h1>
          <p className="text-sm leading-[1.6] text-[#9C9C9C]">
            공방터 서비스는 인증된 기술자만 이용하실 수 있어요.
          </p>

          {/* Phone Input */}
          <FormInput
            type="tel"
            inputMode="numeric"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            onKeyDown={handleKeyDown}
            disabled={step === 'otp'}
          />
        </div>

        {/* OTP Section (step === 'otp') */}
        {step === 'otp' && (
          <div className="flex flex-col gap-2">
            <FormInput
              type="text"
              inputMode="numeric"
              placeholder="숫자 6자리"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyDown}
              rightElement={
                <OtpTimer
                  expiresAt={expiresAt}
                  onResend={handleResend}
                  isResending={sendCodeMutation.isPending}
                />
              }
            />
            {error ? (
              <FormError message={error} />
            ) : (
              <p className="text-sm leading-[1.6] text-[#9C9C9C]">
                타인에게 인증번호를 공유하지 마세요.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        {step === 'phone' ? (
          <Button
            variant="outline"
            size="full"
            onClick={handleSendCode}
            disabled={!isPhoneValid}
            isLoading={sendCodeMutation.isPending}
            loadingText="발송 중..."
          >
            다음
          </Button>
        ) : (
          <Button
            variant="primary"
            size="full"
            onClick={handleVerifyCode}
            disabled={!isCodeValid}
            isLoading={verifyCodeMutation.isPending}
            loadingText="확인 중..."
          >
            다음으로
          </Button>
        )}
      </main>
    </div>
  )
}
