/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3666
 */
'use client'

import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '../../lib/utils'
import { ChevronIcon } from '../../icons/ChevronIcon'
import { useExpandableText } from '../../hooks/useExpandableText'
import { Skeleton } from './shadcn/skeleton'

export interface ProfileCardMeta {
  /** 지역 — address.city */
  region: string
  /** 공종 — primaryTrade 라벨 */
  trade: string
  /** 등급 — member role 라벨. BE 미제공(#473) 시 생략 */
  role?: string
}

export interface ProfileCardProps {
  /** 소비처가 picture || DEFAULT_PROFILE_IMAGE 로 해소해 전달 */
  avatarUrl: string
  name: string
  /** 지역 │ 등급 │ 공종 순서로 렌더, 빈 값 생략 */
  meta: ProfileCardMeta
  /** 하단 설명줄 (추천 내용 / headline / about). 2줄 초과 시 더보기/접기 */
  description?: string
  /** 주어지면 카드 전체가 Link(stretched), 우측에 chevron 자동 (rightSlot 없을 때) */
  href?: string
  /** 주어지면 아바타+이름만 해당 프로필로 Link (카드 전체 href 없이 사람만 클릭 — 추천서 등) */
  profileHref?: string
  /** 우측 커스텀 (케밥 등). 주면 chevron 대체 */
  rightSlot?: ReactNode
  /** 루트 엘리먼트 — 리스트 항목은 'li' */
  as?: 'div' | 'li'
  className?: string
}

export function ProfileCard({
  avatarUrl,
  name,
  meta,
  description,
  href,
  profileHref,
  rightSlot,
  as: Root = 'div',
  className,
}: ProfileCardProps) {
  const { ref, expanded, showToggle, toggle } = useExpandableText([description], 'height')

  const metaItems = [meta.region, meta.role, meta.trade].filter(Boolean) as string[]

  return (
    <Root
      className={cn(
        'relative flex items-center gap-3 border-b border-[#E5E5E5] py-3',
        href && 'transition-colors hover:bg-gray-50 active:bg-gray-100',
        className
      )}
    >
      {/* stretched link — 카드 전체 클릭/키보드 포커스. 내부 버튼(더보기·rightSlot)은 z-10 로 위에 */}
      {href && (
        <Link
          href={href}
          aria-label={name}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        />
      )}

      <div className="flex min-w-0 flex-1 items-center gap-4">
        {profileHref ? (
          <Link href={profileHref} aria-label={name} className="relative z-10 shrink-0">
            <img
              src={avatarUrl}
              alt={name}
              className="size-[50px] rounded-full bg-gray-100 object-cover"
            />
          </Link>
        ) : (
          <img
            src={avatarUrl}
            alt={name}
            className="size-[50px] shrink-0 rounded-full bg-gray-100 object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2.5">
            {profileHref ? (
              <Link href={profileHref} className="relative z-10 shrink-0 text-sb-14 text-gray-900">
                {name}
              </Link>
            ) : (
              <span className="shrink-0 text-sb-14 text-gray-900">{name}</span>
            )}
            {metaItems.length > 0 && (
              <div className="flex min-w-0 items-center gap-2">
                {metaItems.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className="h-2 w-px shrink-0 bg-gray-300" aria-hidden />}
                    <span className="truncate text-m-12 text-[#A5A5A5]">{item}</span>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
          {description && (
            <div className="flex flex-col items-start gap-0.5">
              <p
                ref={ref}
                className={cn(
                  'whitespace-pre-wrap text-left text-r-12 text-gray-900',
                  !expanded && 'line-clamp-2'
                )}
              >
                {description}
              </p>
              {showToggle && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={expanded}
                  className="relative z-10 cursor-pointer text-r-12 text-[#A5A5A5] underline"
                >
                  {expanded ? '접기' : '더보기'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {rightSlot ? (
        <div className="relative z-10 shrink-0 self-start">{rightSlot}</div>
      ) : href ? (
        <ChevronIcon direction="right" size={16} className="shrink-0 text-gray-400" />
      ) : null}
    </Root>
  )
}

export interface ProfileCardSkeletonProps {
  /** 루트 엘리먼트 — 리스트 항목은 'li' */
  as?: 'div' | 'li'
  className?: string
}

/** ProfileCard 로딩 플레이스홀더 — 카드 레이아웃(아바타 50·gap-4·gap-1·border-b·py-3)과 정합 */
export function ProfileCardSkeleton({ as: Root = 'div', className }: ProfileCardSkeletonProps) {
  return (
    <Root className={cn('flex items-center gap-4 border-b border-[#E5E5E5] py-3', className)}>
      <Skeleton className="size-[50px] shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </Root>
  )
}
