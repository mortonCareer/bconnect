/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1234-2262
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCoworkers, useGetMyProfile } from '@bconnect/api-client'
import { getAvatarUrl } from '@/lib/avatar'
import { TopBar, SearchIcon } from '@bconnect/ui'
import { CoworkerCard } from './_components/CoworkerCard'

// TODO: API 연동 후 제거 — 발표용 mock 데이터
const MOCK_COWORKERS = [
  {
    id: 1,
    name: '손장수',
    trade: '도배',
    role: '반장',
    about: '안녕하세요, 도배 준기공 이송목입니다. 믿고 맡겨주신다면 성실히 임하겠습니다.',
  },
  {
    id: 2,
    name: '김철수',
    trade: '타일',
    role: '기공',
    about: '타일 시공 전문입니다. 수입타일, 욕실타일 모두 가능합니다.',
  },
  {
    id: 3,
    name: '박영희',
    trade: '도배',
    role: '반장',
    about: '깔끔하게 도배하는 동료입니다. 함께 오랜 시간 일하면서 성실한 일처리를 보았습니다.',
  },
  {
    id: 4,
    name: '이민호',
    trade: '미장',
    role: '기공',
    about: '미장 실력이 좋고 현장 분위기를 밝게 만드는 동료입니다.',
  },
]

export default function CoworkersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const {
    data: myProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useGetMyProfile({ query: { retry: false } })
  const myProfileId = myProfile?.id

  const { data: coworkers, isLoading: isCoworkersLoading } = useGetCoworkers(
    { profileId: myProfileId! },
    { query: { enabled: myProfileId != null } }
  )

  // API 에러 또는 빈 결과 시 mock 데이터 폴백
  const hasRealCoworkers =
    !isProfileError && !isCoworkersLoading && coworkers && coworkers.length > 0
  const useMock = !hasRealCoworkers
  const isLoading = !isProfileError && (isProfileLoading || (!!myProfileId && isCoworkersLoading))

  // mock일 때 검색 필터링
  const filteredMock = MOCK_COWORKERS.filter(
    (c) => !search || c.name.includes(search) || c.trade.includes(search)
  )

  // 실제 API: 각 동료의 member id 추출 (Coworker 가 member 를 inline 으로 포함)
  const coworkerMemberIds = hasRealCoworkers ? coworkers.map((c) => c.member.id) : []

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 검색 입력 */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <SearchIcon className="text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* 동료 목록 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      ) : useMock ? (
        <div className="flex flex-col divide-y divide-gray-300">
          {filteredMock.map((coworker) => (
            <MockCoworkerCard key={coworker.id} coworker={coworker} />
          ))}
        </div>
      ) : coworkerMemberIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">등록된 동료가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-300">
          {coworkerMemberIds.map((memberId) => (
            <CoworkerCard key={memberId} profileId={memberId} />
          ))}
        </div>
      )}
    </div>
  )
}

function MockCoworkerCard({
  coworker,
}: {
  coworker: { name: string; trade: string; role: string; about: string }
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <img
          src={getAvatarUrl(coworker.name)}
          alt={coworker.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16">{coworker.name}</span>
          <span className="text-r-12 text-gray-500">
            {coworker.trade} · {coworker.role}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-r-12 text-gray-500">{coworker.about}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-gray-400"
      >
        <path
          d="M7.5 15L12.5 10L7.5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
