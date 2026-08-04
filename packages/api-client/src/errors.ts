import { ApiError } from './client'

/**
 * BE 에러 코드 카탈로그 — 분기에 실제로 쓰는 것만 선언한다.
 *
 * BE 는 도메인별 enum(`MemberExceptionCode`, `AuthExceptionCode` …)으로 코드를 나눠 두고
 * 전체 목록은 `apps/api/docs/exception-list.md` 가 유지한다. 그 목록을 통째로 옮기지 않는 것은
 * BE 코드가 API 기준이기 때문이다 (ADR-0015) — 여기 있는 것은 FE 가 목적지를 갈라야 해서
 * 어쩔 수 없이 아는 최소 집합이다.
 *
 * 스펙에 에러 응답이 없어 자동 생성이 안 된다. BE 가 springdoc 에 에러를 노출하면 이 카탈로그는
 * 생성 타입으로 교체된다.
 */
export const ERROR_CODE = {
  MEMBER: {
    DUPLICATE_USERNAME: 'M001',
    DUPLICATE_PHONE: 'M002',
  },
} as const

type Values<T> = T extends string ? T : { [K in keyof T]: Values<T[K]> }[keyof T]

export type ErrorCode = Values<typeof ERROR_CODE>

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * 에러가 주어진 코드 중 하나인지 판별한다. 같은 복구 경로로 묶이는 코드는 함께 넘긴다.
 */
export function hasErrorCode(error: unknown, ...codes: ErrorCode[]): error is ApiError {
  return isApiError(error) && codes.includes(error.code as ErrorCode)
}

/**
 * `POST /members`(회원 가입) 실패가 가입 토큰 문제인지 판별한다.
 *
 * 코드 조회가 아니라 계약 추론이라 카탈로그에 넣지 않는다 — 가입 경로의 400 은
 * A006(유효하지 않은 가입 토큰)·A007(만료된 가입 토큰) 뿐이고 중복은 409 다.
 * 그래서 코드를 보지 않고 status 로 판별한다.
 *
 * 반드시 register(`POST /members`) 호출을 감싼 catch 안에서만 쓴다. 제출 전체를
 * 감싸는 catch 에서 쓰면 프로필·업체 생성의 400 까지 토큰 오류로 오인해 OTP 로 되돌린다.
 */
export function isRegisterMemberSignupSessionError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 400
}
