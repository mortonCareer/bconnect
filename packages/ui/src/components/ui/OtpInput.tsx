import * as React from 'react'
import { cn } from '../../lib/utils'

export interface OtpInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 남은 시간 (초) */
  remainingTime?: number
  /** 재요청 버튼 클릭 핸들러 */
  onResend?: () => void
  /** 재요청 버튼 비활성화 */
  resendDisabled?: boolean
}

/**
 * 남은 시간을 "M:SS" 형식으로 포맷
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * OTP 인증번호 입력 컴포넌트 (Morton 디자인 시스템)
 *
 * Figma: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=331-3851
 *
 * @example
 * ```tsx
 * <OtpInput
 *   placeholder="인증번호 입력"
 *   remainingTime={164}
 *   onResend={() => console.log('재요청')}
 * />
 * ```
 */
const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  ({ className, remainingTime = 0, onResend, resendDisabled, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center w-full h-[50px] px-3 py-[7px] rounded-lg border border-morton-gray-300 bg-transparent',
          className
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          ref={ref}
          data-slot="otp-input"
          className="flex-1 bg-transparent text-base leading-[1.6] font-sans text-morton-gray-900 placeholder:text-morton-gray-500 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <div className="flex items-center gap-[10px] text-sm shrink-0">
          {remainingTime > 0 && (
            <span className="font-sans text-morton-gray-500">{formatTime(remainingTime)}</span>
          )}
          <button
            type="button"
            onClick={onResend}
            disabled={resendDisabled}
            className="font-sans font-medium text-morton-primary hover:text-morton-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            재요청
          </button>
        </div>
      </div>
    )
  }
)
OtpInput.displayName = 'OtpInput'

export { OtpInput }
