import { ApiError } from './client'

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * `POST /members`(회원 가입) 실패가 가입 토큰 문제인지 판별한다.
 *
 * 가입 경로의 400 은 A006(유효하지 않은 가입 토큰)·A007(만료된 가입 토큰) 뿐이고
 * 사용자명·전화번호 중복(M001·M002)은 409 다 — `apps/api/docs/exception-list.md`.
 * 그래서 BE error code 를 FE 상수로 복제하지 않고 status 로 판별한다 (ADR-0015).
 *
 * 반드시 register(`POST /members`) 호출을 감싼 catch 안에서만 쓴다. 제출 전체를
 * 감싸는 catch 에서 쓰면 프로필·업체 생성의 400 까지 토큰 오류로 오인해 OTP 로 되돌린다.
 */
export function isRegisterMemberSignupSessionError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 400
}
