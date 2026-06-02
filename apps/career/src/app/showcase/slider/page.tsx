/**
 * @figma-scaffold 쇼케이스 — Slider 컴포넌트 검수용 (#427)
 */
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Slider } from '@bconnect/ui'

export default function SliderDetailPage() {
  const [range, setRange] = useState([0, 6])
  const [single, setSingle] = useState([3])

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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Slider</h1>
          <p className="mb-8 text-gray-600">
            범위(dual-handle) 슬라이더 — shadcn/radix Slider 구조 기반. 경력 입력 등 범위 선택에
            사용.
          </p>

          {/* Figma Design Reference */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Figma 디자인 매핑</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Figma 요소</th>
                    <th className="p-3 text-left font-medium text-gray-600">구현</th>
                    <th className="p-3 text-left font-medium text-gray-600">토큰</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">트랙 (8px)</td>
                    <td className="p-3">Slider.Track</td>
                    <td className="p-3">bg-gray-100 (#F4F4F4)</td>
                  </tr>
                  <tr>
                    <td className="p-3">step dot ×11</td>
                    <td className="p-3">트랙 위 justify-between 오버레이</td>
                    <td className="p-3">bg-gray-300 (#E5E5E5)</td>
                  </tr>
                  <tr>
                    <td className="p-3">채움</td>
                    <td className="p-3">Slider.Range</td>
                    <td className="p-3">bg-primary (#386DFF)</td>
                  </tr>
                  <tr>
                    <td className="p-3">핸들 (12px, border-3)</td>
                    <td className="p-3">Slider.Thumb</td>
                    <td className="p-3">bg-white border-primary</td>
                  </tr>
                  <tr>
                    <td className="p-3">&quot;N년&quot; 배지</td>
                    <td className="p-3">Thumb 내부 formatLabel</td>
                    <td className="p-3">bg-secondary text-primary (#EAEFFF)</td>
                  </tr>
                  <tr>
                    <td className="p-3">&quot;0&quot;/&quot;10&quot; 끝 라벨</td>
                    <td className="p-3">showEndLabels</td>
                    <td className="p-3">text-gray-500 (#A5A5A5)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 경력 범위 (primary use case) */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">범위 선택 (경력 0~10년)</h2>
            <div className="rounded-lg border p-6">
              <Slider
                value={range}
                onValueChange={setRange}
                min={0}
                max={10}
                formatLabel={(n) => `${n}년`}
                thumbLabels={['최소 경력', '최대 경력']}
              />
              <p className="mt-4 text-sm text-gray-500">
                선택값: {range[0]}년 ~ {range[1]}년
              </p>
            </div>
          </section>

          {/* 단일 값 */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">단일 값</h2>
            <div className="rounded-lg border p-6">
              <Slider
                value={single}
                onValueChange={setSingle}
                min={0}
                max={10}
                formatLabel={(n) => `${n}년`}
                thumbLabels={['경력']}
              />
              <p className="mt-4 text-sm text-gray-500">선택값: {single[0]}년</p>
            </div>
          </section>

          {/* step dot / 끝 라벨 없이 */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              장식 없이 (배지·dot·라벨 off)
            </h2>
            <div className="rounded-lg border p-6">
              <Slider defaultValue={[4]} min={0} max={10} showSteps={false} showEndLabels={false} />
            </div>
          </section>

          {/* 비활성 */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Disabled</h2>
            <div className="rounded-lg border p-6">
              <Slider
                defaultValue={[2, 8]}
                min={0}
                max={10}
                formatLabel={(n) => `${n}년`}
                disabled
              />
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Slider } from '@bconnect/ui'

const [range, setRange] = useState([0, 6])

// 범위 (dual-handle) — value 배열 길이만큼 핸들 렌더
<Slider
  value={range}
  onValueChange={setRange}
  min={0}
  max={10}
  formatLabel={(n) => \`\${n}년\`}      // 핸들 위 배지 (미지정 시 배지 없음)
  thumbLabels={['최소 경력', '최대 경력']}  // a11y
/>

// 단일 값
<Slider value={[3]} onValueChange={...} min={0} max={10} />

// 장식 off
<Slider defaultValue={[4]} showSteps={false} showEndLabels={false} />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
