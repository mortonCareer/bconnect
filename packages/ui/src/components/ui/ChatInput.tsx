/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-5740
 */
import * as React from 'react'
import { cn } from '../../lib/utils'
import { ImageIcon } from '../../icons/ImageIcon'
import { SendIcon } from '../../icons/SendIcon'

/**
 * ChatInput variants:
 * - default: 텍스트 입력됨 - 파란 전송버튼
 * - disabled: placeholder - 회색 전송버튼
 *
 * Figma: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-5740
 *
 * @example
 * ```tsx
 * <ChatInput
 *   value={message}
 *   onChange={setMessage}
 *   onSend={handleSend}
 * />
 *
 * // 비활성
 * <ChatInput disabled />
 * ```
 */

export interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 입력 값 */
  value?: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** 전송 버튼 클릭 핸들러 */
  onSend?: () => void
  /** 입력 값 변경 핸들러 */
  onChange?: (value: string) => void
  /** 비활성 상태 */
  disabled?: boolean
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  (
    {
      className,
      value = '',
      placeholder = '내용을 입력해주세요.',
      onSend,
      onChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState(value)

    React.useEffect(() => {
      setInputValue(value)
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      onChange?.(newValue)
    }

    const handleSendClick = () => {
      if (!disabled && inputValue.trim()) {
        onSend?.()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing && !disabled && inputValue.trim()) {
        e.preventDefault()
        onSend?.()
      }
    }

    const isActive = !disabled && inputValue.trim().length > 0

    return (
      <div
        ref={ref}
        className={cn(
          // 하단 고정 입력바 — viewport-fit=cover 라 홈 인디케이터/제스처바 높이를 직접 확보한다.
          // 채팅 상세는 하단 네비(safe-area 패딩 보유)가 숨겨져 이 컴포넌트가 화면 최하단이다 (#1017).
          // 고정 h-20 이면 그 패딩이 안쪽을 먹으므로 min-h-20.
          'flex min-h-20 items-center gap-2 bg-white px-6 py-4',
          'pb-[calc(env(safe-area-inset-bottom)+1rem)]',
          className
        )}
        {...props}
      >
        {/* 갤러리 아이콘 */}
        <button type="button" className="shrink-0" aria-label="갤러리">
          <ImageIcon size={24} className="text-gray-500" />
        </button>

        {/* 입력 영역 */}
        <div className="flex flex-1 items-center rounded-xl bg-gray-100 px-4 py-[9px]">
          <input
            type="text"
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent text-r-14 outline-none',
              disabled ? 'text-gray-500' : 'text-gray-900',
              'placeholder:text-gray-500'
            )}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!isActive}
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full p-2',
            isActive ? 'bg-primary' : 'bg-[#A5A5A5]'
          )}
          aria-label="전송"
        >
          <SendIcon size={24} className="text-white" />
        </button>
      </div>
    )
  }
)
ChatInput.displayName = 'ChatInput'

export { ChatInput }
