'use client'

import { Button } from '@morton/ui'

export default function ComponentPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Component Preview</h1>

      {/* Button 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Button (shadcn/ui)</h2>

        {/* Variants */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">X</Button>
          </div>
        </div>

        {/* Disabled */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Disabled</h3>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Default Disabled</Button>
            <Button variant="secondary" disabled>
              Secondary Disabled
            </Button>
            <Button variant="destructive" disabled>
              Destructive Disabled
            </Button>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Usage Example</h3>
          <div className="flex max-w-md gap-3">
            <Button variant="outline" className="flex-1">
              취소
            </Button>
            <Button className="flex-1">확인</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
