/**
 * @figma-scaffold 쇼케이스 — Input 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input, OtpInput } from '@morton/ui'

export default function InputDetailPage() {
  const [inputValue, setInputValue] = useState('')
  const [remainingTime, setRemainingTime] = useState(164)

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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Input</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 텍스트 입력 컴포넌트</p>

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
                    <td className="p-3">입력 전</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;default&quot;</code>
                    </td>
                    <td className="p-3">회색 테두리 (#E5E5E5), placeholder 회색</td>
                  </tr>
                  <tr>
                    <td className="p-3">입력 완료</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;default&quot;</code>
                    </td>
                    <td className="p-3">회색 테두리, 검정 텍스트 (#1B1B1B)</td>
                  </tr>
                  <tr>
                    <td className="p-3">에러</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;error&quot;</code>
                    </td>
                    <td className="p-3">빨간 테두리</td>
                  </tr>
                  <tr>
                    <td className="p-3">에러 + 메시지</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">
                        variant=&quot;error&quot; errorMessage=&quot;...&quot;
                      </code>
                    </td>
                    <td className="p-3">빨간 테두리 + 하단 빨간 텍스트 (#FF4242)</td>
                  </tr>
                  <tr>
                    <td className="p-3">인증번호</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">&lt;OtpInput /&gt;</code>
                    </td>
                    <td className="p-3">타이머 + 재요청 버튼 포함</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Input Variants */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Input Variants</h2>
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Default - 입력 전</p>
                <Input placeholder="내용을 입력해주세요" />
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Default - 입력 완료</p>
                <Input
                  value={inputValue || '이승목'}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Error - 에러 상태</p>
                <Input variant="error" placeholder="이메일을 입력해주세요" />
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">
                  Error + Message - 에러 메시지 포함
                </p>
                <Input
                  variant="error"
                  placeholder="인증번호 입력"
                  errorMessage="올바르지 않은 인증번호입니다."
                />
              </div>

              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Disabled - 비활성화</p>
                <Input disabled placeholder="비활성화됨" />
              </div>
            </div>
          </section>

          {/* OtpInput */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">OtpInput (인증번호)</h2>
            <div className="rounded-lg border p-6">
              <p className="mb-3 text-sm font-medium text-gray-500">타이머 + 재요청 버튼</p>
              <OtpInput
                placeholder="인증번호 입력"
                remainingTime={remainingTime}
                onResend={() => setRemainingTime(180)}
              />
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Input, OtpInput } from '@morton/ui'

// 기본 입력
<Input placeholder="내용을 입력해주세요" />

// 에러 상태
<Input variant="error" placeholder="이메일을 입력해주세요" />

// 에러 상태 + 에러 메시지
<Input variant="error" errorMessage="올바르지 않은 인증번호입니다." />

// 비활성화
<Input disabled placeholder="비활성화됨" />

// OTP 인증번호 입력
<OtpInput
  placeholder="인증번호 입력"
  remainingTime={164}
  onResend={() => console.log('재요청')}
/>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
