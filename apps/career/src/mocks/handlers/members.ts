import { http } from 'msw'
import { ok, notFound, badRequest } from '../lib/response'
import { members, isoNow, ROLE_VALUES } from '../data/seed'

export const membersHandlers = [
  // 회원 역할 목록
  http.get('*/api/v1/members/roles', () =>
    ok(ROLE_VALUES.map((value) => ({ value, label: value })))
  ),

  // username 중복 확인
  http.get('*/api/v1/members/check-username', ({ request }) => {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    if (!username) return badRequest('username 이 필요합니다', 'C001')
    const taken = members.some((m) => m.username === username)
    return ok({ available: !taken })
  }),

  // 회원 목록
  http.get('*/api/v1/members', () => ok(members)),

  // 회원 가입
  http.post('*/api/v1/members', async ({ request }) => {
    const body = (await request.json()) as Partial<(typeof members)[number]>
    const newMember = {
      id: members.length + 1,
      username: body.username ?? `user${members.length + 1}`,
      name: body.name ?? '신규 회원',
      phone: body.phone ?? '',
      picture: body.picture ?? '',
      role: body.role ?? 'WORKER',
      createdAt: isoNow,
      modifiedAt: isoNow,
    }
    members.push(newMember)
    return ok(newMember)
  }),

  // 회원 단건 조회
  http.get('*/api/v1/members/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const member = members.find((m) => m.id === id)
    if (!member) return notFound('회원을 찾을 수 없습니다')
    return ok(member)
  }),

  // 회원 수정
  http.put('*/api/v1/members/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string, 10)
    const member = members.find((m) => m.id === id)
    if (!member) return notFound('회원을 찾을 수 없습니다')
    const body = (await request.json()) as Partial<typeof member>
    Object.assign(member, body, { modifiedAt: new Date().toISOString() })
    return ok(member)
  }),
]
