'use client'

import { getTradeLabel, useGetProfile } from '@bconnect/api-client'
import { ProfileCard } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'

interface CoworkerCardProps {
  profileId: number
}

export function CoworkerCard({ profileId }: CoworkerCardProps) {
  // useGetProfile 응답 = ProfileAndMember = { member, profile } (member 도 함께 옴)
  const { data: profileAndMember, isLoading } = useGetProfile(profileId)
  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-4 px-4 py-3">
        <div className="size-[50px] shrink-0 rounded-full bg-gray-200" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const name = member?.name ?? '이름 없음'

  return (
    <ProfileCard
      className="px-4"
      avatarUrl={member?.picture || getAvatarUrl(name)}
      name={name}
      meta={{
        region: profile.address.city,
        trade: getTradeLabel(profile.primaryTrade),
        // TODO(#473): role 은 MaskedMember 에 없음 (BE public masking) — 추가 시 실제 연결
        role: '준기공(Mocked)',
      }}
      description={profile.headline ?? undefined}
      href={`/profile/${profileId}`}
    />
  )
}
