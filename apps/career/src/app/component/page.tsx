'use client'

import { Input } from '@morton/ui'

export default function ComponentPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Component Preview</h1>

      {/* Input 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Input</h2>

        <div className="mb-6 max-w-md space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Default</h3>
            <Input type="text" placeholder="이메일을 입력하세요" />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Disabled</h3>
            <Input type="text" placeholder="비활성화됨" disabled />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">File Input</h3>
            <Input type="file" />
          </div>
        </div>
      </section>
    </div>
  )
}
