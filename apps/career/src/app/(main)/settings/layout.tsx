import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: '설정' }

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children
}
