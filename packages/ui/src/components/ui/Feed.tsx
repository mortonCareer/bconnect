/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5449
 */
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { MoreVerticalIcon } from '../../icons'
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
   * 케밥(⋮) 메뉴 클릭 핸들러
   */
  onMore?: () => void
}

/**
 * 피드 컴포넌트 (Morton 디자인 시스템)
 *
 * @example
 * ```tsx
 * <Feed
 *   content={{
 *     image: '/work.jpg',
 *     company: '서정 건축',
 *     duration: '4일 소요',
 *     timestamp: '3일 전',
 *     description: '골프장 전원주택 도배 시공을 진행하였습니다.',
 *   }}
 *   onMore={() => openMenu()}
 * />
 * ```
 */
export const Feed = React.forwardRef<HTMLDivElement, FeedProps>(
  ({ className, content, defaultExpanded = false, onToggle, onMore, variant, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
    const [isTruncated, setIsTruncated] = React.useState(false)
    const textRef = React.useRef<HTMLParagraphElement>(null)

    React.useEffect(() => {
      if (isExpanded) return
      const el = textRef.current
      if (!el) return
      setIsTruncated(el.scrollWidth > el.clientWidth)
    }, [isExpanded, content.description])

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
        {/* 메타행: 회사 · 소요일 / 작성일 · 케밥 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <p className="text-r-12 text-gray-700">{content.company}</p>
            <div className="h-[13px] w-px bg-gray-300" />
            <p className="text-r-12 text-gray-700">{content.duration}</p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-r-12 text-gray-700">{content.timestamp}</p>
            <button
              type="button"
              onClick={onMore}
              className="shrink-0 cursor-pointer p-1 text-gray-900"
              aria-label="더보기 메뉴"
            >
              <MoreVerticalIcon size={16} />
            </button>
          </div>
        </div>

        {/* 이미지 */}
        <div className="relative h-55 w-full overflow-hidden rounded-sm">
          <img
            src={content.image}
            alt={content.imageAlt || content.description}
            className="h-full w-full object-cover"
          />
        </div>

        {/* 본문 캡션 + 더보기/접기 버튼 */}
        <div
          className={cn(
            'flex w-full',
            isExpanded ? 'flex-col items-end justify-center' : 'items-center gap-2'
          )}
        >
          <p
            ref={textRef}
            className={cn(
              'text-m-16 text-gray-900',
              isExpanded
                ? 'min-w-full w-[min-content] whitespace-pre-wrap leading-[1.6]'
                : 'min-w-0 flex-1 truncate leading-[25.2px]'
            )}
          >
            {content.description}
          </p>
          {(isExpanded || isTruncated) && (
            <button
              type="button"
              onClick={handleToggle}
              className={cn(
                'shrink-0 cursor-pointer text-r-12 text-gray-700 underline decoration-solid hover:text-gray-900',
                isExpanded ? 'leading-[25.2px]' : ''
              )}
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Feed.displayName = 'Feed'

export { feedVariants }
