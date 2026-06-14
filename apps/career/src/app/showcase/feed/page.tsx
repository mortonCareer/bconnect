/**
 * @figma-scaffold 쇼케이스 — Feed 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Feed, ChevronIcon, ConfirmDialog } from '@bconnect/ui'

export default function FeedDetailPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Feed</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 피드 컴포넌트</p>

          {/* Figma Design Reference */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Figma 디자인 매핑</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Figma Variant</th>
                    <th className="p-3 text-left font-medium text-gray-600">Node ID</th>
                    <th className="p-3 text-left font-medium text-gray-600">설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">접힘 (collapsed)</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">352-2768</code>
                    </td>
                    <td className="p-3">본문 1줄 + 더보기 버튼</td>
                  </tr>
                  <tr>
                    <td className="p-3">펼침 (expanded)</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">398-3264</code>
                    </td>
                    <td className="p-3">전체 본문 + 접기 버튼</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Variants */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Variants</h2>
            <div className="space-y-6">
              {/* 본문 더보기/접기 + 본인 게시물(canManage) 케밥 → 수정/삭제 드로어 */}
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">
                  본인 게시물 (canManage) - 케밥 → 수정/삭제
                </p>
                <div className="mx-auto max-w-md">
                  <Feed
                    content={{
                      images: [
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
                      ],
                      company: '현대 건설',
                      duration: '7일 소요',
                      timestamp: '1주일 전',
                      description:
                        '신축 아파트 욕실 타일 시공을 완료했습니다. 고급 이탈리아산 대리석 타일을 사용하여 프리미엄 마감을 진행하였으며, 방수 작업도 완벽하게 처리했습니다.',
                    }}
                    canManage
                    editHref="/profile/edit/work/1"
                    onDelete={() => setConfirmOpen(true)}
                  />
                  <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title="게시물을 삭제할까요?"
                    description="삭제한 게시물은 복구할 수 없어요."
                    confirmLabel="삭제"
                    destructive
                    onConfirm={() => setConfirmOpen(false)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Props */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Props</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Prop</th>
                    <th className="p-3 text-left font-medium text-gray-600">Type</th>
                    <th className="p-3 text-left font-medium text-gray-600">Default</th>
                    <th className="p-3 text-left font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">content</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">FeedContent</code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">
                      피드 내용 (image, company, duration, timestamp, description)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">canManage</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">boolean</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">false</code>
                    </td>
                    <td className="p-3">본인 게시물 여부 — true 일 때만 케밥(수정/삭제) 노출</td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">editHref</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">string</code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">케밥 → 수정 이동 href (선언적 링크)</td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">onDelete</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">() =&gt; void</code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">케밥 → 삭제 액션</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Feed } from '@bconnect/ui'

// Basic usage
<Feed
  content={{
    images: ['/work.jpg'],
    company: '서정 건축',
    duration: '4일 소요',
    timestamp: '3일 전',
    description: '골프장 전원주택 도배 시공을 진행하였습니다...',
  }}
  canManage
  editHref="/profile/edit/work/1"
  onDelete={() => setPendingDelete(1)}
/>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
