'use client'

import Link from 'next/link'
import { getCredentialLabel, getTradeLabel } from '@bconnect/api-client'
import type { Credential, Profile, Recommendation } from '@bconnect/api-client'
import { cn, useExpandableText } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { useQueryState } from 'nuqs'

interface IntroSectionProps {
  profile: Profile
  credentials?: Credential[]
  isOwner: boolean
  receivedRecommendations: Recommendation[]
  sentRecommendations: Recommendation[]
}

export function IntroSection({
  profile,
  credentials,
  isOwner,
  receivedRecommendations,
  sentRecommendations,
}: IntroSectionProps) {
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
            <Link
              href="/profile/certifications"
              className="cursor-pointer text-r-12 text-primary underline"
            >
              편집
            </Link>
          )}
        </div>
        {acceptedCredentials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acceptedCredentials.map((c) => (
              <div
                key={c.id}
                className="rounded-[4px] border border-gray-200 bg-white px-3 py-1.5 text-r-14 text-[#7B7B7B]"
              >
                {c.type ? getCredentialLabel(c.type) : '알 수 없음'}
              </div>
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
            <Link
              href="/profile/edit/about"
              className="cursor-pointer text-r-12 text-primary underline"
            >
              편집
            </Link>
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
            <Link
              href="/profile/recommendations"
              className="cursor-pointer text-r-12 text-primary underline"
            >
              편집
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecTab('received')}
            className={cn(
              'cursor-pointer rounded-md border border-gray-300 px-3 py-2',
              recTab === 'received'
                ? 'bg-gray-100 text-sb-14 text-gray-900'
                : 'bg-white text-r-14 text-gray-900'
            )}
          >
            받은 추천서
          </button>
          <button
            type="button"
            onClick={() => setRecTab('sent')}
            className={cn(
              'cursor-pointer rounded-md border border-gray-300 px-3 py-2',
              recTab === 'sent'
                ? 'bg-gray-100 text-sb-14 text-gray-900'
                : 'bg-white text-r-14 text-gray-900'
            )}
          >
            보낸 추천서
          </button>
        </div>
        {recommendations.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-300">
            {recommendations.map((rec) => (
              <RecommendationRow key={rec.id} recommendation={rec} />
            ))}
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

function RecommendationRow({ recommendation }: { recommendation: Recommendation }) {
  const { member, content, profile } = recommendation
  const { ref, expanded, showToggle, toggle } = useExpandableText([content], 'height')
  // TODO(#473): BE가 MaskedMember.role 미제공 — 추가되면 실제 role 연결
  const role = '반장(Mocked)'

  return (
    <div className="flex gap-3 py-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <img
          src={member.picture || getAvatarUrl(member.name)}
          alt={member.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-m-14 text-gray-900">{member.name}</span>
          <span className="text-r-12 text-gray-500">
            {getTradeLabel(profile.primaryTrade)} · {role}
          </span>
        </div>
        <p ref={ref} className={cn('text-r-12 text-gray-900', !expanded && 'line-clamp-2')}>
          {content}
        </p>
        {showToggle && (
          <button
            type="button"
            onClick={toggle}
            className="cursor-pointer self-start text-r-12 text-gray-500 underline"
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </div>
  )
}
