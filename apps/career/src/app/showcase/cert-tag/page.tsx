/**
 * @figma-scaffold 쇼케이스 — CertTag 컴포넌트 검수용, 디자인 N/A (#383)
 */
'use client'

import Link from 'next/link'
import { CertTag, ChevronIcon } from '@bconnect/ui'

export default function CertTagDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          <ChevronIcon direction="left" size={16} className="mr-1" />
          컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">CertTag</h1>
          <p className="mb-8 text-gray-600">
            인증/자격 태그. Figma node 1504:12113 — gray-100 배경, gray-300 테두리, R14, rounded-7
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">기본</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-2">
                <CertTag label="본인인증" />
                <CertTag label="개인사업자" />
                <CertTag label="경력증명(19.01~)" />
                <CertTag label="자격증" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { CertTag } from '@bconnect/ui'

<CertTag label="본인인증" />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
