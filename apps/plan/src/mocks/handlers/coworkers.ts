import { http, HttpResponse } from 'msw'
import { ok, notFound } from '../lib/response'
import { profiles, isoNow } from '../data/seed'

// 동료 (coworker) 시드 데이터 — 본인(profile 1) 의 동료 8명.
interface Coworker {
  id: number
  profileId: number
  coworkerId: number
  status: 'ACTIVE' | 'BLOCKED'
  memo: string | null
  createdAt: string
  modifiedAt: string
}

const coworkers: Coworker[] = profiles.slice(1, 9).map((p, i) => ({
  id: i + 1,
  profileId: 1,
  coworkerId: p.id,
  status: 'ACTIVE',
  memo: i % 2 === 0 ? `함께 일한 적 있음 (${p.headline})` : null,
  createdAt: isoNow,
  modifiedAt: isoNow,
}))

export const coworkersHandlers = [
  // 동료 목록
  http.get('*/api/v1/coworkers', () => ok(coworkers.filter((c) => c.status === 'ACTIVE'))),

  // 동료 단건 조회
  http.get('*/api/v1/coworkers/:coworkerId', ({ params }) => {
    const id = parseInt(params.coworkerId as string, 10)
    const c = coworkers.find((x) => x.id === id)
    if (!c) return notFound('동료를 찾을 수 없습니다')
    return ok(c)
  }),

  // 동료 삭제
  http.delete('*/api/v1/coworkers/:coworkerId', ({ params }) => {
    const id = parseInt(params.coworkerId as string, 10)
    const idx = coworkers.findIndex((x) => x.id === id)
    if (idx === -1) return notFound('동료를 찾을 수 없습니다')
    coworkers.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
