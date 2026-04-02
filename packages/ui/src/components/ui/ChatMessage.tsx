import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * ChatMessage variants:
 * - mine: 내 채팅 - 파란색 버블, 오른쪽 정렬
 * - theirs: 상대 채팅 - 회색 버블, 프로필+닉네임
 * - typing: 입력 중 - 프로필+닉네임+타이핑 인디케이터
 */
const chatBubbleVariants = cva('inline-flex items-center px-[16px] text-r-14', {
  variants: {
    variant: {
      mine: 'bg-morton-primary text-white rounded-tl-[12px] rounded-bl-[12px] rounded-br-[12px] py-[9px]',
      theirs:
        'bg-morton-gray-100 text-morton-gray-900 rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] py-[12px]',
      typing:
        'bg-morton-gray-100 rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] py-[9px] h-[40px]',
    },
  },
  defaultVariants: {
    variant: 'mine',
  },
})

export interface ChatMessageProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chatBubbleVariants> {
  /** 메시지 내용 (typing variant에서는 무시됨) */
  message?: string
  /** 타임스탬프 (예: "오후 2:09") */
  timestamp?: string
  /** 프로필 이미지 URL (theirs, typing variant) */
  profileImage?: string
  /** 닉네임 (theirs, typing variant) */
  nickname?: string
}

/**
 * 채팅 메시지 컴포넌트 (Morton 디자인 시스템)
 *
 * Figma: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-4504
 *
 * @example
 * ```tsx
 * // 내 채팅
 * <ChatMessage variant="mine" message="안녕하세요." timestamp="오후 2:09" />
 *
 * // 상대 채팅
 * <ChatMessage
 *   variant="theirs"
 *   message="네 안녕하세요."
 *   timestamp="오후 2:13"
 *   nickname="닉네임"
 *   profileImage="/profile.png"
 * />
 *
 * // 입력 중
 * <ChatMessage variant="typing" nickname="닉네임" profileImage="/profile.png" />
 * ```
 */
const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ className, variant, message, timestamp, profileImage, nickname, ...props }, ref) => {
    if (variant === 'mine') {
      return (
        <div ref={ref} className={cn('flex items-end justify-end gap-[8px]', className)} {...props}>
          {timestamp && (
            <span className="shrink-0 text-r-12 text-morton-gray-700">{timestamp}</span>
          )}
          <div className={cn(chatBubbleVariants({ variant }), 'max-w-[55vw]')}>
            <span className="break-words">{message}</span>
          </div>
        </div>
      )
    }

    // theirs & typing 공통 레이아웃
    return (
      <div ref={ref} className={cn('flex items-start gap-[8px]', className)} {...props}>
        {/* 프로필 이미지 */}
        <div className="size-[40px] shrink-0 overflow-hidden rounded-full bg-morton-gray-100">
          {profileImage && (
            <img src={profileImage} alt={nickname || ''} className="size-full object-cover" />
          )}
        </div>

        {/* 닉네임 + 버블 + 타임스탬프 */}
        <div className="flex items-end gap-[8px]">
          <div className="flex max-w-[55vw] flex-col gap-[4px]">
            {nickname && <span className="text-m-12 text-morton-gray-900">{nickname}</span>}
            <div className={chatBubbleVariants({ variant })}>
              {variant === 'typing' ? (
                <TypingDots />
              ) : (
                <span className="break-words">{message}</span>
              )}
            </div>
          </div>
          {variant === 'theirs' && timestamp && (
            <span className="shrink-0 text-r-12 text-morton-gray-700">{timestamp}</span>
          )}
        </div>
      </div>
    )
  }
)
ChatMessage.displayName = 'ChatMessage'

/** 타이핑 인디케이터 (3개의 점 애니메이션) */
function TypingDots() {
  return (
    <div className="flex items-center gap-[4px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-[8px] rounded-full bg-morton-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )
}

export { ChatMessage, chatBubbleVariants }
