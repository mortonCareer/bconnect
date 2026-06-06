/**
 * @figma-scaffold radix Toast primitive — 토스트 알림, 전용 시안 없음
 */
'use client'

import * as React from 'react'
import { Toast as ToastPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-[88px] left-1/2 z-[100] flex w-full max-w-screen-sm -translate-x-1/2 flex-col gap-2 px-4',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = 'ToastViewport'

const toastVariants = cva(
  'pointer-events-auto flex w-full items-center gap-3 rounded-lg px-4 py-3 text-r-14 shadow-lg',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white',
        destructive: 'bg-destructive text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
))
Toast.displayName = 'Toast'

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sb-14', className)} {...props} />
))
ToastTitle.displayName = 'ToastTitle'

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-r-14', className)} {...props} />
))
ToastDescription.displayName = 'ToastDescription'

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription }
