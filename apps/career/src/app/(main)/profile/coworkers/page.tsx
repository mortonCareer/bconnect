'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCoworkers, useGetMyProfile } from '@morton/api-client'
import { TopBar } from '@morton/ui'
import { CoworkerCard } from './_components/CoworkerCard'

export default function CoworkersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: myProfile, isLoading: isProfileLoading } = useGetMyProfile()
  const myProfileId = myProfile?.id

  const { data: coworkers, isLoading: isCoworkersLoading } = useGetCoworkers(
    { profileId: myProfileId! },
    { query: { enabled: myProfileId != null } }
  )

  const isLoading = isProfileLoading || isCoworkersLoading

  // 각 동료의 profileId 추출 (minId/maxId 중 내가 아닌 쪽)
  const coworkerProfileIds = useMemo(() => {
    if (!coworkers || myProfileId == null) return []
    return coworkers.map((c) => (c.minId === myProfileId ? c.maxId! : c.minId!))
  }, [coworkers, myProfileId])

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 검색 입력 */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-morton-gray-300 bg-white px-3 py-2.5 focus-within:border-morton-primary focus-within:ring-1 focus-within:ring-morton-primary">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="shrink-0 text-morton-gray-400"
          >
            <path
              d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 17.5L13.875 13.875"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-base text-morton-gray-900 outline-none placeholder:text-morton-gray-500"
          />
        </div>
      </div>

      {/* 동료 목록 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      ) : coworkerProfileIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">등록된 동료가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-morton-gray-200">
          {coworkerProfileIds.map((profileId) => (
            <CoworkerCard key={profileId} profileId={profileId} />
          ))}
        </div>
      )}
    </div>
  )
}
