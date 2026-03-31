'use client'

import { useRouter } from 'next/navigation'
import { useGetProfile, useGetMembers } from '@morton/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { getRoleLabel } from '@/hooks/useFeedItems'

interface CoworkerCardProps {
  profileId: number
}

export function CoworkerCard({ profileId }: CoworkerCardProps) {
  const router = useRouter()
  const { data: profile, isLoading: isProfileLoading } = useGetProfile(profileId)
  const { data: members, isLoading: isMemberLoading } = useGetMembers()

  const member = members?.find((m) => m.id === profile?.memberId)
  const isLoading = isProfileLoading || isMemberLoading

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-3 px-4 py-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-morton-gray-200" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-24 rounded bg-morton-gray-200" />
          <div className="h-3 w-40 rounded bg-morton-gray-200" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const name = member?.name ?? '이름 없음'
  const picture = member?.picture
  const trade = profile.primaryTrade ? TRADE_LABELS[profile.primaryTrade] : null
  const role = member?.role ? getRoleLabel(member.role) : null
  const subtitle = [trade, role].filter(Boolean).join(' · ')
  const intro = profile.headline

  return (
    <button
      type="button"
      onClick={() => router.push(`/profile/${profileId}`)}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors active:bg-morton-gray-100"
    >
      {/* 프로필 이미지 */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-morton-gray-300">
        {picture ? (
          <img src={picture} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sb-16 text-morton-gray-500">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* 이름 + 분야/역할 + 소개 */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16 text-morton-gray-900">{name}</span>
          {subtitle && <span className="text-r-12 text-morton-gray-500">{subtitle}</span>}
        </div>
        {intro && <p className="line-clamp-2 text-left text-r-14 text-morton-gray-500">{intro}</p>}
      </div>

      {/* 오른쪽 화살표 */}
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
    </button>
  )
}
