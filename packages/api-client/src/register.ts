import type { RegisterMemberResponse } from './generated/schemas'

/**
 * register(`POST /members`) 응답에서 세션 토큰을 꺼낸다.
 *
 * `accessToken` 은 세션 필수값인데 스펙이 optional 로 emit 해 매 호출부가 좁히기를 반복해야 한다.
 * 그 결함을 한 곳에 가둬 두고, BE 가 required 로 바꾸면 여기만 지우면 된다.
 */
export function requireRegisterAccessToken(result: RegisterMemberResponse) {
  if (!result.accessToken) {
    throw new Error('회원가입 세션 토큰이 응답에 없습니다.')
  }

  return result.accessToken
}
