/**
 * @figma-scaffold 원클릭 조회 PoC — 백엔드 검증용, 디자인 미정
 */
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCompanyInfo } from './_clients/fetch-business'
import { formatRegistrationNumber, isValidRegistrationNumber } from '@bconnect/config/biz-number'
import { SearchBar } from './_components/SearchBar'
import { TipBanner } from './_components/TipBanner'
import { CompanyHeader } from './_components/CompanyHeader'
import { SummarySection } from './_components/SummarySection'
import { DetailSection } from './_components/DetailSection'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams

  if (!q || !isValidRegistrationNumber(q)) {
    return {
      title: '원클릭 조회 - Morton',
      description: '사업자등록번호로 면허, 임금체불, 보험 현황을 한번에 조회하세요.',
    }
  }

  return {
    title: `사업자 조회 ${formatRegistrationNumber(q)} - Morton`,
    description: '사업자등록번호로 면허, 임금체불, 보험 현황을 한번에 조회하세요.',
  }
}

function CompanyHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-baseline gap-3">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

async function CompanyHeaderLoader({ registrationNumber }: { registrationNumber: string }) {
  const company = await getCompanyInfo(registrationNumber)
  return <CompanyHeader company={company} />
}

export default async function OneClickPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const isValid = q ? isValidRegistrationNumber(q) : false

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <h1 className="text-sb-24 text-gray-900">원클릭 조회</h1>

        <SearchBar defaultValue={q} />
        <TipBanner />

        {q && !isValid && (
          <p className="text-r-14 text-destructive">
            올바른 사업자등록번호 형식이 아닙니다. (10자리 숫자)
          </p>
        )}

        {isValid && (
          <>
            <Suspense fallback={<CompanyHeaderSkeleton />}>
              <CompanyHeaderLoader registrationNumber={q!} />
            </Suspense>
            <SummarySection registrationNumber={q!} />
            <DetailSection registrationNumber={q!} />
          </>
        )}
      </main>
    </div>
  )
}
