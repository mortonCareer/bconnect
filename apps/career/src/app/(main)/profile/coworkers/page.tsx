/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1234-2262
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCoworkers, useGetMyMember } from '@bconnect/api-client'
import { CoworkerList } from '@bconnect/features'
import { TopBar, SearchIcon } from '@bconnect/ui'
import { matchHangul } from '@bconnect/config/search'

export default function CoworkersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: member, isLoading: isMemberLoading } = useGetMyMember()
  const myId = member?.id

  const {
    data: coworkers,
    isLoading: isCoworkersLoading,
    isError,
  } = useGetCoworkers({ memberId: myId! }, { query: { enabled: myId != null } })

  const isLoading = isMemberLoading || (!!myId && isCoworkersLoading)
  const filtered = (coworkers ?? []).filter((c) => matchHangul(c.member?.name ?? '', search))

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

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

      <CoworkerList
        coworkers={filtered}
        isLoading={isLoading}
        isError={isError}
        coworkerHref={(profileId) => `/profile/${profileId}`}
      />
    </div>
  )
}
