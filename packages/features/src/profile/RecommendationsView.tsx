'use client'

import type { Recommendation } from '@bconnect/api-client'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { RecommendationList } from './RecommendationList'

/** 앱이 resolve 해 내려주는 데이터. plan 어댑터가 useGetReceived/SentRecommendations(by-id) 로 채운다. */
export interface RecommendationsViewData {
  received?: Recommendation[]
  sent?: Recommendation[]
}

export interface RecommendationsViewProps {
  data: RecommendationsViewData
  closeHref: string
  onClose: () => void
  /** 부모(프로필) 패널로 복귀 */
  backHref: string
}

/** 타 기술자 추천서 열람 패널 — read-only (onHide/onDelete 미주입). owner 편집은 career 풀페이지. */
export function RecommendationsView({
  data,
  closeHref,
  onClose,
  backHref,
}: RecommendationsViewProps) {
  return (
    <PanelShell
      title="추천서"
      backHref={backHref}
      backLabel="프로필"
      closeLabel="추천서 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      <PanelScroll>
        <div className="px-4 py-4">
          <RecommendationList received={data.received} sent={data.sent} hideHeader />
        </div>
      </PanelScroll>
    </PanelShell>
  )
}
