import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { IS_PRODUCTION_DEPLOY } from '@bconnect/config/deploy-env'

export default function InstagramLayout({ children }: { children: ReactNode }) {
  if (IS_PRODUCTION_DEPLOY) notFound()
  return children
}
