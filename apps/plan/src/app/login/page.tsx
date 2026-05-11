/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1416-1535
 */
'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { ApiError, useSendOtp, useVerifyOtp } from '@bconnect/api-client'
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  toE164,
  toNationalNumber,
} from '@bconnect/config/phone'
import { Button } from '@bconnect/ui'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { FormInput, OtpTimer } from './_components'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()
  const { setPhone: setSignupPhone, setSignupToken } = useSignupStore()

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
      const result = await sendCodeMutation.mutateAsync({
        data: { phone: toNationalNumber(phone) },
      })
      if (result.expiresAt) {
        setCodeSent(result.expiresAt)
        setExpiresAt(result.expiresAt)
      }
      setStep('otp')
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'OTP_RATE_LIMIT':
            setError('인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
            break
          case 'INVALID_PHONE':
            setError('유효하지 않은 전화번호입니다.')
            break
          default:
            setError(error.message || '인증번호 발송에 실패했습니다.')
        }
      } else {
        setError('인증번호 발송에 실패했습니다.')
      }
    }
  }, [phone, setPhoneNumber, setCodeSent, sendCodeMutation])

  // 인증번호 확인
  const handleVerifyCode = useCallback(async () => {
    setError(null)

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
        const e164Phone = toE164(phone)
        setSignupPhone(e164Phone)
        setSignupToken(result.signupToken)
        router.push('/signup/member')
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'OTP_INVALID':
            setError('올바르지 않은 인증번호입니다.')
            break
          case 'OTP_EXPIRED':
            setError('인증번호가 만료되었습니다. 재요청해주세요.')
            break
          case 'OTP_MAX_ATTEMPTS':
            setError('인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.')
            break
          default:
            setError(error.message || '인증에 실패했습니다.')
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

  const isSubmitDisabled = step === 'phone' ? !isPhoneValid : !isCodeValid
  const isSubmitLoading =
    step === 'phone' ? sendCodeMutation.isPending : verifyCodeMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {/* Card */}
      <div className="flex w-[480px] flex-col items-center gap-8 rounded-[12px] border border-bconnect-gray-300 p-10">
        {/* Logo */}
        <Image src="/logo.png" alt="품앗이" width={160} height={56} priority />

        {/* Subtitle */}
        <p className="text-r-16 text-bconnect-gray-700">
          신뢰할 수 있는 인테리어 하도급 섭외 · 관리 서비스
        </p>

        {/* Form */}
        <div className="flex w-[400px] flex-col gap-3">
          {/* Label */}
          <p className="text-m-16 text-bconnect-gray-900">휴대전화</p>

          {/* Helper text */}
          <p className="text-r-14 text-bconnect-gray-700">
            품앗이 서비스는 인증된 사용자만 이용하실 수 있어요.
          </p>

          {/* Inputs */}
          <div className="flex flex-col gap-3">
            {/* Phone Input */}
            <FormInput
              type="tel"
              inputMode="numeric"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              onKeyDown={handleKeyDown}
              disabled={step === 'otp'}
            />

            {/* OTP Section */}
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
                  <p className="text-r-14 text-bconnect-error">{error}</p>
                ) : (
                  <p className="text-r-14 text-bconnect-gray-500">
                    타인에게 인증번호를 공유하지 마세요.
                  </p>
                )}
              </div>
            )}

            {/* Phone step error */}
            {step === 'phone' && error && <p className="text-r-14 text-bconnect-error">{error}</p>}
          </div>

          {/* Submit Button */}
          <Button
            variant={isSubmitDisabled ? 'secondary' : 'primary'}
            size="full"
            onClick={step === 'phone' ? handleSendCode : handleVerifyCode}
            disabled={isSubmitDisabled}
            isLoading={isSubmitLoading}
            loadingText={step === 'phone' ? '발송 중...' : '확인 중...'}
          >
            {step === 'phone' ? '인증번호 받기' : '인증 완료'}
          </Button>
        </div>
      </div>
    </div>
  )
}
