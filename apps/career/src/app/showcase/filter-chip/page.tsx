/**
 * @figma-scaffold 쇼케이스 — FilterChip 컴포넌트 검수용, 디자인 N/A (#383)
 */
'use client'

import Link from 'next/link'
import { FilterChip, ChevronIcon } from '@bconnect/ui'

export default function FilterChipDetailPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">FilterChip</h1>
          <p className="mb-8 text-gray-600">
            활성 필터 칩 (제거 가능). Figma node 1503:12064 — secondary 배경 + primary 텍스트, M14,
            X 아이콘
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">기본</h2>
            <div className="rounded-lg border p-6">
              <p className="mb-3 text-sm text-gray-500">칩을 클릭하면 onRemove 호출</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="서울" onRemove={() => alert('서울 제거')} />
                <FilterChip label="경기" onRemove={() => alert('경기 제거')} />
                <FilterChip label="인천" onRemove={() => alert('인천 제거')} />
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">줄바꿈 (flex-wrap)</h2>
            <div className="rounded-lg border p-6">
              <p className="mb-3 text-sm text-gray-500">
                좁은 폭에서 칩이 shrink 되지 않고(shrink-0) 다음 줄로 넘어감
              </p>
              <div className="flex max-w-xs flex-wrap gap-2">
                {['서울', '경기', '인천', '부산', '대구', '광주', '대전'].map((r) => (
                  <FilterChip key={r} label={r} onRemove={() => undefined} />
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { FilterChip } from '@bconnect/ui'

<FilterChip label="서울" onRemove={() => removeRegion('서울')} />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
