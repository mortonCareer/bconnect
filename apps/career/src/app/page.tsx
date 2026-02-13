'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLogout } from '@morton/api-client'
import { useAuthStore } from '../stores/auth-store'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // 서버 에러가 나더라도 로컬 상태는 초기화
    }
    logoutStore()
    router.push('/')
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Career</h1>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name || user?.phone || '사용자'}님</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/signup/auth"
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              회원가입
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              로그인
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Instagram 연동</h2>
        <Link
          href="/instagram/upload"
          className="inline-block rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          Instagram 데이터 업로드
        </Link>
      </div>
    </div>
  )
}
