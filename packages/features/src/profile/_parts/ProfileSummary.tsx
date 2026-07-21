'use client'

import Link from 'next/link'
import { getTradeLabel } from '@bconnect/api-client'
import type { MemberSummary, Profile } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
import { ProfileImage } from './ProfileImage'

/** 클릭 가능한 stat 타겟. 없으면 비-링크 (plan 기본). */
export interface ProfileStatHrefs {
  works?: string
  coworkers?: string
  recommendations?: string
}

interface ProfileSummaryProps {
  member?: MemberSummary
  profile?: Profile
  postCount?: number
  coworkerCount?: number
  recommendationCount?: number
  statHrefs?: ProfileStatHrefs
  /** stat 링크 네비 시 scroll 리셋 여부. 패널(plan)=false 로 배경 스크롤 보존, 풀페이지(career)=기본 */
  statScroll?: boolean
  /** 있으면 프로필 이미지 우하단 edit 배지 렌더 (owner 전용, #966) */
  onEditImage?: () => void
  /** 이미지 업로드 진행 중 — edit 배지 비활성 */
  imageUploading?: boolean
}

export function ProfileSummary({
  member,
  profile,
  postCount,
  coworkerCount,
  recommendationCount,
  statHrefs,
  statScroll,
  onEditImage,
  imageUploading,
}: ProfileSummaryProps) {
  // TODO: BE required 처리 후 type narrowing 필요. MemberSummary/Profile 표시 필드가 optional emit이라 fallback/filter로 silent 처리 중.
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
        <ProfileImage
          src={member?.picture || DEFAULT_PROFILE_IMAGE}
          alt={name}
          onEdit={onEditImage}
          uploading={imageUploading}
        />
        <div className="flex flex-1 justify-around">
          <Stat label="작업물" value={postCount} href={statHrefs?.works} scroll={statScroll} />
          <Stat
            label="동료"
            value={coworkerCount}
            href={statHrefs?.coworkers}
            scroll={statScroll}
          />
          <Stat
            label="추천서"
            value={recommendationCount}
            href={statHrefs?.recommendations}
            scroll={statScroll}
          />
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

function Stat({
  label,
  value,
  href,
  scroll,
}: {
  label: string
  value?: number
  href?: string
  scroll?: boolean
}) {
  const className = 'flex flex-col items-center gap-1'
  const content = (
    <>
      {value === undefined ? (
        <Skeleton className="h-6 w-6" />
      ) : (
        <span className="text-sb-16 text-gray-900">{value}</span>
      )}
      <span className="text-r-14 text-gray-900">{label}</span>
    </>
  )
  return href ? (
    <Link href={href} scroll={scroll} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
