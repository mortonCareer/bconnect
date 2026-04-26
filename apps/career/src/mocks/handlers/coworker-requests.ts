import { http, HttpResponse } from 'msw'
import { ok, notFound, created } from '../lib/response'
import { profiles, isoNow } from '../data/seed'

// 동료 요청 (coworker_request) 시드 데이터.
type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DENIED'

interface CoworkerRequest {
  id: number
  fromProfileId: number
  toProfileId: number
  message: string
  status: RequestStatus
  createdAt: string
  modifiedAt: string
}

const requests: CoworkerRequest[] = [
  // 받은 요청 (to=1) 3건
  ...profiles.slice(5, 8).map((p, i) => ({
    id: i + 100,
    fromProfileId: p.id,
    toProfileId: 1,
    message: '함께 일했던 동료입니다. 동료 등록 부탁드립니다.',
    status: 'PENDING' as RequestStatus,
    createdAt: isoNow,
    modifiedAt: isoNow,
  })),
  // 보낸 요청 (from=1) 2건
  ...profiles.slice(8, 10).map((p, i) => ({
    id: i + 200,
    fromProfileId: 1,
    toProfileId: p.id,
    message: '같이 일하고 싶습니다.',
    status: 'PENDING' as RequestStatus,
    createdAt: isoNow,
    modifiedAt: isoNow,
  })),
]

export const coworkerRequestsHandlers = [
  // 받은 동료 요청 목록
  http.get('*/api/v1/coworker-requests/received', () =>
    ok(requests.filter((r) => r.toProfileId === 1 && r.status === 'PENDING'))
  ),

  // 보낸 동료 요청 목록
  http.get('*/api/v1/coworker-requests/sent', () =>
    ok(requests.filter((r) => r.fromProfileId === 1 && r.status === 'PENDING'))
  ),

  // 동료 요청 보내기
  http.post('*/api/v1/coworker-requests', async ({ request }) => {
    const body = (await request.json()) as { toProfileId?: number; message?: string }
    if (!body.toProfileId) return notFound('요청 대상을 찾을 수 없습니다')
    const newRequest: CoworkerRequest = {
      id: Math.max(...requests.map((r) => r.id), 0) + 1,
      fromProfileId: 1,
      toProfileId: body.toProfileId,
      message: body.message ?? '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }
    requests.push(newRequest)
    return created(newRequest)
  }),

  // 동료 요청 단건 조회
  http.get('*/api/v1/coworker-requests/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = requests.find((x) => x.id === id)
    if (!r) return notFound('요청을 찾을 수 없습니다')
    return ok(r)
  }),

  // 동료 요청 승인
  http.post('*/api/v1/coworker-requests/:id/accept', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = requests.find((x) => x.id === id)
    if (!r) return notFound('요청을 찾을 수 없습니다')
    r.status = 'ACCEPTED'
    r.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // 동료 요청 거절
  http.post('*/api/v1/coworker-requests/:id/deny', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const r = requests.find((x) => x.id === id)
    if (!r) return notFound('요청을 찾을 수 없습니다')
    r.status = 'DENIED'
    r.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // 동료 요청 삭제 (보낸 요청 취소)
  http.delete('*/api/v1/coworker-requests/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const idx = requests.findIndex((x) => x.id === id)
    if (idx === -1) return notFound('요청을 찾을 수 없습니다')
    requests.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
