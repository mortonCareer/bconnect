'use client'

import { useRouter } from 'next/navigation'
import { useLogout } from '@morton/api-client'
import { useAuthStore } from '../stores/auth-store'
import { UserList } from './user-list'

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
    router.push('/login')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Career</h1>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name || user?.phone || '사용자'}님</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">등록된 사용자</h2>
        <UserList />
      </div>
    </div>
  )
}
