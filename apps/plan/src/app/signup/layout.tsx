import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SignupGuard } from './_components/SignupGuard'

/**
 * 가입 라우트 공용 레이아웃 — 제목은 여기서, 진입 판정은 SignupGuard 에서.
 *
 * metadata 는 server component 에서만 내보낼 수 있고 가드는 훅을 쓰므로 client 여야 한다.
 * 한 파일에 섞으면 둘 중 하나가 성립하지 않아 server(layout) + client(guard) 로 나눴다.
 * 페이지 제목을 다루는 #1104 와 파일이 겹치지 않게 하려는 목적도 겸한다.
 */
export const metadata: Metadata = {
  title: '회원가입',
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <SignupGuard>{children}</SignupGuard>
}
