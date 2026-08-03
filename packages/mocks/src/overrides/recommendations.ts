import {
  getGetMyReceivedRecommendationsMockHandler,
  getGetMyReceivedRecommendationsResponseMock,
  getGetMySentRecommendationsMockHandler,
  getGetMySentRecommendationsResponseMock,
  getGetReceivedRecommendationsMockHandler,
  getGetReceivedRecommendationsResponseMock,
  getGetSentRecommendationsMockHandler,
  getGetSentRecommendationsResponseMock,
  ProfileRole,
  Trade,
} from '@bconnect/api-client'
import type { Recommendation } from '@bconnect/api-client'

const NAMES = ['손장수', '김기술', '이성실']

const ROLES = [ProfileRole.FOREMAN, ProfileRole.SKILLED, ProfileRole.SEMI_SKILLED]

const LONG_CONTENT =
  '깔끔하게 도배하는 동료입니다. 마감이 꼼꼼하고 약속한 일정을 항상 지킵니다. 현장에서 함께 일해보면 책임감이 남다른 분이라는 걸 바로 느낄 수 있습니다. 자신 있게 추천합니다.'

function withFixedContent(list: Recommendation[]): Recommendation[] {
  return list.map((rec, i) => ({
    ...rec,
    // spec 이 required 를 안 붙여 orval mock 이 id 를 랜덤 누락 → 케밥 드로어가 안 열림.
    // mock 에서 안정적 id 보장 (실 BE 는 항상 채워보냄).
    id: rec.id ?? 1000 + i,
    member: { ...rec.member, id: rec.member?.id ?? 100 + i, name: NAMES[i % NAMES.length] },
    profile: { ...rec.profile, primaryTrade: Trade.WALLPAPER, role: ROLES[i % ROLES.length] },
    content: LONG_CONTENT,
  }))
}

export const recommendationsOverrides = [
  getGetMyReceivedRecommendationsMockHandler(() =>
    withFixedContent(getGetMyReceivedRecommendationsResponseMock())
  ),
  getGetMySentRecommendationsMockHandler(() =>
    withFixedContent(getGetMySentRecommendationsResponseMock())
  ),
  getGetReceivedRecommendationsMockHandler(() =>
    withFixedContent(getGetReceivedRecommendationsResponseMock())
  ),
  getGetSentRecommendationsMockHandler(() =>
    withFixedContent(getGetSentRecommendationsResponseMock())
  ),
]
