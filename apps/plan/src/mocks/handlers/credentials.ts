import { http, HttpResponse } from 'msw'
import { ok, notFound } from '../lib/response'
import { profiles, isoNow } from '../data/seed'

// 자격증/추천서 (credential) 시드 데이터 — profile 별로 1~2개씩 생성.
// status 는 PENDING/ACCEPTED/DENIED 순환.
type CredentialStatus = 'PENDING' | 'ACCEPTED' | 'DENIED'
const STATUSES: CredentialStatus[] = ['PENDING', 'ACCEPTED', 'DENIED']

interface Credential {
  id: number
  profileId: number
  type: string
  title: string
  issuer: string
  issuedAt: string
  status: CredentialStatus
  createdAt: string
  modifiedAt: string
}

const credentials: Credential[] = profiles.flatMap((p, i) => [
  {
    id: p.id * 10 + 1,
    profileId: p.id,
    type: 'LICENSE',
    title: '건축기사',
    issuer: '한국산업인력공단',
    issuedAt: '2022-05-15',
    status: STATUSES[i % 3]!,
    createdAt: isoNow,
    modifiedAt: isoNow,
  },
  {
    id: p.id * 10 + 2,
    profileId: p.id,
    type: 'EDUCATION',
    title: '안전관리자 교육',
    issuer: '한국건설기술교육원',
    issuedAt: '2023-03-10',
    status: STATUSES[(i + 1) % 3]!,
    createdAt: isoNow,
    modifiedAt: isoNow,
  },
])

export const credentialsHandlers = [
  // 자격증 종류 목록 (enum)
  http.get('*/api/v1/credentials/types', () =>
    ok([
      { value: 'LICENSE', label: '자격증' },
      { value: 'EDUCATION', label: '교육이수' },
      { value: 'AWARD', label: '수상' },
    ])
  ),

  // 내 자격증 목록 (profile_id=1 가정)
  http.get('*/api/v1/credentials', () => ok(credentials.filter((c) => c.profileId === 1))),

  // 자격증 단건 조회
  http.get('*/api/v1/credentials/:credentialId', ({ params }) => {
    const id = parseInt(params.credentialId as string, 10)
    const c = credentials.find((x) => x.id === id)
    if (!c) return notFound('자격증을 찾을 수 없습니다')
    return ok(c)
  }),

  // 자격증 승인
  http.post('*/api/v1/credentials/:credentialId/accept', ({ params }) => {
    const id = parseInt(params.credentialId as string, 10)
    const c = credentials.find((x) => x.id === id)
    if (!c) return notFound('자격증을 찾을 수 없습니다')
    c.status = 'ACCEPTED'
    c.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // 자격증 거절
  http.post('*/api/v1/credentials/:credentialId/deny', ({ params }) => {
    const id = parseInt(params.credentialId as string, 10)
    const c = credentials.find((x) => x.id === id)
    if (!c) return notFound('자격증을 찾을 수 없습니다')
    c.status = 'DENIED'
    c.modifiedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
