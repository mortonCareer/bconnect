'use client'

import { getTradeLabel } from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'
import { ProfileCard, ProfileCardSkeleton } from '@bconnect/ui'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
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
      {coworkers.map((coworker) => {
        // TODO: BE required 처리 후 type narrowing 필요. Coworker.member.id는 행 링크 필수값인데 optional emit이라 없는 행은 임시로 렌더 제외.
        const memberId = coworker.member?.id
        if (memberId == null) return null
        return <CoworkerRow key={coworker.id} coworker={coworker} href={coworkerHref(memberId)} />
      })}
    </ul>
  )
}

/**
 * 동료 한 명 — 분야/지역/소개는 목록 응답이 이미 실어 보내는 member·profile 요약에서 읽는다.
 * (예전엔 행마다 useGetProfile 로 by-id 재조회 → 인원수만큼 N+1 요청. 목록 응답 embed 로 제거, #851)
 */
function CoworkerRow({ coworker, href }: { coworker: Coworker; href: string }) {
  const { member, profile } = coworker
  const name = member?.name ?? '이름 없음'

  return (
    <ProfileCard
      as="li"
      className="px-4"
      avatarUrl={member?.picture || DEFAULT_PROFILE_IMAGE}
      name={name}
      meta={{
        // TODO: BE required 처리 후 type narrowing 필요. region/trade는 표시 필수값인데 optional emit이라 빈값으로 silent fallback 중.
        region: profile?.address?.city ?? '',
        trade: profile?.primaryTrade ? getTradeLabel(profile.primaryTrade) : '',
        // 등급(role)은 MemberSummary 미제공(#473). 시안(1234-2262)은 2번째 줄 = 소개(description).
      }}
      description={profile?.headline ?? undefined}
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
