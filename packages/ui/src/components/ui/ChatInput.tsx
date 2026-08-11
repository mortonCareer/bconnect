/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-5740
 */
import * as React from 'react'
import { cn } from '../../lib/utils'
import { ImageIcon } from '../../icons/ImageIcon'
import { SendFilledIcon } from '../../icons/SendFilledIcon'

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
    // 전송 후 재포커스용 — forwardRef 는 래퍼 div 를 가리켜 input 핸들이 따로 필요하다 (#1147)
    const inputRef = React.useRef<HTMLInputElement>(null)
    // 키보드가 열리면 제스처바가 키보드에 가리는데 safe-area 패딩은 그대로 남아 하단이 빈다 (#1147)
    const [isFocused, setIsFocused] = React.useState(false)

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
        // 모바일은 user gesture 안의 동기 호출만 포커스를 허용한다 — setTimeout·await 뒤로 미루면 무시됨
        inputRef.current?.focus()
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
          // 고정 h-16 이면 그 패딩이 안쪽을 먹으므로 min-h-16.
          // w-full/max-w-full — 부모가 flex row 등일 때도 화면 폭을 넘겨 전송 버튼이 잘리지 않게 (#1147)
          // 상·하 패딩은 입력바가 메시지를 가려 Figma(py-4 / h-20) 대비 절반으로 줄였다. min-h 도 같이
          // 줄이지 않으면 floor 에 걸려 높이가 안 변하므로 80 → 64 (#1146)
          'flex w-full max-w-full min-h-16 items-center gap-2 bg-white px-6 py-2',
          isFocused ? 'pb-2' : 'pb-[calc(env(safe-area-inset-bottom)+0.5rem)]',
          className
        )}
        {...props}
      >
        {/* 갤러리 아이콘 */}
        <button type="button" className="shrink-0" aria-label="갤러리">
          <ImageIcon size={24} className="text-gray-500" />
        </button>

        {/* 입력 영역 — min-w-0 없으면 input 의 intrinsic 최소폭(기본 size=20, 약 180px)이
            flex min-width:auto 로 잠겨 좁은 기기에서 전송 버튼을 화면 밖으로 밀어낸다 (#1147) */}
        <div className="flex min-w-0 flex-1 items-center rounded-xl bg-gray-100 px-4 py-[9px]">
          <input
            ref={inputRef}
            type="text"
            // name 이 없으면 브라우저가 placeholder 등 약한 신호로 필드 종류를 오분류해
            // 주소·비밀번호 제안을 띄운다. 무의미한 name 으로 고정 + autoComplete off 로 차단 (#1147)
            name="chat-message"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={cn(
              'w-full min-w-0 flex-1 bg-transparent text-r-14 caret-primary outline-none',
              disabled ? 'text-gray-500' : 'text-gray-900',
              'placeholder:text-gray-500'
            )}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          type="button"
          // mousedown 단계에서 input 이 blur 되며 모바일 키보드가 닫힌다 (click 은 그 이후) — 기본동작 차단으로 포커스 유지 (#1147)
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSendClick}
          disabled={!isActive}
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full p-2',
            isActive ? 'bg-primary' : 'bg-[#A5A5A5]'
          )}
          aria-label="전송"
        >
          <SendFilledIcon size={24} className="text-gray-100" />
        </button>
      </div>
    )
  }
)
ChatInput.displayName = 'ChatInput'

export { ChatInput }
