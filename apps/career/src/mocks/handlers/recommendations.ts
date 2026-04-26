import { http, HttpResponse } from 'msw'
import { ok, notFound, created } from '../lib/response'
import { profiles, isoNow } from '../data/seed'

// 추천서 (recommendation) 시드.
type Visibility = 'PUBLIC' | 'HIDDEN'

interface Recommendation {
  id: number
  fromProfileId: number
  toProfileId: number
  content: string
  visibility: Visibility
  createdAt: string
  modifiedAt: string
}

const recommendations: Recommendation[] = profiles.slice(1, 6).flatMap((p, i) => [
  // 본인이 받은 추천서 (to=1)
  {
    id: i * 10 + 1,
    fromProfileId: p.id,
    toProfileId: 1,
    content: `${p.headline} 동료입니다. 함께 일했을 때 매우 성실하고 꼼꼼한 작업을 보여주셨습니다.`,
    visibility: 'PUBLIC',
    createdAt: isoNow,
    modifiedAt: isoNow,
  },
  // 본인이 보낸 추천서 (from=1)
  {
    id: i * 10 + 2,
    fromProfileId: 1,
    toProfileId: p.id,
    content: `${p.about.split('.')[0]}. 추천합니다.`,
    visibility: i % 2 === 0 ? 'PUBLIC' : 'HIDDEN',
    createdAt: isoNow,
    modifiedAt: isoNow,
  },
])

export const recommendationsHandlers = [
  // 추천서 목록 (관리자용 — 우리 dev 에선 전체 반환)
  http.get('*/api/v1/recommendations', () => ok(recommendations)),

  // 받은 추천서 (특정 프로필 대상)
  http.get('*/api/v1/recommendations/received', ({ request }) => {
    const url = new URL(request.url)
    const profileId = parseInt(url.searchParams.get('profileId') ?? '0', 10) || 1
    return ok(
      recommendations.filter((r) => r.toProfileId === profileId && r.visibility === 'PUBLIC')
    )
  }),

  // 보낸 추천서 (특정 프로필 작성)
  http.get('*/api/v1/recommendations/sent', ({ request }) => {
    const url = new URL(request.url)
    const profileId = parseInt(url.searchParams.get('profileId') ?? '0', 10) || 1
    return ok(recommendations.filter((r) => r.fromProfileId === profileId))
  }),

  // 내가 받은 추천서 (visibility 무관)
  http.get('*/api/v1/recommendations/me/received', () =>
    ok(recommendations.filter((r) => r.toProfileId === 1))
  ),

  // 내가 보낸 추천서
  http.get('*/api/v1/recommendations/me/sent', () =>
    ok(recommendations.filter((r) => r.fromProfileId === 1))
  ),

  // 추천서 작성
  http.post('*/api/v1/recommendations', async ({ request }) => {
    const body = (await request.json()) as { toProfileId?: number; content?: string }
    if (!body.toProfileId) return notFound('대상 프로필을 찾을 수 없습니다')
    const newRec: Recommendation = {
      id: Math.max(...recommendations.map((r) => r.id), 0) + 1,
      fromProfileId: 1,
      toProfileId: body.toProfileId,
      content: body.content ?? '',
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }
    recommendations.push(newRec)
    return created(newRec)
  }),

  // 추천서 단건 조회
  http.get('*/api/v1/recommendations/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = recommendations.find((x) => x.id === id)
    if (!r) return notFound('추천서를 찾을 수 없습니다')
    return ok(r)
  }),

  // 추천서 숨김
  http.post('*/api/v1/recommendations/:id/hide', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = recommendations.find((x) => x.id === id)
    if (!r) return notFound('추천서를 찾을 수 없습니다')
    r.visibility = 'HIDDEN'
    r.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // 추천서 공개
  http.post('*/api/v1/recommendations/:id/show', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = recommendations.find((x) => x.id === id)
    if (!r) return notFound('추천서를 찾을 수 없습니다')
    r.visibility = 'PUBLIC'
    r.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
