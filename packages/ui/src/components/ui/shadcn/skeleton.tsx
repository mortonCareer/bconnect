/**
 * @figma-scaffold shadcn/ui Skeleton primitive — 로딩 placeholder, className 으로 형태 지정. bg 는 KRDS gray-100
 */
import * as React from 'react'
import { cn } from '../../../lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-gray-100', className)}
      {...props}
    />
  )
}

export { Skeleton }
