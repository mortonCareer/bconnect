import * as React from 'react'
import { ImageIcon, SendHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

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
      if (e.key === 'Enter' && !disabled && inputValue.trim()) {
        e.preventDefault()
        onSend?.()
      }
    }

    const isActive = !disabled && inputValue.trim().length > 0

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-[80px] items-center gap-[8px] bg-white px-[24px] py-[16px]',
          className
        )}
        {...props}
      >
        {/* 갤러리 아이콘 */}
        <button type="button" className="shrink-0" aria-label="갤러리">
          <ImageIcon className="size-[24px] text-[#A5A5A5]" />
        </button>

        {/* 입력 영역 */}
        <div className="flex flex-1 items-center rounded-[12px] bg-[#F4F4F4] px-[16px] py-[9px]">
          <input
            type="text"
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent font-[Pretendard_Variable] text-[14px] leading-[1.6] outline-none',
              disabled ? 'text-[#A5A5A5]' : 'text-[#1B1B1B]',
              'placeholder:text-[#A5A5A5]'
            )}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!isActive}
          className={cn(
            'flex size-[40px] shrink-0 items-center justify-center rounded-[20px] p-[8px]',
            isActive ? 'bg-[#386DFF]' : 'bg-[#A5A5A5]'
          )}
          aria-label="전송"
        >
          <SendHorizontal className="size-[24px] text-white" />
        </button>
      </div>
    )
  }
)
ChatInput.displayName = 'ChatInput'

export { ChatInput }
