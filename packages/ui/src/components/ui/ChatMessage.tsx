/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-4504
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * ChatMessage variants:
 * - mine: 내 채팅 - 파란색 버블, 오른쪽 정렬
 * - theirs: 상대 채팅 - 회색 버블, 프로필+닉네임
 * - typing: 입력 중 - 프로필+닉네임+타이핑 인디케이터
 */
const chatBubbleVariants = cva('inline-flex items-center px-4 text-r-14', {
  variants: {
    variant: {
      mine: 'bg-primary text-white rounded-tl-xl rounded-bl-xl rounded-br-xl py-[9px]',
      theirs: 'bg-gray-100 text-gray-900 rounded-tr-xl rounded-bl-xl rounded-br-xl py-3',
      typing: 'bg-gray-100 rounded-tr-xl rounded-bl-xl rounded-br-xl py-[9px] h-10',
    },
  },
  defaultVariants: {
    variant: 'mine',
  },
})

export interface ChatMessageImage {
  id: number
  url: string
  alt?: string
}

export interface ChatMessageProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chatBubbleVariants> {
  /** 메시지 내용 (typing variant에서는 무시됨) */
  message?: string
  /** 사진 메시지 — 주입 시 말풍선 대신 이미지가 렌더된다 */
  images?: ChatMessageImage[]
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
  ({ className, variant, message, images, timestamp, profileImage, nickname, ...props }, ref) => {
    const hasImages = (images?.length ?? 0) > 0

    if (variant === 'mine') {
      return (
        <div ref={ref} className={cn('flex items-end justify-end gap-2', className)} {...props}>
          {timestamp && <span className="shrink-0 text-r-12 text-gray-700">{timestamp}</span>}
          {hasImages ? (
            <ImageGrid images={images ?? []} className="max-w-[55vw]" />
          ) : (
            <div className={cn(chatBubbleVariants({ variant }), 'max-w-[55vw]')}>
              <span className="break-words">{message}</span>
            </div>
          )}
        </div>
      )
    }

    // theirs & typing 공통 레이아웃
    return (
      <div ref={ref} className={cn('flex items-start gap-2', className)} {...props}>
        {/* 프로필 이미지 */}
        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {profileImage && (
            <img src={profileImage} alt={nickname || ''} className="size-full object-cover" />
          )}
        </div>

        {/* 닉네임 + 버블 + 타임스탬프 */}
        <div className="flex items-end gap-2">
          <div className="flex max-w-[55vw] flex-col gap-1">
            {nickname && <span className="text-m-12 text-gray-900">{nickname}</span>}
            {hasImages && variant !== 'typing' ? (
              <ImageGrid images={images ?? []} />
            ) : (
              <div className={chatBubbleVariants({ variant })}>
                {variant === 'typing' ? (
                  <TypingDots />
                ) : (
                  <span className="break-words">{message}</span>
                )}
              </div>
            )}
          </div>
          {variant === 'theirs' && timestamp && (
            <span className="shrink-0 text-r-12 text-gray-700">{timestamp}</span>
          )}
        </div>
      </div>
    )
  }
)
ChatMessage.displayName = 'ChatMessage'

/**
 * 사진 메시지 격자. private CloudFront 이미지라 next/image 가 아닌 plain img 를 쓴다
 * (Optimizer 는 서버 fetch 라 브라우저 signed cookie 를 싣지 못해 403).
 */
function ImageGrid({ images, className }: { images: ChatMessageImage[]; className?: string }) {
  const isSingle = images.length === 1
  return (
    <div className={cn('grid w-max gap-1', isSingle ? 'grid-cols-1' : 'grid-cols-2', className)}>
      {images.map((image) => (
        <img
          key={image.id}
          src={image.url}
          alt={image.alt ?? '사진'}
          className={cn(
            'rounded-xl bg-gray-100 object-cover',
            isSingle ? 'max-h-60 max-w-full' : 'size-28'
          )}
        />
      ))}
    </div>
  )
}

/** 타이핑 인디케이터 (3개의 점 애니메이션) */
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )
}

export { ChatMessage, chatBubbleVariants }
