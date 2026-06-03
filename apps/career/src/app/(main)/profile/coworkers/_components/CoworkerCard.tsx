'use client'

import { useRouter } from 'next/navigation'
import { TRADE_LABELS, useGetProfile } from '@bconnect/api-client'
import { ChevronIcon } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'

interface CoworkerCardProps {
  profileId: number
}

export function CoworkerCard({ profileId }: CoworkerCardProps) {
  const router = useRouter()
  // useGetProfile 응답 = ProfileAndMember = { member, profile } (member 도 함께 옴)
  const { data: profileAndMember, isLoading } = useGetProfile(profileId)
  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-3 px-4 py-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const name = member?.name ?? '이름 없음'
  const picture = member?.picture
  const trade = profile?.primaryTrade ? TRADE_LABELS[profile.primaryTrade] : null
  // TODO: role 은 MaskedMember 에 없음 (BE public masking) — 필요시 BE 협의 후 부활
  const subtitle = trade ?? ''
  const intro = profile?.headline

  return (
    <button
      type="button"
      onClick={() => router.push(`/profile/${profileId}`)}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors active:bg-gray-100"
    >
      {/* 프로필 이미지 */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <img
          src={picture || getAvatarUrl(name)}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 이름 + 분야/역할 + 소개 */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16 text-gray-900">{name}</span>
          {subtitle && <span className="text-r-12 text-gray-500">{subtitle}</span>}
        </div>
        {intro && <p className="line-clamp-2 text-left text-r-14 text-gray-500">{intro}</p>}
      </div>

      {/* 오른쪽 화살표 */}
      <ChevronIcon direction="right" className="shrink-0 text-gray-400" />
    </button>
  )
}
