import { getCheckUsernameMockHandler, getCreateMemberMockHandler } from '@bconnect/api-client'

// dev 편의용 — 이 목록의 username 만 중복(taken), 그 외는 사용 가능. faker mock 의
// 랜덤 available 로 signup 이 무작위로 막히던 문제 해소 + taken 에러 흐름 시연.
const TAKEN_USERNAMES = new Set(['admin', 'test', 'taken'])

export const membersOverrides = [
  getCheckUsernameMockHandler(({ request }) => {
    const username = new URL(request.url).searchParams.get('username')?.toLowerCase() ?? ''
    return { available: !TAKEN_USERNAMES.has(username) }
  }),

  // 회원가입(register). faker mock 은 accessToken 을 [문자열, undefined] 중 랜덤 반환 →
  // 절반 확률로 accessToken 없이 응답 → FE 의 requireRegisterAccessToken 이 throw 하여
  // 가입이 무작위로 실패하던 문제 해소. 세션 토큰을 항상 채워 성공 흐름을 안정화.
  getCreateMemberMockHandler(() => ({
    memberId: Date.now(),
    accessToken: `mock_access_${Date.now()}`,
  })),
]
