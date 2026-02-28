'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * Feed variants:
 * - collapsed: 접힌 상태 (기본값)
 * - expanded: 펼쳐진 상태
 */
const feedVariants = cva('flex flex-col gap-3 items-stretch', {
  variants: {
    variant: {
      collapsed: '',
      expanded: '',
    },
  },
  defaultVariants: {
    variant: 'collapsed',
  },
})

export interface FeedProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'content' | 'onToggle'>,
    VariantProps<typeof feedVariants> {
  /**
   * 프로필 정보
   */
  profile: {
    image: string
    name: string
    location: string
    jobType: string
    specialty: string
    bio: string
  }
  /**
   * 피드 컨텐츠
   */
  content: {
    image: string
    imageAlt?: string
    company: string
    duration: string
    timestamp: string
    description: string
  }
  /**
   * 초기 펼침 상태 (기본값: false)
   */
  defaultExpanded?: boolean
  /**
   * 더보기/접기 버튼 클릭 핸들러
   */
  onToggle?: (expanded: boolean) => void
  /**
   * 프로필 영역 링크 URL (프로필 페이지 이동용)
   */
  profileHref?: string
  /**
   * 링크 컴포넌트 (Next.js Link 등). 미지정 시 <a> 태그 사용
   */
  LinkComponent?: React.ElementType
}

/**
 * 피드 컴포넌트 (Morton 디자인 시스템)
 *
 * @example
 * ```tsx
 * <Feed
 *   profile={{
 *     image: '/profile.jpg',
 *     name: '이송목',
 *     location: '경기도',
 *     jobType: '준기공',
 *     specialty: '도배',
 *     bio: '안녕하세요, 도배 준기공 이송목입니다.',
 *   }}
 *   content={{
 *     image: '/work.jpg',
 *     company: '서정 건축',
 *     duration: '4일 소요',
 *     timestamp: '3일 전',
 *     description: '골프장 전원주택 도배 시공을 진행하였습니다. 골프장 전원주택 도배 시공을 진행하였습니다.원주택 도배 시공을 ',
 *   }}
 * />
 * ```
 */
export const Feed = React.forwardRef<HTMLDivElement, FeedProps>(
  (
    {
      className,
      profile,
      content,
      defaultExpanded = false,
      onToggle,
      variant,
      profileHref,
      LinkComponent,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

    const handleToggle = () => {
      const newState = !isExpanded
      setIsExpanded(newState)
      onToggle?.(newState)
    }

    const effectiveVariant = isExpanded ? 'expanded' : 'collapsed'

    return (
      <div
        ref={ref}
        className={cn(feedVariants({ variant: effectiveVariant }), 'w-full', className)}
        {...props}
      >
        {/* 프로필 헤더 */}
        {React.createElement(
          profileHref ? LinkComponent || 'a' : 'div',
          {
            ...(profileHref ? { href: profileHref } : {}),
            className: 'flex items-center justify-between no-underline',
          },
          <>
            <div className="flex items-end gap-2">
              {/* 프로필 이미지 */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 프로필 정보 */}
              <div className="flex flex-col justify-center">
                {/* 이름 + 지역/직종/전문분야 */}
                <div className="flex items-center gap-2.5">
                  <p className="text-sb-16 text-morton-gray-900">{profile.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-m-12 text-morton-gray-500">{profile.location}</span>
                    <div className="h-2 w-0 rotate-90 border-t border-morton-gray-300" />
                    <span className="text-m-12 text-morton-gray-500">{profile.jobType}</span>
                    <div className="h-2 w-0 rotate-90 border-t border-morton-gray-300" />
                    <span className="text-m-12 text-morton-gray-500">{profile.specialty}</span>
                  </div>
                </div>
                {/* 자기소개 */}
                <div className="flex items-center">
                  <p className="text-m-12 text-morton-gray-500">{profile.bio}</p>
                </div>
              </div>
            </div>

            {/* chevron */}
            <svg
              width="5.067"
              height="9.6"
              viewBox="0 0 5.067 9.6"
              fill="none"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M0.5 0.5 L4.567 4.8 L0.5 9.1"
                stroke="#1B1B1B"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}

        {/* 이미지 */}
        <div className="relative h-[220px] w-full overflow-hidden rounded-lg">
          <img
            src={content.image}
            alt={content.imageAlt || content.description}
            className="h-full w-full object-cover"
          />
        </div>

        {/* 컨텐츠 푸터 */}
        <div className="flex flex-col">
          {/* 회사명 / 소요일 / 작성일 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <p
                className={cn(
                  'text-r-12 text-morton-gray-700',
                  isExpanded ? 'leading-[1.6]' : 'leading-[21.6px]'
                )}
              >
                {content.company}
              </p>
              <div className="flex h-[13px] w-0 rotate-90 items-center justify-center">
                <div className="h-0 w-[13px] border-t border-morton-gray-300" />
              </div>
              <p
                className={cn(
                  'text-r-12 text-morton-gray-700',
                  isExpanded ? 'leading-[1.6]' : 'leading-[21.6px]'
                )}
              >
                {content.duration}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <p
                className={cn(
                  'text-r-12 text-morton-gray-700',
                  isExpanded ? 'leading-[1.6]' : 'leading-[21.6px]'
                )}
              >
                {content.timestamp}
              </p>
            </div>
          </div>

          {/* 본문 + 더보기/접기 버튼 */}
          <div
            className={cn(
              'flex w-full',
              isExpanded ? 'flex-col items-end justify-center' : 'items-center justify-between'
            )}
          >
            <p
              className={cn(
                'text-m-16 text-morton-gray-900',
                isExpanded
                  ? 'min-w-full w-[min-content] whitespace-pre-wrap leading-[1.6]'
                  : 'truncate leading-[25.2px]'
              )}
            >
              {isExpanded ? content.description : `${content.description.slice(0, 25)}...`}
            </p>
            <button
              type="button"
              onClick={handleToggle}
              className={cn(
                'cursor-pointer text-r-12 text-morton-gray-700 underline decoration-solid hover:text-morton-gray-900',
                isExpanded ? 'leading-[25.2px]' : ''
              )}
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          </div>
        </div>
      </div>
    )
  }
)

Feed.displayName = 'Feed'

export { feedVariants }
