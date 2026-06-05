/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3666
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronIcon } from '../../icons'
import { cn } from '../../lib/utils'

/**
 * ChatListItem variants:
 * - default: 프로필+태그+미리보기+chevron
 * - badge: 시간+읽지않은수 뱃지 포함
 *
 * Figma:
 * - default: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3666
 * - badge: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-4254
 *
 * @example
 * ```tsx
 * // 기본 (chevron)
 * <ChatListItem
 *   name="이송목"
 *   location="경기도"
 *   jobType="준기공"
 *   specialty="도배"
 *   lastMessage="안녕하세요, 도배 준기공 이송목입니다."
 * />
 *
 * // 뱃지
 * <ChatListItem
 *   variant="badge"
 *   name="이송목"
 *   location="경기도"
 *   jobType="준기공"
 *   specialty="도배"
 *   lastMessage="안녕하세요. 궁금한 점이 있어 연락드립니다."
 *   timestamp="6시간 전"
 *   unreadCount={4}
 * />
 * ```
 */

const chatListItemVariants = cva(
  'flex w-full cursor-pointer items-center justify-between transition-colors hover:bg-gray-50',
  {
    variants: {
      variant: {
        default: 'h-[90px] border-b border-[#E5E5E5] px-4',
        badge: 'pb-5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ChatListItemProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chatListItemVariants> {
  /** 프로필 이미지 URL */
  profileImage?: string
  /** 이름 */
  name: string
  /** 지역 */
  location?: string
  /** 직종 */
  jobType?: string
  /** 전문분야 */
  specialty?: string
  /** 마지막 메시지 미리보기 */
  lastMessage?: string
  /** 시간 (badge variant) */
  timestamp?: string
  /** 읽지않은 메시지 수 (badge variant) */
  unreadCount?: number
  /** default variant 우측 chevron 노출 여부 */
  showChevron?: boolean
}

const ChatListItem = React.forwardRef<HTMLDivElement, ChatListItemProps>(
  (
    {
      className,
      variant,
      profileImage,
      name,
      location,
      jobType,
      specialty,
      lastMessage,
      timestamp,
      unreadCount,
      showChevron = true,
      ...props
    },
    ref
  ) => {
    const isBadge = variant === 'badge'
    const tags = [location, jobType, specialty].filter(Boolean)

    return (
      <div
        ref={ref}
        className={cn(
          chatListItemVariants({ variant }),
          isBadge ? 'items-start' : 'items-center',
          className
        )}
        {...props}
      >
        {/* 왼쪽: 프로필 + 정보 */}
        <div
          className={cn(
            'flex min-w-0 flex-1',
            isBadge ? 'items-start gap-2.5' : 'items-center gap-4'
          )}
        >
          {/* 프로필 이미지 */}
          <div className="size-[50px] shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
            {profileImage && (
              <img src={profileImage} alt={name} className="size-full object-cover" />
            )}
          </div>

          {/* 텍스트 정보 */}
          <div className={cn('flex min-w-0 flex-1 flex-col', !isBadge && 'gap-1')}>
            {/* 이름 + 태그 (badge: 우측 시간) */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="text-sb-14 leading-[1.6]! shrink-0 text-[#1B1B1B]">{name}</span>
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 text-m-12 text-[#A5A5A5]">
                    {tags.map((tag, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <span className="text-[#A5A5A5]">|</span>}
                        <span>{tag}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
              {isBadge && timestamp && (
                <span className="shrink-0 text-m-12 text-[#A5A5A5]">{timestamp}</span>
              )}
            </div>

            {/* 미리보기 (badge: 우측 안읽음 수) */}
            {lastMessage && (
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'min-w-0 flex-1 text-[#1B1B1B]',
                    isBadge ? 'truncate text-m-14' : 'line-clamp-2 text-r-12'
                  )}
                >
                  {lastMessage}
                </span>
                {isBadge && unreadCount != null && unreadCount > 0 && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[8px] bg-[#FF4242]">
                    <span className="text-[12px] font-bold leading-none text-white">
                      {unreadCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* default: chevron */}
        {!isBadge && showChevron && (
          <ChevronIcon direction="right" className="size-4 shrink-0 text-[#A5A5A5]" />
        )}
      </div>
    )
  }
)
ChatListItem.displayName = 'ChatListItem'

export { ChatListItem, chatListItemVariants }
