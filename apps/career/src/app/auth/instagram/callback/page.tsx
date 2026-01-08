'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setStatus('error')
      setError(searchParams.get('error_description') || '인증이 거부되었습니다.')
      return
    }

    if (!code) {
      setStatus('error')
      setError('인증 코드가 없습니다.')
      return
    }

    exchangeToken(code)
  }, [searchParams, router])

  const exchangeToken = async (code: string) => {
    try {
      const response = await fetch('/api/instagram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '토큰 교환 실패')
      }

      sessionStorage.setItem('instagram_access_token', data.access_token)
      sessionStorage.setItem('instagram_user_id', data.user_id)

      router.push('/instagram/posts')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    }
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-bold text-red-500">인증 실패</h1>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push('/instagram')}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500" />
      <p className="text-gray-600">Instagram 인증 처리 중...</p>
    </div>
  )
}

export default function InstagramCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
