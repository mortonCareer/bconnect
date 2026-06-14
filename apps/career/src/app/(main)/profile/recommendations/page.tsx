/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7873
 */
'use client'

import { useRouter } from 'next/navigation'
import { useGetMyReceivedRecommendations, useGetMySentRecommendations } from '@bconnect/api-client'
import { TopBar } from '@bconnect/ui'
import { RecommendationList } from '@bconnect/features'
import { useRecommendationActions } from '../_adapters/useRecommendationActions'

export default function RecommendationsPage() {
  const router = useRouter()
  const { data: received } = useGetMyReceivedRecommendations()
  const { data: sent } = useGetMySentRecommendations()
  const { onHideRecommendation, onDeleteRecommendation } = useRecommendationActions()

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="추천서" showAction={false} onBack={() => router.back()} />
      <RecommendationList
        received={received}
        sent={sent}
        variant="full"
        onHide={onHideRecommendation}
        onDelete={onDeleteRecommendation}
      />
    </div>
  )
}
