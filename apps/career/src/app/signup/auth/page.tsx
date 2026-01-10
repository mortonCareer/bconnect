'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSendOtp, useVerifyOtp } from '@morton/api-client'
import { useAuthStore } from '@/stores/auth-store'

type Step = 'phone' | 'otp'

export default function SignupAuthPage() {
  const router = useRouter()
  const { setPhoneNumber, setCodeSent, login } = useAuthStore()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()

  // 전화번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // E.164 형식 변환
  const toE164 = (phoneNumber: string) => {
    const numbers = phoneNumber.replace(/\D/g, '')
    if (numbers.startsWith('0')) {
      return '+82' + numbers.slice(1)
    }
    return '+82' + numbers
  }

  // 타이머
  useEffect(() => {
    if (remainingTime <= 0) return
    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [remainingTime])

  // 타이머 포맷 (m:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 인증번호 발송
  const handleSendCode = useCallback(async () => {
    setError(null)
    const e164Phone = toE164(phone)
    setPhoneNumber(e164Phone)

    try {
      const result = await sendCodeMutation.mutateAsync({ data: { phone: e164Phone } })
      if (result.expiresAt) {
        setCodeSent(result.expiresAt)
        const expiresAt = new Date(result.expiresAt)
        const now = new Date()
        setRemainingTime(Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      }
      setStep('otp')
    } catch {
      setError('인증번호 발송에 실패했습니다.')
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
      if (result.accessToken && result.user) {
        login(result.user, result.accessToken)
        router.push('/signup/username')
      }
    } catch {
      setError('올바르지 않은 인증번호입니다.')
    }
  }, [phone, code, login, router, verifyCodeMutation])

  // 재발송
  const handleResend = useCallback(async () => {
    setCode('')
    setError(null)
    await handleSendCode()
  }, [handleSendCode])

  const isPhoneValid = phone.replace(/\D/g, '').length >= 10
  const isCodeValid = code.length === 6

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <header className="flex h-[60px] items-center justify-between px-4 py-5">
        <button
          onClick={() => (step === 'otp' ? setStep('phone') : router.back())}
          className="flex size-5 items-center justify-center"
          aria-label="뒤로가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="#9C9C9C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Progress Bar */}
        <div className="flex h-[3px] w-[330px] gap-1">
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
          <div className="h-full flex-1 rounded-full bg-[#E5E7EB]" />
          <div className="h-full flex-1 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="size-5" /> {/* Spacer */}
      </header>

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
          <div className="flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              disabled={step === 'otp'}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* OTP Section (step === 'otp') */}
        {step === 'otp' && (
          <div className="flex flex-col gap-2">
            <div className="flex h-[50px] items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
              <input
                type="text"
                inputMode="numeric"
                placeholder="숫자 6자리"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
              />
              <div className="flex shrink-0 items-center gap-2.5 text-sm">
                {remainingTime > 0 && (
                  <span className="text-[#9C9C9C]">{formatTime(remainingTime)}</span>
                )}
                <button
                  onClick={handleResend}
                  disabled={sendCodeMutation.isPending}
                  className="font-medium text-[#386DFF] disabled:opacity-50"
                >
                  재요청
                </button>
              </div>
            </div>
            {error ? (
              <p className="text-sm leading-[1.6] text-[#FF4242]">{error}</p>
            ) : (
              <p className="text-sm leading-[1.6] text-[#9C9C9C]">
                타인에게 인증번호를 공유하지 마세요.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        {step === 'phone' ? (
          <button
            onClick={handleSendCode}
            disabled={!isPhoneValid || sendCodeMutation.isPending}
            className="flex h-[50px] items-center justify-center rounded-lg border border-[#386DFF] text-sm font-semibold leading-[1.6] text-[#386DFF] transition-colors disabled:border-transparent disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]"
          >
            {sendCodeMutation.isPending ? '발송 중...' : '다음'}
          </button>
        ) : (
          <button
            onClick={handleVerifyCode}
            disabled={!isCodeValid || verifyCodeMutation.isPending}
            className="flex h-[50px] items-center justify-center rounded-lg bg-[#386DFF] text-sm font-medium leading-[1.6] text-white transition-colors disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]"
          >
            {verifyCodeMutation.isPending ? '확인 중...' : '다음으로'}
          </button>
        )}
      </main>
    </div>
  )
}
