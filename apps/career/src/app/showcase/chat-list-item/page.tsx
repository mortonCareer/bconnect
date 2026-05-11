/**
 * @figma-scaffold 쇼케이스 — ChatListItem 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { ChatListItem } from '@bconnect/ui'

export default function ChatListItemShowcasePage() {
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ChatListItem</h1>
          <p className="mb-8 text-gray-600">채팅 목록 아이템 컴포넌트 (Morton 디자인 시스템)</p>

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
                      <code className="rounded bg-gray-100 px-1">variant=&quot;default&quot;</code>
                    </td>
                    <td className="p-3">프로필+태그+미리보기+chevron</td>
                  </tr>
                  <tr>
                    <td className="p-3">뱃지</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;badge&quot;</code>
                    </td>
                    <td className="p-3">시간+읽지않은수 뱃지 포함</td>
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
                <p className="mb-3 text-sm font-medium text-gray-500">Default (chevron)</p>
                <div className="w-[393px]">
                  <ChatListItem
                    variant="default"
                    name="이송목"
                    location="경기도"
                    jobType="준기공"
                    specialty="도배"
                    lastMessage="안녕하세요, 도배 준기공 이송목입니다."
                  />
                </div>
              </div>
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Badge (시간+뱃지)</p>
                <div className="w-[393px]">
                  <ChatListItem
                    variant="badge"
                    name="이송목"
                    location="경기도"
                    jobType="준기공"
                    specialty="도배"
                    lastMessage="안녕하세요. 궁금한 점이 있어 연락드립니다."
                    timestamp="6시간 전"
                    unreadCount={4}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* List Example */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">목록 예시</h2>
            <div className="rounded-lg border p-6">
              <div className="w-[393px]">
                <ChatListItem
                  variant="badge"
                  name="이송목"
                  location="경기도"
                  jobType="준기공"
                  specialty="도배"
                  lastMessage="안녕하세요. 궁금한 점이 있어 연락드립니다."
                  timestamp="6시간 전"
                  unreadCount={4}
                />
                <ChatListItem
                  variant="badge"
                  name="김철수"
                  location="서울"
                  jobType="기공"
                  specialty="타일"
                  lastMessage="네, 가능합니다."
                  timestamp="1일 전"
                  unreadCount={1}
                />
                <ChatListItem
                  variant="badge"
                  name="박민수"
                  jobType="준기공"
                  lastMessage="감사합니다!"
                  timestamp="3일 전"
                />
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { ChatListItem } from '@bconnect/ui'

// Default (chevron)
<ChatListItem
  name="이송목"
  location="경기도"
  jobType="준기공"
  specialty="도배"
  lastMessage="안녕하세요, 도배 준기공 이송목입니다."
/>

// Badge (시간+뱃지)
<ChatListItem
  variant="badge"
  name="이송목"
  location="경기도"
  jobType="준기공"
  specialty="도배"
  lastMessage="안녕하세요. 궁금한 점이 있어 연락드립니다."
  timestamp="6시간 전"
  unreadCount={4}
/>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
