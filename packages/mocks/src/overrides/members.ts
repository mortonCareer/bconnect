import { http, HttpResponse } from 'msw'
import {
  getCheckUsernameMockHandler,
  getCreateMemberMockHandler,
  getUpdateMyMemberPictureMockHandler,
} from '@bconnect/api-client'
import type { RegisterMemberRequest, UpdatePictureRequest } from '@bconnect/api-client'
import { setMyMockPicture } from './profiles'

// dev 편의용 — 이 목록의 username 만 중복(taken), 그 외는 사용 가능. faker mock 의
// 랜덤 available 로 signup 이 무작위로 막히던 문제 해소 + taken 에러 흐름 시연.
const TAKEN_USERNAMES = new Set(['admin', 'test', 'taken'])
// register(POST /members) 실패 시나리오 — username 으로 트리거. 가입 경로 계약상
// 토큰 문제는 400(A006·A007), 중복은 409(M001·M002) 다. taken-later 는 check-username
// 은 통과했는데 가입 시점에 선점된 경우 — 앞 단계로 되돌리는 흐름 시연용.
const REGISTER_ERROR_BY_USERNAME = new Map([
  ['invalid-token', { code: 'A006', status: 400, message: '유효하지 않은 가입 토큰입니다.' }],
  ['expired-token', { code: 'A007', status: 400, message: '만료된 가입 토큰입니다.' }],
  ['taken-later', { code: 'M001', status: 409, message: '이미 사용 중인 사용자명입니다.' }],
])

export const membersOverrides = [
  getCheckUsernameMockHandler(({ request }) => {
    const username = new URL(request.url).searchParams.get('username')?.toLowerCase() ?? ''
    return { available: !TAKEN_USERNAMES.has(username) }
  }),
  http.post('*/api/v1/members', async ({ request }) => {
    const body = (await request.json()) as RegisterMemberRequest
    const registerError = REGISTER_ERROR_BY_USERNAME.get(body.username)
    if (!registerError) return

    return HttpResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: registerError.code,
          status: registerError.status,
          message: registerError.message,
          logLevel: 'INFO',
        },
      },
      { status: registerError.status }
    )
  }),
  // 신규 가입 완료 흐름(register → 토큰 발급 → 로그인)이 mock 에서도 성립하도록 accessToken 발급.
  // auth otp/verify(로그인) mock 이 토큰을 주는 것과 대칭. 실 BE 는 RegisterMemberResponse.accessToken 을 반환.
  getCreateMemberMockHandler(() => ({
    memberId: Math.floor(Math.random() * 1_000_000),
    accessToken: `mock_access_${Date.now()}`,
  })),
  // #966 프로필 이미지 변경 — pictureId 를 내 프로필 seed 에 반영해 재조회 시 이미지가 바뀐다.
  getUpdateMyMemberPictureMockHandler(async ({ request }) => {
    const body = (await request.json()) as UpdatePictureRequest
    if (body.pictureId != null) setMyMockPicture(body.pictureId)
    return { success: true }
  }),
]
