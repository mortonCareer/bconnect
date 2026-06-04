/**
 * @figma-scaffold 쇼케이스 — SkillTag 컴포넌트 검수용, 디자인 N/A (#383)
 */
'use client'

import Link from 'next/link'
import { SkillTag, ChevronIcon } from '@bconnect/ui'

export default function SkillTagDetailPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">SkillTag</h1>
          <p className="mb-8 text-gray-600">
            공종 태그. Figma node 1504:12099(선택) / 12102(미선택) — rounded-full pill, M12
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Variants</h2>
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">
                  selected — primary 배경/테두리/텍스트
                </p>
                <div className="flex flex-wrap gap-2">
                  <SkillTag label="도배" selected />
                  <SkillTag label="타일" selected />
                  <SkillTag label="목공" selected />
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">
                  미선택 (기본) — white 배경 + gray 테두리/텍스트
                </p>
                <div className="flex flex-wrap gap-2">
                  <SkillTag label="도배" />
                  <SkillTag label="타일" />
                  <SkillTag label="목공" />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { SkillTag } from '@bconnect/ui'

<SkillTag label="도배" selected={trade === primaryTrade} />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
