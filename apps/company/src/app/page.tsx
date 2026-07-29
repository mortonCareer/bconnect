/**
 * @figma-scaffold 업체용 랜딩 — Figma Sites(디자인 노드 아님)를 브랜드 UI로 재구축. 원본: https://www.figma.com/site/MNz7F2h1c5CaCHG4OeGB4g
 */
import type { Metadata } from 'next'
import { LandingNav } from './_components/LandingNav'
import { HeroSection } from './_components/HeroSection'
import { ProblemSection } from './_components/ProblemSection'
import { FeaturesSection } from './_components/FeaturesSection'
import { AppScheduleSection } from './_components/AppScheduleSection'
import { ReviewsSection } from './_components/ReviewsSection'
import { InsightsSection } from './_components/InsightsSection'
import { FaqSection } from './_components/FaqSection'
import { CtaSection } from './_components/CtaSection'
import { LandingFooter } from './_components/LandingFooter'

export const metadata: Metadata = {
  title: '인테리어 사업자를 위한 공정표 기반 하도급 플랫폼',
  description:
    '공정표 기반으로 기술자 섭외부터 정산까지 한 번에. 인테리어 사업자를 위한 하도급 관리 플랫폼, 품앗이.',
  alternates: { canonical: '/' },
  openGraph: {
    title: '품앗이 — 인테리어 사업자를 위한 공정표 기반 하도급 플랫폼',
    description: '공정표 기반으로 기술자 섭외부터 정산까지 한 번에.',
    url: '/',
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
        <AppScheduleSection />
        <ReviewsSection />
        <InsightsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  )
}
