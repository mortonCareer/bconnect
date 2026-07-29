/**
 * @figma-scaffold 기술자용 랜딩 — Figma Sites(디자인 노드 아님)를 브랜드 UI로 재구축. 원본: https://www.figma.com/site/aYOEDx8AXyQ6i6PcR2f1LM
 */
import type { Metadata } from 'next'
import { AppPreviewSection } from './_components/AppPreviewSection'
import { CtaSection } from './_components/CtaSection'
import { FaqSection } from './_components/FaqSection'
import { FeaturesSection } from './_components/FeaturesSection'
import { HeroSection } from './_components/HeroSection'
import { InsightsSection } from './_components/InsightsSection'
import { LandingFooter } from './_components/LandingFooter'
import { LandingNav } from './_components/LandingNav'
import { ProblemSection } from './_components/ProblemSection'
import { ReviewsSection } from './_components/ReviewsSection'

export const metadata: Metadata = {
  title: '인테리어 기술자를 위한 캘린더 기반 하도급 플랫폼',
  description:
    '일정 관리부터 대금 수취까지, 품앗이가 함께합니다. 팀 일정 공유, 투명한 정산, 나만의 스펙, 전국 일자리 공고를 한 곳에서.',
  alternates: { canonical: '/career' },
  openGraph: {
    title: '품앗이 — 인테리어 기술자를 위한 캘린더 기반 하도급 플랫폼',
    description: '일정 관리부터 대금 수취까지, 품앗이가 함께합니다.',
    url: '/career',
  },
}

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main className="bg-white">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <AppPreviewSection />
        <ReviewsSection />
        <InsightsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  )
}
