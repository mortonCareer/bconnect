/**
 * @figma-scaffold radix Toast 뷰포트(useToast 소비) — 전용 시안 없음
 */
'use client'

import { useToast } from '../../hooks/use-toast'
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './shadcn/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="down">
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
