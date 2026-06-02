/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3666
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronRight } from 'lucide-react'
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
        default: 'h-[80px] border-b border-[#E5E5E5] px-[16px] py-[20px]',
        badge: 'pb-[20px]',
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
      ...props
    },
    ref
  ) => {
    const isBadge = variant === 'badge'
    const tags = [location, jobType, specialty].filter(Boolean)

    return (
      <div ref={ref} className={cn(chatListItemVariants({ variant }), className)} {...props}>
        {/* 왼쪽: 프로필 + 정보 */}
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          {/* 프로필 이미지 */}
          <div
            className={cn(
              'shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]',
              isBadge ? 'size-[50px]' : 'size-[40px]'
            )}
          >
            {profileImage && (
              <img src={profileImage} alt={name} className="size-full object-cover" />
            )}
          </div>

          {/* 텍스트 정보 */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 이름 + 태그 */}
            <div className="flex items-center gap-[10px]">
              <span className="shrink-0 text-sb-16 text-[#1B1B1B]">{name}</span>
              {tags.length > 0 && (
                <div
                  className={cn(
                    'flex items-center gap-[8px] text-[#A5A5A5]',
                    isBadge ? 'text-m-14' : 'text-m-12'
                  )}
                >
                  {tags.map((tag, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-[#A5A5A5]">|</span>}
                      <span>{tag}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* 메시지 미리보기 */}
            {lastMessage && (
              <span
                className={cn(
                  'truncate',
                  isBadge ? 'text-m-14 text-[#1B1B1B]' : 'text-m-12 text-[#A5A5A5]'
                )}
              >
                {lastMessage}
              </span>
            )}
          </div>
        </div>

        {/* 오른쪽 영역 */}
        {isBadge ? (
          <div className="flex shrink-0 flex-col items-end justify-center gap-[8px]">
            {timestamp && <span className="text-m-12 text-[#A5A5A5]">{timestamp}</span>}
            {unreadCount != null && unreadCount > 0 && (
              <div className="flex size-[20px] items-center justify-center rounded-[8px] bg-[#FF4242]">
                <span className="text-[12px] font-bold leading-none text-white">{unreadCount}</span>
              </div>
            )}
          </div>
        ) : (
          <ChevronRight className="size-[16px] shrink-0 text-[#A5A5A5]" />
        )}
      </div>
    )
  }
)
ChatListItem.displayName = 'ChatListItem'

export { ChatListItem, chatListItemVariants }
