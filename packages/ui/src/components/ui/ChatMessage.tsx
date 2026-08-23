/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-4504
 */
import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * ChatMessage variants:
 * - mine: 내 채팅 - 파란색 버블, 오른쪽 정렬
 * - theirs: 상대 채팅 - 회색 버블, 프로필+닉네임
 * - typing: 입력 중 - 프로필+닉네임+타이핑 인디케이터
 */
const chatBubbleVariants = cva('inline-flex items-center rounded-xl px-4 text-r-14', {
  variants: {
    variant: {
      mine: 'bg-primary text-white py-[9px]',
      theirs: 'bg-gray-100 text-gray-900 py-3',
      typing: 'bg-gray-100 py-[9px] h-10',
    },
    /** 꼬리(각진 모서리) — 그룹 첫 메시지만 갖는다 */
    hasTail: { true: '', false: '' },
  },
  compoundVariants: [
    { variant: 'mine', hasTail: true, class: 'rounded-tr-none' },
    { variant: 'theirs', hasTail: true, class: 'rounded-tl-none' },
    { variant: 'typing', hasTail: true, class: 'rounded-tl-none' },
  ],
  defaultVariants: {
    variant: 'mine',
    hasTail: true,
  },
})

export interface ChatMessageImage {
  id: number
  url: string
  alt?: string
}

export interface ChatMessageProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof chatBubbleVariants>, 'hasTail'> {
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
  /** 주어지면 프로필 이미지가 해당 프로필로 가는 Link (theirs, typing) */
  profileHref?: string
  /**
   * 같은 분 그룹의 후속 메시지 — 프로필·닉네임을 숨기고(자리는 유지) 꼬리도 없앤다.
   * 카톡처럼 두 번째 메시지부터 모서리가 전부 둥글어진다.
   */
  grouped?: boolean
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
  (
    {
      className,
      variant,
      message,
      images,
      timestamp,
      profileImage,
      nickname,
      profileHref,
      grouped = false,
      ...props
    },
    ref
  ) => {
    const hasImages = (images?.length ?? 0) > 0
    const bubbleClass = chatBubbleVariants({ variant, hasTail: !grouped })
    const avatarClass = cn(
      'size-10 shrink-0 overflow-hidden rounded-full',
      !grouped && 'bg-gray-100'
    )
    const avatarImage = !grouped && profileImage && (
      <img src={profileImage} alt={nickname || ''} className="size-full object-cover" />
    )

    if (variant === 'mine') {
      return (
        <div ref={ref} className={cn('flex items-end justify-end gap-2', className)} {...props}>
          {timestamp && <span className="shrink-0 text-r-12 text-gray-700">{timestamp}</span>}
          {hasImages ? (
            <ImageGrid images={images ?? []} />
          ) : (
            <div className={cn(bubbleClass, 'max-w-[55vw]')}>
              <span className="break-words">{message}</span>
            </div>
          )}
        </div>
      )
    }

    // theirs & typing 공통 레이아웃
    return (
      <div ref={ref} className={cn('flex items-start gap-2', className)} {...props}>
        {/* 프로필 이미지 — 그룹 후속 메시지는 자리만. href 주면 프로필로 이동 */}
        {profileHref && !grouped ? (
          <Link
            href={profileHref}
            aria-label={nickname ? `${nickname} 프로필 보기` : '프로필 보기'}
            className={cn(
              avatarClass,
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            {avatarImage}
          </Link>
        ) : (
          <div className={avatarClass} aria-hidden={grouped}>
            {avatarImage}
          </div>
        )}

        {/* 닉네임 + 버블 + 타임스탬프 */}
        <div className="flex items-end gap-2">
          <div className="flex max-w-[55vw] flex-col gap-1">
            {!grouped && nickname && <span className="text-m-12 text-gray-900">{nickname}</span>}
            {hasImages && variant !== 'typing' ? (
              <ImageGrid images={images ?? []} />
            ) : (
              <div className={bubbleClass}>
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
    <div
      className={cn(
        // 폭을 내용에 맡긴다 — 뷰포트 기준(vw)으로 잡으면 plan 패널처럼 좁은 컨테이너에서 넘친다.
        'grid w-max gap-1',
        isSingle ? 'grid-cols-1' : 'grid-cols-2',
        className
      )}
    >
      {images.map((image) => (
        <img
          key={image.id}
          src={image.url}
          alt={image.alt ?? '사진'}
          className={cn(
            'rounded-xl bg-gray-100 object-cover',
            isSingle ? 'max-h-60 min-w-28 max-w-full' : 'size-28'
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
