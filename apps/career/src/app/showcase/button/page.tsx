/**
 * @figma-scaffold 쇼케이스 — Button 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { Button, ChevronLeftIcon } from '@bconnect/ui'

export default function ButtonDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          <ChevronLeftIcon size={16} className="mr-1" />
          컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Button</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 버튼 컴포넌트</p>

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
                    <td className="p-3">활성</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;primary&quot;</code>
                    </td>
                    <td className="p-3">파란색 배경 (#386DFF), 흰색 텍스트</td>
                  </tr>
                  <tr>
                    <td className="p-3">비활성</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">
                        variant=&quot;secondary&quot;
                      </code>
                    </td>
                    <td className="p-3">회색 배경 (#F4F4F4), 회색 텍스트</td>
                  </tr>
                  <tr>
                    <td className="p-3">활성_stroke</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;outline&quot;</code>
                    </td>
                    <td className="p-3">파란색 테두리, 파란색 텍스트</td>
                  </tr>
                  <tr>
                    <td className="p-3">비활성_stroke</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;ghost&quot;</code>
                    </td>
                    <td className="p-3">회색 테두리, 회색 텍스트</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Variants - Default Size */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Variants (Default Size: 360x50)
            </h2>
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Primary - 활성</p>
                <Button variant="primary" size="default">
                  다음
                </Button>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Secondary - 비활성</p>
                <Button variant="secondary" size="default">
                  다음
                </Button>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Outline - 활성_stroke</p>
                <Button variant="outline" size="default">
                  다음
                </Button>
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Ghost - 비활성_stroke</p>
                <Button variant="ghost" size="default">
                  다음
                </Button>
              </div>
            </div>
          </section>

          {/* Variants - Small Size */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Variants (Small Size: 206x40)
            </h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm">
                  다음
                </Button>
                <Button variant="secondary" size="sm">
                  다음
                </Button>
                <Button variant="outline" size="sm">
                  다음
                </Button>
                <Button variant="ghost" size="sm">
                  다음
                </Button>
              </div>
            </div>
          </section>

          {/* Full Width */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Full Width</h2>
            <div className="space-y-4 rounded-lg border p-6">
              <Button variant="primary" size="full">
                전체 너비 버튼
              </Button>
              <Button variant="outline" size="full">
                전체 너비 아웃라인
              </Button>
            </div>
          </section>

          {/* Interactive */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Interactive</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm" onClick={() => alert('Primary!')}>
                  클릭
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert('Outline!')}>
                  클릭
                </Button>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Button } from '@bconnect/ui'

// Primary (활성)
<Button variant="primary">다음</Button>

// Secondary (비활성)
<Button variant="secondary">다음</Button>

// Outline (활성_stroke)
<Button variant="outline">다음</Button>

// Ghost (비활성_stroke)
<Button variant="ghost">다음</Button>

// Small size
<Button variant="primary" size="sm">다음</Button>

// Full width
<Button variant="primary" size="full">다음</Button>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
