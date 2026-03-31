'use client'

import { useRouter } from 'next/navigation'
import type { Credential, Profile } from '@morton/api-client'
import { Tag } from '@morton/ui'
import { getCredentialLabel } from '../certifications/constants'

// TODO: 추천서 API 연동 — 현재 mock 데이터 사용
const MOCK_RECOMMENDATIONS = [
  {
    id: 1,
    name: '손장수',
    trade: '도배',
    role: '반장',
    content: '깔끔하게 도배하는 동료입니다. 추천합니다...',
  },
  {
    id: 2,
    name: '손장수',
    trade: '도배',
    role: '반장',
    content: '깔끔하게 도배하는 동료입니다. 추천합니다...',
  },
  {
    id: 3,
    name: '손장수',
    trade: '도배',
    role: '반장',
    content: '깔끔하게 도배하는 동료입니다. 추천합니다...',
  },
]

interface IntroSectionProps {
  profile: Profile
  credentials?: Credential[]
}

export function IntroSection({ profile, credentials }: IntroSectionProps) {
  const router = useRouter()
  const { about } = profile

  const acceptedCredentials = credentials?.filter((c) => c.status === 'ACCEPTED') ?? []

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      {/* 인증 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-morton-gray-900">인증</span>
          <button
            className="text-r-12 text-morton-primary underline"
            onClick={() => router.push('/profile/certifications')}
          >
            편집
          </button>
        </div>
        {acceptedCredentials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acceptedCredentials.map((c) => (
              <Tag key={c.id} variant="default" size="sm">
                {c.type ? getCredentialLabel(c.type) : '알 수 없음'}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-r-14 text-morton-gray-500">등록된 인증이 없습니다</p>
        )}
      </div>

      {/* 소개 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-morton-gray-900">소개</span>
          <button
            className="text-r-12 text-morton-primary underline"
            onClick={() => router.push('/profile/edit/about')}
          >
            편집
          </button>
        </div>
        {about ? (
          <p className="whitespace-pre-wrap text-r-14 leading-[22.4px] text-morton-gray-900">
            {about.split(/(#\S+)/g).map((part, i) =>
              part.startsWith('#') ? (
                <span key={i} className="text-morton-primary">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        ) : (
          <p className="text-r-14 text-morton-gray-500">등록된 소개가 없습니다</p>
        )}
      </div>

      {/* 추천서 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-morton-gray-900">추천서</span>
          <button
            className="text-r-12 text-morton-primary underline"
            onClick={() => router.push('/profile/recommendations')}
          >
            편집
          </button>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-morton-gray-300 bg-morton-gray-100 px-3 py-2 text-sb-14 text-morton-gray-900">
            받은 추천서
          </button>
          <button className="rounded-md border border-morton-gray-300 bg-white px-3 py-2 text-r-14 text-morton-gray-900">
            보낸 추천서
          </button>
        </div>
        <div className="flex flex-col divide-y divide-morton-gray-300">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <div key={rec.id} className="flex gap-3 py-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-morton-gray-300">
                <span className="text-r-12 text-morton-gray-500">이미지</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-m-14 text-morton-gray-900">{rec.name}</span>
                  <span className="text-r-12 text-morton-gray-500">
                    {rec.trade} · {rec.role}
                  </span>
                </div>
                <p className="text-r-12 text-morton-gray-900">
                  {rec.content} <span className="text-morton-gray-500 underline">더보기</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
