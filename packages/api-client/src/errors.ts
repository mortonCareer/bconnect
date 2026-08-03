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
 * 회원 가입 중복(409) 코드 — 복구 경로가 갈리는 둘만 둔다.
 *
 * 위 400 판별과 달리 status 로는 나눌 수 없다. 사용자명 중복은 앞 단계로 되돌려 고치면
 * 되지만, 전화번호 중복은 그 번호에 이미 회원이 있다는 뜻이라 가입이 아니라 로그인으로
 * 이어져야 한다 — 목적지가 다르므로 code 를 본다 (ADR-0015 의 "특수 분기 시 narrowing").
 */
const REGISTER_DUPLICATE_CODE = {
  USERNAME: 'M001',
  PHONE: 'M002',
} as const

/**
 * `POST /members`(회원 가입) 실패가 사용자명 중복(M001)인지 판별한다.
 *
 * 사용자명 입력칸은 가입 마지막 화면이 아니라 앞 단계에 있다. 호출부는 이 판별로 그
 * 단계로 되돌리고 BE message 를 함께 넘긴다.
 *
 * 사용 범위 제약은 {@link isRegisterMemberSignupSessionError} 와 같다 — register 호출을
 * 감싼 catch 전용.
 */
export function isRegisterMemberDuplicateUsernameError(error: unknown): error is ApiError {
  return isApiError(error) && error.code === REGISTER_DUPLICATE_CODE.USERNAME
}

/**
 * `POST /members`(회원 가입) 실패가 전화번호 중복(M002)인지 판별한다.
 *
 * 그 번호로는 새로 가입할 수 없고 기존 계정으로 로그인해야 한다. 호출부는 OTP 진입점으로
 * 되돌려 인증을 다시 태우고, 그 결과가 로그인으로 이어지게 한다.
 *
 * 사용 범위 제약은 {@link isRegisterMemberSignupSessionError} 와 같다.
 */
export function isRegisterMemberDuplicatePhoneError(error: unknown): error is ApiError {
  return isApiError(error) && error.code === REGISTER_DUPLICATE_CODE.PHONE
}
