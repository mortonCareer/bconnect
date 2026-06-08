/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-8633
 */
'use client'

import { useToast } from '../../hooks/use-toast'
import { CheckCircleFilledIcon } from '../../icons/CheckCircleFilledIcon'
import { XIcon } from '../../icons/XIcon'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './shadcn/toast'

export function Toaster() {
  const { toasts } = useToast()

  // duration={Infinity} — radix 내부 타이머는 hover/focus/window-blur 에 pause 되어
  // "안 사라짐" 으로 보일 수 있어 비활성화하고, 자동 닫힘은 use-toast 의 자체 타이머가 구동.
  // swipe(아래로)·닫기 버튼은 radix 가 그대로 처리.
  return (
    <ToastProvider swipeDirection="down" duration={Infinity}>
      {toasts.map(({ id, title, description, variant = 'success', ...props }) => {
        const Icon = variant === 'error' ? XIcon : CheckCircleFilledIcon
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon size={18} className="shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose aria-label="닫기">
              <XIcon size={16} aria-hidden />
            </ToastClose>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
