'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getTradeLabel, useGetProfile } from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'
import { ChevronIcon, Skeleton } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'

/** 앱이 resolve 해 내려주는 데이터. plan 어댑터가 useGetCoworkers(by-id) 로 채운다. */
export interface CoworkersViewData {
  coworkers?: Coworker[]
  isLoading: boolean
  isError: boolean
}

export interface CoworkersViewProps {
  data: CoworkersViewData
  closeHref: string
  onClose: () => void
  /** 부모(프로필) 패널로 복귀 */
  backHref: string
  /** 동료 클릭 시 그 동료 프로필 패널/페이지 href — 앱이 주입 (plan: panelHref) */
  coworkerHref: (profileId: number) => string
}

export function CoworkersView({
  data,
  closeHref,
  onClose,
  backHref,
  coworkerHref,
}: CoworkersViewProps) {
  const { coworkers, isLoading, isError } = data

  return (
    <PanelShell
      title="동료"
      backHref={backHref}
      backLabel="프로필"
      closeLabel="동료 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      <PanelScroll>
        {isLoading ? (
          <CoworkerSkeletonList />
        ) : isError ? (
          <PanelMessage>동료를 불러올 수 없습니다</PanelMessage>
        ) : !coworkers || coworkers.length === 0 ? (
          <PanelMessage>등록된 동료가 없습니다</PanelMessage>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-200">
            {coworkers.map((coworker) => (
              <li key={coworker.id}>
                <CoworkerRow
                  profileId={coworker.member.id}
                  href={coworkerHref(coworker.member.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </PanelScroll>
    </PanelShell>
  )
}

/** 동료 한 명 — 마스킹 무관 by-id 보강(useGetProfile)으로 분야/지역/소개 채움. career CoworkerCard 대응. */
function CoworkerRow({ profileId, href }: { profileId: number; href: string }) {
  const { data: profileAndMember, isLoading } = useGetProfile(profileId)
  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const name = member?.name ?? '이름 없음'
  const trade = profile.primaryTrade ? getTradeLabel(profile.primaryTrade) : null
  const subtitle = [profile.address?.city, trade].filter(Boolean).join(' · ')

  return (
    <Link
      href={href}
      scroll={false}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors active:bg-gray-100"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (dicebear SVG·외부 업로드 대응) */}
        <Image
          src={member?.picture || getAvatarUrl(name)}
          alt={name}
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16 text-gray-900">{name}</span>
          {subtitle && <span className="text-r-12 text-gray-500">{subtitle}</span>}
        </div>
        {profile.headline && (
          <p className="line-clamp-2 text-left text-r-14 text-gray-500">{profile.headline}</p>
        )}
      </div>
      <ChevronIcon direction="right" className="text-gray-400" />
    </Link>
  )
}

function CoworkerSkeletonList() {
  return (
    <ul className="flex flex-col divide-y divide-gray-200">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </li>
      ))}
    </ul>
  )
}
