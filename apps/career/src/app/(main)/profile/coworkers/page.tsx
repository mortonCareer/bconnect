'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCoworkers, useGetMyProfile } from '@morton/api-client'
import { TopBar } from '@morton/ui'
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

  // 실제 API: 각 동료의 profileId 추출
  const coworkerProfileIds = hasRealCoworkers
    ? coworkers.map((c) => (c.minId === myProfileId ? c.maxId! : c.minId!))
    : []

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
      ) : useMock ? (
        <div className="flex flex-col divide-y divide-morton-gray-300">
          {filteredMock.map((coworker) => (
            <MockCoworkerCard key={coworker.id} coworker={coworker} />
          ))}
        </div>
      ) : coworkerProfileIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">등록된 동료가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-morton-gray-300">
          {coworkerProfileIds.map((profileId) => (
            <CoworkerCard key={profileId} profileId={profileId} />
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-morton-gray-300">
        <span className="text-m-14 text-morton-gray-500">{coworker.name[0]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16">{coworker.name}</span>
          <span className="text-r-12 text-morton-gray-500">
            {coworker.trade} · {coworker.role}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-r-12 text-morton-gray-500">{coworker.about}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-morton-gray-400"
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
