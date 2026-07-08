/**
 * @figma-scaffold 이용약관 — 법적 고지 static 페이지, 디자인 노드 없음 (#732)
 */
import type { Metadata } from 'next'
import { TermsOfServiceView } from '@bconnect/features'

export const metadata: Metadata = {
  title: '이용약관',
  description: '품앗이 서비스의 이용약관입니다.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <TermsOfServiceView />
}
