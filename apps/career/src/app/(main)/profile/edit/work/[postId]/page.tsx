'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@morton/ui'

// TODO: Post + Task API 연동 (#197)
const MOCK_WORK = {
  image: '/placeholder-post.svg',
  company: '서정건축',
  period: '12.25 ~ 12.26 (총 2일 소요)',
  address: '경기도 수원시 율전로 00번길 00-00, 000호',
  trade: '타일',
  description:
    '신축 아파트 32평 욕실 2개소 타일 시공을 진행했습니다.\n\n벽면은 600×300 수입 포세린, 바닥은 300×300 논슬립 타일로 시공했고, 헤링본 패턴 포인트 벽 작업까지 담당했습니다.\n\n시공 완료 후 현장 감리자로부터 "줄눈 간격이 균일하고 마감이 깔끔하다"는 평가를 받았습니다.',
}

export default function EditWorkPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const _postId = Number(params.postId)

  const [company, setCompany] = useState(MOCK_WORK.company)
  const [period, setPeriod] = useState(MOCK_WORK.period)
  const [address, setAddress] = useState(MOCK_WORK.address)
  const [trade, setTrade] = useState(MOCK_WORK.trade)
  const [description, setDescription] = useState(MOCK_WORK.description)

  const handleSave = () => {
    // TODO: Post + Task 수정 API 연동
    router.back()
  }

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="작업물"
        actionLabel="저장"
        onAction={handleSave}
        showAction
        onBack={() => router.back()}
      />

      {/* 이미지 영역 */}
      <div className="mx-4 mt-4 flex h-[200px] items-center justify-center rounded-lg bg-morton-gray-100">
        <span className="text-r-12 text-morton-gray-500">이미지</span>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-col gap-3 px-4 pt-6">
        <div className="flex items-start gap-4">
          <span className="w-16 shrink-0 text-sb-14 text-morton-gray-900">업체명</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 text-r-14 text-morton-gray-900 outline-none"
          />
        </div>
        <div className="flex items-start gap-4">
          <span className="w-16 shrink-0 text-sb-14 text-morton-gray-900">시공기간</span>
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex-1 text-r-14 text-morton-gray-900 outline-none"
          />
        </div>
        <div className="flex items-start gap-4">
          <span className="w-16 shrink-0 text-sb-14 text-morton-gray-900">현장주소</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 text-r-14 text-morton-gray-900 outline-none"
          />
        </div>
        <div className="flex items-start gap-4">
          <span className="w-16 shrink-0 text-sb-14 text-morton-gray-900">시공분야</span>
          <input
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="flex-1 text-r-14 text-morton-gray-900 outline-none"
          />
        </div>
      </div>

      {/* 설명 */}
      <div className="px-4 pt-6">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[200px] w-full resize-none text-r-14 leading-[22.4px] text-morton-gray-900 outline-none placeholder:text-morton-gray-500"
        />
      </div>
    </div>
  )
}
