'use client'

import { getTradeLabel, useGetProfile } from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'
import { ProfileCard, ProfileCardSkeleton } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { PanelMessage } from '../_shared/PanelMessage'

export interface CoworkerListProps {
  coworkers?: Coworker[]
  isLoading: boolean
  isError: boolean
  /** 동료 클릭 시 그 동료 프로필 href — 소비처가 주입 (career: /profile/:id, plan: panelHref) */
  coworkerHref: (profileId: number) => string
}

/**
 * 동료 목록 본문 — loading(스켈레톤)·error·empty·리스트 상태를 한 곳에서 처리한다.
 * 감싸는 shell(career 페이지 / plan 패널)은 소비처 책임, 본 컴포넌트는 상태+행 렌더만.
 * career·plan 동료 행의 중복을 흡수한 SSOT.
 */
export function CoworkerList({ coworkers, isLoading, isError, coworkerHref }: CoworkerListProps) {
  if (isLoading) return <CoworkerSkeletonList />
  if (isError) return <PanelMessage>동료를 불러올 수 없습니다</PanelMessage>
  if (!coworkers || coworkers.length === 0)
    return <PanelMessage>등록된 동료가 없습니다</PanelMessage>

  return (
    <ul className="flex flex-col">
      {coworkers.map((coworker) => (
        <CoworkerRow
          key={coworker.id}
          profileId={coworker.member.id}
          href={coworkerHref(coworker.member.id)}
        />
      ))}
    </ul>
  )
}

/** 동료 한 명 — 마스킹 무관 by-id 보강(useGetProfile)으로 분야/지역/소개 채움. */
function CoworkerRow({ profileId, href }: { profileId: number; href: string }) {
  const { data: profileAndMember, isLoading } = useGetProfile(profileId)
  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  if (isLoading) {
    return <ProfileCardSkeleton as="li" className="px-4" />
  }

  if (!profile) return null

  const name = member?.name ?? '이름 없음'

  return (
    <ProfileCard
      as="li"
      className="px-4"
      avatarUrl={member?.picture || getAvatarUrl(name)}
      name={name}
      meta={{
        region: profile.address.city,
        trade: getTradeLabel(profile.primaryTrade),
        // 등급(role)은 MaskedMember 미제공(#473). 시안(1234-2262)은 2번째 줄 = 소개(description).
      }}
      description={profile.headline ?? undefined}
      href={href}
    />
  )
}

function CoworkerSkeletonList() {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <ProfileCardSkeleton key={i} as="li" className="px-4" />
      ))}
    </ul>
  )
}
