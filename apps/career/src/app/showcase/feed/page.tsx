'use client'

import Link from 'next/link'
import { Feed } from '@morton/ui'

export default function FeedDetailPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Feed</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 피드 컴포넌트</p>

          {/* Figma Design Reference */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Figma 디자인 매핑</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Figma Variant</th>
                    <th className="p-3 text-left font-medium text-gray-600">Node ID</th>
                    <th className="p-3 text-left font-medium text-gray-600">설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">접힘 (collapsed)</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">352-2768</code>
                    </td>
                    <td className="p-3">본문 1줄 + 더보기 버튼</td>
                  </tr>
                  <tr>
                    <td className="p-3">펼침 (expanded)</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">398-3264</code>
                    </td>
                    <td className="p-3">전체 본문 + 접기 버튼</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Variants */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Variants</h2>
            <div className="space-y-6">
              {/* Collapsed State */}
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Collapsed - 접힌 상태</p>
                <div className="mx-auto max-w-md">
                  <Feed
                    profile={{
                      image:
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
                      name: '이송목',
                      location: '경기도',
                      jobType: '준기공',
                      specialty: '도배',
                      bio: '안녕하세요, 도배 준기공 이송목입니다.',
                    }}
                    content={{
                      image:
                        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
                      company: '서정 건축',
                      duration: '4일 소요',
                      timestamp: '3일 전',
                      description:
                        '골프장 전원주택 도배 시공을 진행하였습니다. 골프장 전원주택 도배 시공을 진행하였습니다.원주택 도배 시공을 ',
                    }}
                    defaultExpanded={false}
                  />
                </div>
              </div>

              {/* Expanded State */}
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">Expanded - 펼쳐진 상태</p>
                <div className="mx-auto max-w-md">
                  <Feed
                    profile={{
                      image:
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
                      name: '이송목',
                      location: '경기도',
                      jobType: '준기공',
                      specialty: '도배',
                      bio: '안녕하세요, 도배 준기공 이송목입니다.',
                    }}
                    content={{
                      image:
                        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
                      company: '서정 건축',
                      duration: '4일 소요',
                      timestamp: '3일 전',
                      description:
                        '골프장 전원주택 도배 시공을 진행하였습니다. 골프장 전원주택 도배 시공을 진행하였습니다.원주택 도배 시공을 ',
                    }}
                    defaultExpanded={true}
                  />
                </div>
              </div>

              {/* Interactive Toggle */}
              <div className="rounded-lg border p-6">
                <p className="mb-3 text-sm font-medium text-gray-500">
                  Interactive - 더보기/접기 토글
                </p>
                <div className="mx-auto max-w-md">
                  <Feed
                    profile={{
                      image:
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
                      name: '김철수',
                      location: '서울',
                      jobType: '기능공',
                      specialty: '타일',
                      bio: '타일 시공 전문가입니다.',
                    }}
                    content={{
                      image:
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
                      company: '현대 건설',
                      duration: '7일 소요',
                      timestamp: '1주일 전',
                      description:
                        '신축 아파트 욕실 타일 시공을 완료했습니다. 고급 이탈리아산 대리석 타일을 사용하여 프리미엄 마감을 진행하였으며, 방수 작업도 완벽하게 처리했습니다.',
                    }}
                    onToggle={(expanded) => {
                      console.log('Toggle state:', expanded)
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Props */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Props</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Prop</th>
                    <th className="p-3 text-left font-medium text-gray-600">Type</th>
                    <th className="p-3 text-left font-medium text-gray-600">Default</th>
                    <th className="p-3 text-left font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">profile</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">ProfileInfo</code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">
                      프로필 정보 (image, name, location, jobType, specialty, bio)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">content</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">FeedContent</code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">
                      피드 내용 (image, company, duration, timestamp, description)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">defaultExpanded</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">boolean</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">false</code>
                    </td>
                    <td className="p-3">초기 펼침 상태</td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">onToggle</code>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">
                        (expanded: boolean) =&gt; void
                      </code>
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3">더보기/접기 버튼 클릭 핸들러</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { Feed } from '@morton/ui'

// Basic usage
<Feed
  profile={{
    image: '/profile.jpg',
    name: '이송목',
    location: '경기도',
    jobType: '준기공',
    specialty: '도배',
    bio: '안녕하세요, 도배 준기공 이송목입니다.',
  }}
  content={{
    image: '/work.jpg',
    company: '서정 건축',
    duration: '4일 소요',
    timestamp: '3일 전',
    description: '골프장 전원주택 도배 시공을 진행하였습니다...',
  }}
/>

// With toggle handler
<Feed
  profile={{ ... }}
  content={{ ... }}
  onToggle={(expanded) => {
    console.log('Expanded:', expanded)
  }}
/>

// Initially expanded
<Feed
  profile={{ ... }}
  content={{ ... }}
  defaultExpanded={true}
/>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
