/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1234-2262
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCoworkers, useGetMyProfile } from '@bconnect/api-client'
import { TopBar, SearchIcon } from '@bconnect/ui'
import { matchHangul } from '@bconnect/config/search'
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

  const isLoading = isProfileLoading || (!!myProfileId && isCoworkersLoading)

  const coworkerMemberIds = (coworkers ?? [])
    .filter((c) => matchHangul(c.member.name, search))
    .map((c) => c.member.id)

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 검색 입력 */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <SearchIcon className="text-gray-400" />
          <input
            type="search"
            placeholder="이름·초성 검색 (예: ㄱㅎㄷ)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-r-14 text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* 동료 목록 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      ) : coworkerMemberIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">등록된 동료가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {coworkerMemberIds.map((memberId) => (
            <CoworkerCard key={memberId} profileId={memberId} />
          ))}
        </div>
      )}
    </div>
  )
}
