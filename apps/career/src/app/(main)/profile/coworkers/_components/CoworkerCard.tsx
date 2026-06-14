'use client'

import { getTradeLabel, useGetProfile } from '@bconnect/api-client'
import { ProfileCard, ProfileCardSkeleton } from '@bconnect/ui'
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
    return <ProfileCardSkeleton className="px-4" />
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
