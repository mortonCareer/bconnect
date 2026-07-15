/**
 * 사업자등록번호 (Korean Business Registration Number) 유틸.
 * - 형식: `xxx-xx-xxxxx` (10 digits)
 * - 체크섬: NTS 공식 알고리즘 (Mod 10 + 가중치)
 *
 * 참조: 국세청 사업자등록번호 검증 알고리즘
 * https://www.nts.go.kr/
 */
import { z } from 'zod'

/** 사업자등록번호 포맷팅 (xxx-xx-xxxxx). 10자리 초과 입력은 잘림. */
export function formatRegistrationNumber(value: string): string {
  const digits = extractDigits(value).slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

/** 사업자등록번호에서 숫자만 추출 */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * 사업자등록번호 유효성 검증 (10자리 숫자 + NTS 체크섬).
 * 국세청 공식 알고리즘: 가중치 [1,3,7,1,3,7,1,3,5] + 9번째 자리 *5 의 십의 자리.
 */
export function isValidRegistrationNumber(value: string): boolean {
  const digits = extractDigits(value)
  if (!/^\d{10}$/.test(digits)) return false

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * weights[i]
  }
  sum += Math.floor((Number(digits[8]) * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10

  return checkDigit === Number(digits[9])
}

/** 자릿수(형식) 오류 문구. 10자리 숫자를 채우지 못한 경우. */
export const REGISTRATION_NUMBER_FORMAT_MESSAGE =
  '올바른 사업자등록번호 형식이 아닙니다. (10자리 숫자)'

/** 체크섬(유효성) 실패 문구. 10자리는 맞으나 NTS 검증에 실패한 경우. */
export const REGISTRATION_NUMBER_INVALID_MESSAGE =
  '유효하지 않은 사업자등록번호입니다. 번호를 다시 확인해 주세요.'

/**
 * 사업자등록번호 zod 스키마. 입력값을 정규화 (digit-only) 후 검증.
 * 자릿수 오류와 체크섬 실패를 각각 다른 메시지로 분리한다.
 * react-hook-form 등 폼 라이브러리에서 직접 사용 가능.
 *
 * @example
 *   const schema = z.object({ bizNumber: registrationNumberSchema })
 */
export const registrationNumberSchema = z
  .string()
  .transform(extractDigits)
  .refine((digits) => /^\d{10}$/.test(digits), {
    message: REGISTRATION_NUMBER_FORMAT_MESSAGE,
  })
  .refine(isValidRegistrationNumber, {
    message: REGISTRATION_NUMBER_INVALID_MESSAGE,
  })
