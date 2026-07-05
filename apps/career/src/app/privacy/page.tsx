/**
 * @figma-scaffold 개인정보 처리방침 — 법적 고지 static 페이지, 디자인 노드 없음 (#731)
 */
import type { Metadata } from 'next'
import { PrivacyPolicyView } from '@bconnect/features'

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '품앗이 서비스의 개인정보 처리방침입니다.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <PrivacyPolicyView />
}
