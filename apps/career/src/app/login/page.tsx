'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSendOtp, useVerifyOtp } from '@morton/api-client'
import { formatPhoneNumber, toE164, isValidPhoneNumber } from '@morton/config/phone'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { authStep, phoneNumber, setPhoneNumber, setCodeSent, login } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendCodeMutation = useSendOtp()
  const verifyCodeMutation = useVerifyOtp()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const e164Phone = toE164(phone)
    setPhoneNumber(e164Phone)

    try {
      const result = await sendCodeMutation.mutateAsync({ data: { phone: e164Phone } })
      if (result.expiresAt) {
        setCodeSent(result.expiresAt)
      }
    } catch {
      setError('인증번호 발송에 실패했습니다.')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!phoneNumber) return

    try {
      const result = await verifyCodeMutation.mutateAsync({
        data: { phone: phoneNumber, code },
      })
      if (result.registered) {
        // 기존 회원 — 바로 로그인
        login({ phone: phoneNumber }, result.accessToken)
        router.push('/')
      } else {
        // 미가입 유저 — 회원가입 플로우로 이동
        router.push('/signup/auth')
      }
    } catch {
      setError('인증번호가 올바르지 않습니다.')
    }
  }

  if (authStep === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-900">인증번호 입력</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {phoneNumber}로 전송된 인증번호를 입력해주세요
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label htmlFor="code" className="sr-only">
                인증번호
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={code.length !== 6 || verifyCodeMutation.isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyCodeMutation.isPending ? '확인 중...' : '확인'}
            </button>

            <button
              type="button"
              onClick={() => useAuthStore.getState().reset()}
              className="w-full flex justify-center py-3 px-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              다른 번호로 로그인
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            휴대폰 번호로 간편하게 로그인하세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
          <div>
            <label htmlFor="phone" className="sr-only">
              휴대폰 번호
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={!isValidPhoneNumber(phone) || sendCodeMutation.isPending}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendCodeMutation.isPending ? '발송 중...' : '인증번호 받기'}
          </button>
        </form>
      </div>
    </div>
  )
}
