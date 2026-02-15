# 쇼케이스 페이지 템플릿

컴포넌트 쇼케이스 페이지 생성 패턴입니다.

## 사용 시점

- 새 컴포넌트 생성 후 쇼케이스에 등록 시
- 컴포넌트 문서화 및 데모 페이지 필요 시

---

## 파일 구조

```text
apps/career/src/app/showcase/
├── page.tsx              # 컴포넌트 목록 페이지
├── button/
│   └── page.tsx          # Button 상세 페이지
├── tag/
│   └── page.tsx          # Tag 상세 페이지
└── [component]/
    └── page.tsx          # 새 컴포넌트 상세 페이지
```

---

## 1. 목록 페이지 업데이트

### 파일 위치

```text
apps/career/src/app/showcase/page.tsx
```

### 컴포넌트 배열에 추가

```typescript
const components: ComponentPreview[] = [
  // 기존 컴포넌트들...
  {
    name: 'NewComponent',
    description: 'NewComponent 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/new-component',
    preview: (
      <NewComponent variant="primary">예시</NewComponent>
    ),
  },
]
```

### ComponentPreview 인터페이스

```typescript
interface ComponentPreview {
  name: string // 컴포넌트 이름 (PascalCase)
  description: string // 간단한 설명
  href: string // 상세 페이지 경로 (/showcase/[slug])
  preview: React.ReactNode // 미리보기 렌더링
}
```

---

## 2. 상세 페이지 생성

### 파일 생성

```text
apps/career/src/app/showcase/[component-slug]/page.tsx
```

### 상세 페이지 템플릿

```typescript
'use client'

import Link from 'next/link'
import { ComponentName } from '@morton/ui'

export default function ComponentNameDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-[#386DFF]"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ComponentName</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 컴포넌트</p>

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
                      <code className="rounded bg-gray-100 px-1">variant="default"</code>
                    </td>
                    <td className="p-3">스타일 설명</td>
                  </tr>
                  {/* 추가 variants... */}
                </tbody>
              </table>
            </div>
          </section>

          {/* Variants */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Variants</h2>
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Default</p>
                <ComponentName variant="default">예시</ComponentName>
              </div>
              {/* 추가 variants... */}
            </div>
          </section>

          {/* Sizes (해당되는 경우) */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Sizes</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap items-center gap-4">
                <ComponentName size="sm">Small</ComponentName>
                <ComponentName size="default">Default</ComponentName>
                <ComponentName size="lg">Large</ComponentName>
              </div>
            </div>
          </section>

          {/* Interactive */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Interactive</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-4">
                <ComponentName onClick={() => alert('Clicked!')}>
                  클릭
                </ComponentName>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { ComponentName } from '@morton/ui'

// Default
<ComponentName>텍스트</ComponentName>

// With variant
<ComponentName variant="primary">텍스트</ComponentName>

// With size
<ComponentName size="sm">텍스트</ComponentName>

// With onClick
<ComponentName onClick={() => {}}>클릭</ComponentName>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. 섹션 가이드

### Figma 디자인 매핑 테이블

Figma variant 이름과 코드 prop의 대응을 보여줍니다.

| 항목          | 설명                            |
| ------------- | ------------------------------- |
| Figma Variant | Figma에서 사용하는 variant 이름 |
| Prop          | 코드에서 사용하는 prop 값       |
| 스타일        | 시각적 특징 설명                |

### Variants 섹션

각 variant를 개별 카드로 보여줍니다.

```typescript
<div className="space-y-6">
  {['default', 'primary', 'secondary'].map((variant) => (
    <div key={variant} className="rounded-lg border p-6">
      <p className="mb-3 text-sm font-medium text-gray-500 capitalize">{variant}</p>
      <ComponentName variant={variant}>예시</ComponentName>
    </div>
  ))}
</div>
```

### Sizes 섹션

모든 크기를 나란히 보여줍니다.

```typescript
<div className="flex flex-wrap items-center gap-4">
  <ComponentName size="sm">Small</ComponentName>
  <ComponentName size="default">Default</ComponentName>
  <ComponentName size="lg">Large</ComponentName>
</div>
```

### Usage 코드 블록

```typescript
<pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
  {`import { ComponentName } from '@morton/ui'

<ComponentName>텍스트</ComponentName>`}
</pre>
```

---

## 4. 스타일 가이드

### 공통 클래스

```text
페이지 배경: bg-gray-50
컨텐츠 영역: bg-white rounded-xl shadow-sm p-8
섹션 제목: text-xl font-semibold text-gray-800 mb-4
섹션 간격: mb-12
미리보기 박스: rounded-lg border p-6
```

### 브랜드 색상

```text
Primary: #386DFF
Text: gray-900, gray-600, gray-500
Border: border-gray-200
```

---

## 5. import 규칙

```typescript
// 컴포넌트
import { ComponentName } from '@morton/ui'

// Next.js
import Link from 'next/link'

// 아이콘 (필요시)
import { XIcon, CheckIcon } from '@morton/ui/icons'
```

---

## 참조

- 목록 페이지: `apps/career/src/app/showcase/page.tsx`
- 상세 페이지 예시: `apps/career/src/app/showcase/button/page.tsx`
- 컴포넌트 경로: `packages/ui/src/components/ui/`
