'use client'

import { Button } from '@morton/ui'

export default function ComponentPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold">Component Preview</h1>

      {/* Button 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Button</h2>

        {/* Variants */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* Full Width */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Full Width</h3>
          <div className="max-w-md">
            <Button fullWidth>Full Width Button</Button>
          </div>
        </div>

        {/* Disabled */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Disabled</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" disabled>
              Primary Disabled
            </Button>
            <Button variant="secondary" disabled>
              Secondary Disabled
            </Button>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Usage Example</h3>
          <div className="flex max-w-md gap-3">
            <Button variant="secondary" className="flex-1">
              취소
            </Button>
            <Button variant="primary" className="flex-1">
              확인
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
