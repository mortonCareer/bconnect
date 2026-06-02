'use client'

import Image from 'next/image'
import type { MaskedMember, Profile } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { getAvatarUrl, getTradeLabel } from './labels'

interface ProfileSummaryProps {
  member?: MaskedMember
  profile?: Profile
  postCount?: number
  coworkerCount?: number
  recommendationCount?: number
}

export function ProfileSummary({
  member,
  profile,
  postCount,
  coworkerCount,
  recommendationCount,
}: ProfileSummaryProps) {
  const name = member?.name ?? '이름 없음'
  const meta = [
    profile?.primaryTrade ? getTradeLabel(profile.primaryTrade) : null,
    profile?.experience != null
      ? profile.experience === 0
        ? '신입'
        : `${profile.experience}년`
      : null,
    profile?.address?.city,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 px-4 pt-4">
        <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full bg-gray-100">
          {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (dicebear SVG·외부 업로드 대응) */}
          <Image
            src={member?.picture || getAvatarUrl(name)}
            alt={name}
            fill
            sizes="100px"
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 justify-around">
          <Stat label="작업물" value={postCount} />
          <Stat label="동료" value={coworkerCount} />
          <Stat label="추천서" value={recommendationCount} />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-sb-20 text-gray-900">{name}</span>
          {meta && <span className="text-r-12 text-gray-500">{meta}</span>}
        </div>
        {profile?.headline && <p className="text-r-14 text-gray-900">{profile.headline}</p>}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {value === undefined ? (
        <Skeleton className="h-6 w-6" />
      ) : (
        <span className="text-sb-16 text-gray-900">{value}</span>
      )}
      <span className="text-r-14 text-gray-900">{label}</span>
    </div>
  )
}
