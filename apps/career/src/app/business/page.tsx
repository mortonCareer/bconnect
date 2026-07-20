/**
 * @figma-scaffold 사업자정보 — 법적 고지 static 페이지, 디자인 노드 없음 (#734)
 */
import type { Metadata } from 'next'
import { BusinessInfoView } from '@bconnect/features'

export const metadata: Metadata = {
  title: '사업자정보',
  description: '품앗이 서비스의 사업자정보입니다.',
  alternates: { canonical: '/business' },
}

export default function BusinessPage() {
  return <BusinessInfoView />
}
