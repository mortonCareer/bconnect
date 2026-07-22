import {
  getCheckUsernameMockHandler,
  getCreateMemberMockHandler,
  getUpdateMyMemberPictureMockHandler,
} from '@bconnect/api-client'
import type { UpdatePictureRequest } from '@bconnect/api-client'
import { setMyMockPicture } from './profiles'

// dev 편의용 — 이 목록의 username 만 중복(taken), 그 외는 사용 가능. faker mock 의
// 랜덤 available 로 signup 이 무작위로 막히던 문제 해소 + taken 에러 흐름 시연.
const TAKEN_USERNAMES = new Set(['admin', 'test', 'taken'])

export const membersOverrides = [
  getCheckUsernameMockHandler(({ request }) => {
    const username = new URL(request.url).searchParams.get('username')?.toLowerCase() ?? ''
    return { available: !TAKEN_USERNAMES.has(username) }
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
