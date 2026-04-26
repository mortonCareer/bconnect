import { http, HttpResponse } from 'msw'
import { ok, notFound } from '../lib/response'
import { profiles, TRADE_VALUES } from '../data/seed'

export const profilesHandlers = [
  // 직종(trade) 목록
  http.get('*/api/v1/profiles/trades', () =>
    ok(TRADE_VALUES.map((value) => ({ value, label: value })))
  ),

  // 내 프로필 조회
  http.get('*/api/v1/profiles/me', () => ok(profiles[0]!)),

  // 내 프로필 수정 (전체)
  http.put('*/api/v1/profiles/me', async ({ request }) => {
    const body = (await request.json()) as Partial<(typeof profiles)[number]>
    Object.assign(profiles[0]!, body, { modifiedAt: new Date().toISOString() })
    return new HttpResponse(null, { status: 204 })
  }),

  // 내 프로필 about 만 수정
  http.patch('*/api/v1/profiles/me/about', async ({ request }) => {
    const body = (await request.json()) as { about?: string }
    if (typeof body.about === 'string') {
      profiles[0]!.about = body.about
      profiles[0]!.modifiedAt = new Date().toISOString()
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // 프로필 목록 (검색용)
  http.get('*/api/v1/profiles', ({ request }) => {
    const url = new URL(request.url)
    const trade = url.searchParams.get('trade')
    const filtered = trade ? profiles.filter((p) => p.primaryTrade === trade) : profiles
    return ok(filtered)
  }),

  // 프로필 단건 조회
  http.get('*/api/v1/profiles/:profileId', ({ params }) => {
    const id = parseInt(params.profileId as string, 10)
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return notFound('프로필을 찾을 수 없습니다')
    return ok(profile)
  }),
]
