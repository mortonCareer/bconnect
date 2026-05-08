/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7873
 */
// TODO: 추천서 API 연동 — 현재 mock 데이터 사용
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tab, TopBar } from '@bconnect/ui'
import { getAvatarUrl } from '@/lib/avatar'

interface Recommendation {
  id: number
  name: string
  trade: string
  role: string
  content: string
  profileImage: string | null
}

const MOCK_RECEIVED: Recommendation[] = [
  {
    id: 1,
    name: '손장수',
    trade: '도배',
    role: '반장',
    content:
      '깔끔하게 도배하는 동료입니다. 함께 오랜 시간 일하면서 성실한 일처리를 보았습니다. 도배 기술자를 찾으신다면, 추천합니다.',
    profileImage: null,
  },
  {
    id: 2,
    name: '김철수',
    trade: '타일',
    role: '기공',
    content: '타일 시공 실력이 뛰어납니다. 줄눈 정밀도가 높고 마감이 깔끔합니다.',
    profileImage: null,
  },
  {
    id: 3,
    name: '박영희',
    trade: '도배',
    role: '반장',
    content: '성실하고 꼼꼼한 작업자입니다. 현장에서 항상 믿고 맡길 수 있습니다.',
    profileImage: null,
  },
]

const MOCK_SENT: Recommendation[] = [
  {
    id: 4,
    name: '이민호',
    trade: '미장',
    role: '기공',
    content: '미장 실력이 좋고 현장 분위기를 밝게 만드는 동료입니다.',
    profileImage: null,
  },
  {
    id: 5,
    name: '정수진',
    trade: '방수',
    role: '반장',
    content: '방수 작업에 대한 전문성이 뛰어납니다.',
    profileImage: null,
  },
]

const TAB_ITEMS = [
  { key: 'received', label: `받은 추천서(${MOCK_RECEIVED.length})` },
  { key: 'sent', label: `보낸 추천서(${MOCK_SENT.length})` },
]

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { name, trade, role, content, profileImage } = recommendation
  const subtitle = [trade, role].filter(Boolean).join(' · ')

  return (
    <div className="flex gap-3 px-4 py-4">
      {/* 프로필 이미지 */}
      {/* TODO: 실제 프로필 이미지 연동 시 DiceBear 폴백 제거 */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-bconnect-gray-100">
        <img
          src={profileImage || getAvatarUrl(name)}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 이름 + 분야/역할 + 추천 내용 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16 text-bconnect-gray-900">{name}</span>
          {subtitle && <span className="text-r-12 text-bconnect-gray-500">{subtitle}</span>}
        </div>
        <p className="text-r-14 text-bconnect-gray-700">{content}</p>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('received')

  const recommendations = activeTab === 'received' ? MOCK_RECEIVED : MOCK_SENT

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="추천서" showAction={false} onBack={() => router.back()} />

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {recommendations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-bconnect-gray-500">
            {activeTab === 'received' ? '받은 추천서가 없습니다' : '보낸 추천서가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-bconnect-gray-300">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  )
}
