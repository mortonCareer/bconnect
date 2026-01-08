'use client'

const INSTAGRAM_AUTH_URL = 'https://www.instagram.com/oauth/authorize'

export default function InstagramLoginPage() {
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI

  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri: redirectUri || '',
      scope: 'instagram_business_basic,instagram_business_content_publish',
      response_type: 'code',
    })

    window.location.href = `${INSTAGRAM_AUTH_URL}?${params.toString()}`
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Instagram 연동</h1>
      <p className="text-center text-gray-600">
        Instagram 비즈니스/크리에이터 계정을 연동하여
        <br />
        작업물을 가져올 수 있습니다.
      </p>

      <button
        onClick={handleLogin}
        className="rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
      >
        Instagram으로 로그인
      </button>

      <p className="text-sm text-gray-400">* 비즈니스 또는 크리에이터 계정만 지원됩니다</p>
    </div>
  )
}
