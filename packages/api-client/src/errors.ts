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

/**
 * `POST /members`(회원 가입) 실패가 중복 입력 문제인지 판별한다.
 *
 * 가입 경로의 409 는 M001(사용자명 중복)·M002(전화번호 중복) 뿐이다 — 위와 같은 근거.
 * 사용자명은 가입 마지막 화면이 아니라 앞 단계에서만 고칠 수 있으므로, 호출부는 이
 * 판별로 그 단계로 되돌리고 BE message 를 함께 넘긴다.
 *
 * 사용 범위 제약은 {@link isRegisterMemberSignupSessionError} 와 같다 — register 호출을
 * 감싼 catch 전용.
 */
export function isRegisterMemberDuplicateError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 409
}
