'use client'

import { useRouter } from 'next/navigation'
import { getCredentialLabel, getTradeLabel } from '@bconnect/api-client'
import type { Credential, Profile, Recommendation } from '@bconnect/api-client'
import { Tab, Tag } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { useQueryState } from 'nuqs'

interface IntroSectionProps {
  profile: Profile
  credentials?: Credential[]
  isOwner: boolean
  receivedRecommendations: Recommendation[]
  sentRecommendations: Recommendation[]
}

const REC_TABS = [
  { key: 'received', label: '받은 추천서' },
  { key: 'sent', label: '보낸 추천서' },
]

export function IntroSection({
  profile,
  credentials,
  isOwner,
  receivedRecommendations,
  sentRecommendations,
}: IntroSectionProps) {
  const router = useRouter()
  const { about } = profile

  const [recTab, setRecTab] = useQueryState('rec', { defaultValue: 'received' })

  const acceptedCredentials = credentials?.filter((c) => c.status === 'ACCEPTED') ?? []
  const recommendations = recTab === 'sent' ? sentRecommendations : receivedRecommendations

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      {/* 인증 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-gray-900">인증</span>
          {isOwner && (
            <button
              className="text-r-12 text-primary underline"
              onClick={() => router.push('/profile/certifications')}
            >
              편집
            </button>
          )}
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
          <p className="text-r-14 text-gray-500">등록된 인증이 없습니다</p>
        )}
      </div>

      {/* 소개 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-gray-900">소개</span>
          {isOwner && (
            <button
              className="text-r-12 text-primary underline"
              onClick={() => router.push('/profile/edit/about')}
            >
              편집
            </button>
          )}
        </div>
        {about ? (
          <p className="whitespace-pre-wrap text-r-14 leading-[22.4px] text-gray-900">
            {about.split(/(#\S+)/g).map((part, i) =>
              part.startsWith('#') ? (
                <span key={i} className="text-primary">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        ) : (
          <p className="text-r-14 text-gray-500">등록된 소개가 없습니다</p>
        )}
      </div>

      {/* 추천서 섹션 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-gray-900">추천서</span>
          {isOwner && (
            <button
              className="text-r-12 text-primary underline"
              onClick={() => router.push('/profile/recommendations')}
            >
              편집
            </button>
          )}
        </div>
        <Tab items={REC_TABS} activeKey={recTab} onChange={setRecTab} />
        {recommendations.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-300">
            {recommendations.map((rec) => {
              // TODO(#473): BE가 MaskedMember.role 미제공 — 추가되면 실제 role 연결
              const role = '반장(Mocked)'
              return (
                <div key={rec.id} className="flex gap-3 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    <img
                      src={rec.member.picture || getAvatarUrl(rec.member.name)}
                      alt={rec.member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-m-14 text-gray-900">{rec.member.name}</span>
                      <span className="text-r-12 text-gray-500">
                        {getTradeLabel(rec.profile.primaryTrade)} · {role}
                      </span>
                    </div>
                    <p className="text-r-12 text-gray-900">
                      {rec.content} <span className="text-gray-500 underline">더보기</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-r-14 text-gray-500">
            {recTab === 'sent' ? '보낸 추천서가 없습니다' : '받은 추천서가 없습니다'}
          </p>
        )}
      </div>
    </div>
  )
}
