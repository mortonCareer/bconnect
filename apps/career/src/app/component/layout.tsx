import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export default function ComponentLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') notFound()
  return children
}
