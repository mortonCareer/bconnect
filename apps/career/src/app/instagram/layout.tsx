import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: '인스타그램 업로드' }

export default function InstagramLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') notFound()
  return children
}
