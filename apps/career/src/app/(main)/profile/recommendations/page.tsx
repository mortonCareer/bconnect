/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7873
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTradeLabel,
  useGetMyReceivedRecommendations,
  useGetMySentRecommendations,
} from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'
import { Tab, TopBar } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { member, profile, content } = recommendation
  // TODO(#473): BE가 MaskedMember.role 미제공 — 추가되면 실제 role 연결
  const role = '반장(Mocked)'
  const subtitle = [getTradeLabel(profile.primaryTrade), role].join(' · ')

  return (
    <div className="flex gap-3 px-4 py-4">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <img
          src={member.picture || getAvatarUrl(member.name)}
          alt={member.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sb-16 text-gray-900">{member.name}</span>
          <span className="text-r-12 text-gray-500">{subtitle}</span>
        </div>
        <p className="text-r-14 text-gray-700">{content}</p>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('received')

  const { data: received, isLoading: isReceivedLoading } = useGetMyReceivedRecommendations()
  const { data: sent, isLoading: isSentLoading } = useGetMySentRecommendations()

  const tabItems = [
    { key: 'received', label: `받은 추천서(${received?.length ?? 0})` },
    { key: 'sent', label: `보낸 추천서(${sent?.length ?? 0})` },
  ]

  const isReceived = activeTab === 'received'
  const isLoading = isReceived ? isReceivedLoading : isSentLoading
  const recommendations = (isReceived ? received : sent) ?? []

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="추천서" showAction={false} onBack={() => router.back()} />

      <Tab items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">
            {isReceived ? '받은 추천서가 없습니다' : '보낸 추천서가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-300">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  )
}
