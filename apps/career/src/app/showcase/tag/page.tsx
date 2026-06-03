/**
 * @figma-scaffold 쇼케이스 — Tag 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { Tag, ChevronIcon } from '@bconnect/ui'

export default function TagDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          <ChevronIcon direction="left" size={16} className="mr-1" />
          컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Tag</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 태그 컴포넌트</p>

          {/* Figma Design Reference */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Figma 디자인 매핑</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Figma Variant</th>
                    <th className="p-3 text-left font-medium text-gray-600">Prop</th>
                    <th className="p-3 text-left font-medium text-gray-600">스타일</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">기본</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;default&quot;</code>
                    </td>
                    <td className="p-3">회색 테두리 (#E5E5E5), 회색 텍스트 (#A5A5A5)</td>
                  </tr>
                  <tr>
                    <td className="p-3">선택</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;selected&quot;</code>
                    </td>
                    <td className="p-3">파란색 배경 (#EAEFFF), 파란색 테두리/텍스트 (#386DFF)</td>
                  </tr>
                  <tr>
                    <td className="p-3">필터 삭제</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;filter&quot;</code>
                    </td>
                    <td className="p-3">파란색 배경/테두리 + X 아이콘</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Variants */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Variants</h2>
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Default - 기본</p>
                <div className="flex flex-wrap gap-2">
                  <Tag variant="default">도배</Tag>
                  <Tag variant="default">인테리어</Tag>
                  <Tag variant="default">타일</Tag>
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Selected - 선택</p>
                <div className="flex flex-wrap gap-2">
                  <Tag variant="selected">도배</Tag>
                  <Tag variant="selected">인테리어</Tag>
                  <Tag variant="selected">타일</Tag>
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Filter - 필터 삭제</p>
                <div className="flex flex-wrap gap-2">
                  <Tag variant="filter" onRemove={() => alert('도배 삭제')}>
                    도배
                  </Tag>
                  <Tag variant="filter" onRemove={() => alert('인테리어 삭제')}>
                    인테리어
                  </Tag>
                  <Tag variant="filter" onRemove={() => alert('타일 삭제')}>
                    타일
                  </Tag>
                </div>
              </div>
            </div>
          </section>

          {/* Sizes */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Sizes</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="mb-2 text-xs text-gray-500">Default (40px)</p>
                  <Tag variant="selected">도배</Tag>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500">Small (32px)</p>
                  <Tag variant="selected" size="sm">
                    도배
                  </Tag>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Interactive</h2>
            <div className="rounded-lg border p-6">
              <p className="mb-3 text-sm text-gray-500">클릭하여 상호작용 테스트</p>
              <div className="flex flex-wrap gap-2">
                <Tag onClick={() => alert('Default clicked!')}>클릭</Tag>
                <Tag variant="selected" onClick={() => alert('Selected clicked!')}>
                  클릭
                </Tag>
                <Tag variant="filter" onRemove={() => alert('Removed!')}>
                  삭제
                </Tag>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Tag } from '@bconnect/ui'

// Default (기본)
<Tag>도배</Tag>

// Selected (선택)
<Tag variant="selected">도배</Tag>

// Filter (필터 삭제 - X 아이콘 포함)
<Tag variant="filter" onRemove={() => console.log('removed')}>도배</Tag>

// Small size
<Tag variant="selected" size="sm">도배</Tag>

// With click handler
<Tag onClick={() => console.log('clicked')}>클릭</Tag>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
