import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: '원클릭 조회' }

export default function OneClickApplyLayout({ children }: { children: ReactNode }) {
  return children
}
