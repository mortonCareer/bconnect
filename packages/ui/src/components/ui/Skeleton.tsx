/**
 * @figma-scaffold 로딩 스켈레톤 프리미티브 — 비주얼 없는 구현 유틸 (animate-pulse placeholder), className 으로 형태 지정 (#344)
 */
import * as React from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded bg-gray-100', className)} {...props} />
}
