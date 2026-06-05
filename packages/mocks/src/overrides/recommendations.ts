import {
  getGetReceivedRecommendationsMockHandler,
  getGetReceivedRecommendationsResponseMock,
  getGetSentRecommendationsMockHandler,
  getGetSentRecommendationsResponseMock,
  Trade,
} from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'

const NAMES = ['손장수', '김기술', '이성실']

const LONG_CONTENT =
  '깔끔하게 도배하는 동료입니다. 마감이 꼼꼼하고 약속한 일정을 항상 지킵니다. 현장에서 함께 일해보면 책임감이 남다른 분이라는 걸 바로 느낄 수 있습니다. 자신 있게 추천합니다.'

function withFixedContent(list: Recommendation[]): Recommendation[] {
  return list.map((rec, i) => ({
    ...rec,
    member: { ...rec.member, name: NAMES[i % NAMES.length] },
    profile: { ...rec.profile, primaryTrade: Trade.WALLPAPER },
    content: LONG_CONTENT,
  }))
}

export const recommendationsOverrides = [
  getGetReceivedRecommendationsMockHandler(() =>
    withFixedContent(getGetReceivedRecommendationsResponseMock())
  ),
  getGetSentRecommendationsMockHandler(() =>
    withFixedContent(getGetSentRecommendationsResponseMock())
  ),
]
