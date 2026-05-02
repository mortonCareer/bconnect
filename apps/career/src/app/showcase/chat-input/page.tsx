/**
 * @figma-scaffold 쇼케이스 — ChatInput 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { ChatInput } from '@morton/ui'

export default function ChatInputShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ChatInput</h1>
          <p className="mb-8 text-gray-600">채팅 입력 컴포넌트 (Morton 디자인 시스템)</p>

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
                      <code className="rounded bg-gray-100 px-1">disabled=false</code>
                    </td>
                    <td className="p-3">텍스트 입력됨, 파란 전송버튼</td>
                  </tr>
                  <tr>
                    <td className="p-3">비활성</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">disabled=true</code>
                    </td>
                    <td className="p-3">placeholder, 회색 전송버튼</td>
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
                <p className="mb-3 text-sm font-medium text-gray-500">Default (텍스트 입력됨)</p>
                <ChatInput value="안녕하세요." onSend={() => alert('전송!')} />
              </div>
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Disabled (비활성)</p>
                <ChatInput disabled />
              </div>
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Empty (입력 전)</p>
                <ChatInput />
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { ChatInput } from '@morton/ui'

// 기본 사용
<ChatInput
  value={message}
  onChange={setMessage}
  onSend={handleSend}
/>

// 비활성 상태
<ChatInput disabled />

// placeholder 커스텀
<ChatInput placeholder="메시지를 작성하세요." />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
