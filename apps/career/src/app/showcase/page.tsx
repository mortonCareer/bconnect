'use client'

import Link from 'next/link'
import { Button, Tag, TopBar } from '@morton/ui'

interface ComponentPreview {
  name: string
  description: string
  href: string
  preview: React.ReactNode
}

const components: ComponentPreview[] = [
  {
    name: 'Button',
    description: '버튼 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/button',
    preview: (
      <Button variant="primary" size="sm">
        다음
      </Button>
    ),
  },
  {
    name: 'Tag',
    description: '태그 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/tag',
    preview: <Tag variant="selected">도배</Tag>,
  },
  {
    name: 'TopBar',
    description: '상단 네비게이션 바 (진행바, 기본, 홈)',
    href: '/showcase/topbar',
    preview: (
      <div className="w-full">
        <TopBar variant="progress" step={2} totalSteps={3} />
      </div>
    ),
  },
]

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">컴포넌트 라이브러리</h1>
          <p className="mt-2 text-gray-600">Morton 디자인 시스템 컴포넌트 미리보기</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Link
              key={component.name}
              href={component.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#386DFF] hover:shadow-md"
            >
              {/* Preview Area */}
              <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gray-50">
                {component.preview}
              </div>

              {/* Component Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#386DFF]">
                  {component.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{component.description}</p>
              </div>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-[#386DFF]">
                <span>상세보기</span>
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
