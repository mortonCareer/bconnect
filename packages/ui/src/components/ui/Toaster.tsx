/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-8633
 */
'use client'

import { useToast } from '../../hooks/use-toast'
import { CheckCircleIcon } from '../../icons/CheckCircleIcon'
import { XIcon } from '../../icons/XIcon'
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './shadcn/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="down">
      {toasts.map(({ id, title, description, variant = 'success', ...props }) => {
        const Icon = variant === 'error' ? XIcon : CheckCircleIcon
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon size={18} className="shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
