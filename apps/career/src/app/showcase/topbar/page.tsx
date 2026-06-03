/**
 * @figma-scaffold 쇼케이스 — TopBar 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import { TopBar, ChevronIcon } from '@bconnect/ui'

export default function TopBarDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          <ChevronIcon direction="left" size={16} className="mr-1" />
          컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">TopBar</h1>
          <p className="mb-8 text-gray-600">Morton 디자인 시스템 상단 네비게이션 바 컴포넌트</p>

          {/* Figma Design Reference */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Figma 디자인 매핑</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Figma Variant</th>
                    <th className="p-3 text-left font-medium text-gray-600">Prop</th>
                    <th className="p-3 text-left font-medium text-gray-600">구성요소</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">진행바</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;progress&quot;</code>
                    </td>
                    <td className="p-3">뒤로가기 + 진행바</td>
                  </tr>
                  <tr>
                    <td className="p-3">기본</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;default&quot;</code>
                    </td>
                    <td className="p-3">뒤로가기 + 제목 + 액션 버튼</td>
                  </tr>
                  <tr>
                    <td className="p-3">home</td>
                    <td className="p-3">
                      <code className="rounded bg-gray-100 px-1">variant=&quot;home&quot;</code>
                    </td>
                    <td className="p-3">필터 아이콘 + 채팅 아이콘</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Progress Variant */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Progress Variant (진행바)</h2>
            <p className="mb-4 text-sm text-gray-600">
              회원가입 플로우에서 사용되는 진행 표시 헤더
            </p>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">Step 1/3</p>
                <TopBar
                  variant="progress"
                  step={1}
                  totalSteps={3}
                  onBack={() => alert('뒤로가기')}
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">Step 2/3</p>
                <TopBar
                  variant="progress"
                  step={2}
                  totalSteps={3}
                  onBack={() => alert('뒤로가기')}
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">Step 3/3</p>
                <TopBar
                  variant="progress"
                  step={3}
                  totalSteps={3}
                  onBack={() => alert('뒤로가기')}
                />
              </div>
            </div>
          </section>

          {/* Default Variant */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Default Variant (기본)</h2>
            <p className="mb-4 text-sm text-gray-600">제목과 액션 버튼이 있는 일반 페이지 헤더</p>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">
                  기본 (액션 버튼 있음)
                </p>
                <TopBar
                  variant="default"
                  title="회원가입"
                  actionLabel="완료"
                  onBack={() => alert('뒤로가기')}
                  onAction={() => alert('완료!')}
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">액션 버튼 숨김</p>
                <TopBar
                  variant="default"
                  title="프로필 설정"
                  showAction={false}
                  onBack={() => alert('뒤로가기')}
                />
              </div>
            </div>
          </section>

          {/* Home Variant */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Home Variant (홈)</h2>
            <p className="mb-4 text-sm text-gray-600">홈 화면 헤더 - 필터와 채팅 아이콘</p>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">알림 없음</p>
                <TopBar
                  variant="home"
                  onFilter={() => alert('필터')}
                  onChat={() => alert('채팅')}
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">알림 4개</p>
                <TopBar
                  variant="home"
                  chatCount={4}
                  onFilter={() => alert('필터')}
                  onChat={() => alert('채팅')}
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <p className="bg-gray-50 p-3 text-sm font-medium text-gray-500">알림 99+개</p>
                <TopBar
                  variant="home"
                  chatCount={150}
                  onFilter={() => alert('필터')}
                  onChat={() => alert('채팅')}
                />
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { TopBar } from '@bconnect/ui'

// Progress variant - 회원가입 플로우
<TopBar
  variant="progress"
  step={1}
  totalSteps={3}
  onBack={() => router.back()}
/>

// Default variant - 일반 페이지 헤더
<TopBar
  variant="default"
  title="회원가입"
  actionLabel="완료"
  onBack={() => router.back()}
  onAction={() => handleComplete()}
/>

// Home variant - 홈 화면 헤더
<TopBar
  variant="home"
  chatCount={4}
  onFilter={() => openFilter()}
  onChat={() => openChat()}
/>`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
