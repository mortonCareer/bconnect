import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { IS_PRODUCTION_DEPLOY } from '@bconnect/config/deploy-env'

export const metadata: Metadata = { title: '인스타그램 업로드' }

export default function InstagramLayout({ children }: { children: ReactNode }) {
  if (IS_PRODUCTION_DEPLOY) notFound()
  return children
}
