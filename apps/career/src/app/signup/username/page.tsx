'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupUsernamePage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 사용자 이름 유효성 검사 (영어, 숫자, 밑줄, 마침표만 허용)
  const validateUsername = (value: string) => {
    return /^[a-zA-Z0-9_.]+$/.test(value)
  }

  const handleUsernameChange = (value: string) => {
    // 허용된 문자만 입력 가능
    const filtered = value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase()
    setUsername(filtered)
    setError(null)
  }

  const handleSubmit = useCallback(async () => {
    if (!username) return

    if (!validateUsername(username)) {
      setError('사용자 이름은 숫자, 영어, 밑줄 및 마침표만 포함할 수 있습니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: API 호출로 사용자 이름 중복 확인 및 저장
      // const result = await checkUsername({ data: { username } })

      // 임시: 다음 페이지로 이동
      router.push('/signup/profile')
    } catch {
      setError('이미 존재하는 사용자 이름입니다.')
    } finally {
      setIsLoading(false)
    }
  }, [username, router])

  const isValid = username.length >= 3 && validateUsername(username)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <header className="flex h-[60px] items-center justify-between px-4 py-5">
        <button
          onClick={() => router.back()}
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
        {/* Progress Bar - Step 2 of 3 */}
        <div className="flex h-[3px] w-[330px] gap-1">
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
          <div className="h-full flex-1 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="size-5" /> {/* Spacer */}
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col gap-6 px-4 pt-3">
        {/* Title Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
            서비스에서 사용할 ID를
            <br />
            입력해 주세요
          </h1>

          {error ? (
            <p className="text-sm leading-[1.6] text-[#FF4242]">{error}</p>
          ) : (
            <p className="text-sm leading-[1.6] text-[#777]">
              사용자 이름은 숫자, 영어, 밑줄 및 마침표만 포함할 수 있습니다.
              <br />한 번 설정되면 변경할 수 없습니다.
            </p>
          )}

          {/* Username Input */}
          <div className="flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
            <input
              type="text"
              placeholder="내용을 입력해주세요"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="flex h-[50px] items-center justify-center rounded-lg bg-[#386DFF] text-sm font-medium leading-[1.6] text-white transition-colors disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]"
        >
          {isLoading ? '확인 중...' : '다음으로'}
        </button>
      </main>
    </div>
  )
}
