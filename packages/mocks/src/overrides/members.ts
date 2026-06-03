import { getCheckUsernameMockHandler } from '@bconnect/api-client'

// dev 편의용 — 이 목록의 username 만 중복(taken), 그 외는 사용 가능. faker mock 의
// 랜덤 available 로 signup 이 무작위로 막히던 문제 해소 + taken 에러 흐름 시연.
const TAKEN_USERNAMES = new Set(['admin', 'test', 'taken'])

export const membersOverrides = [
  getCheckUsernameMockHandler(({ request }) => {
    const username = new URL(request.url).searchParams.get('username')?.toLowerCase() ?? ''
    return { available: !TAKEN_USERNAMES.has(username) }
  }),
]
