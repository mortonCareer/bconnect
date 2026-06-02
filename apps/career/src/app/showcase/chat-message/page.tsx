/**
 * @figma-scaffold 쇼케이스 — ChatMessage 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { ChatMessage } from '@bconnect/ui'

export default function ChatMessageDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ChatMessage</h1>
          <p className="mb-8 text-gray-600">채팅 메시지 컴포넌트 (Morton 디자인 시스템)</p>

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
                    <td className="p-3">내 채팅</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;mine&quot;</code>
                    </td>
                    <td className="p-3">파란색 버블, 오른쪽 정렬, 타임스탬프</td>
                  </tr>
                  <tr>
                    <td className="p-3">상대 채팅</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;theirs&quot;</code>
                    </td>
                    <td className="p-3">회색 버블, 프로필+닉네임, 타임스탬프</td>
                  </tr>
                  <tr>
                    <td className="p-3">입력 중</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;typing&quot;</code>
                    </td>
                    <td className="p-3">회색 버블, 프로필+닉네임, 타이핑 인디케이터</td>
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
                <p className="mb-3 text-sm font-medium text-gray-500">Mine (내 채팅)</p>
                <ChatMessage variant="mine" message="안녕하세요." timestamp="오후 2:09" />
              </div>
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Theirs (상대 채팅)</p>
                <ChatMessage
                  variant="theirs"
                  message="네 안녕하세요."
                  timestamp="오후 2:13"
                  nickname="닉네임"
                />
              </div>
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Typing (입력 중)</p>
                <ChatMessage variant="typing" nickname="닉네임" />
              </div>
            </div>
          </section>

          {/* Conversation Example */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">대화 예시</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-col gap-5">
                <ChatMessage variant="mine" message="안녕하세요." timestamp="오후 2:09" />
                <ChatMessage variant="typing" nickname="닉네임" />
                <ChatMessage
                  variant="theirs"
                  message="네 안녕하세요."
                  timestamp="오후 2:13"
                  nickname="닉네임"
                />
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { ChatMessage } from '@bconnect/ui'

// 내 채팅
<ChatMessage variant="mine" message="안녕하세요." timestamp="오후 2:09" />

// 상대 채팅
<ChatMessage
  variant="theirs"
  message="네 안녕하세요."
  timestamp="오후 2:13"
  nickname="닉네임"
  profileImage="/profile.png"
/>

// 입력 중
<ChatMessage variant="typing" nickname="닉네임" profileImage="/profile.png" />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
