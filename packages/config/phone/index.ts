/**
 * 전화번호 포맷팅 유틸리티
 * libphonenumber-js 기반 - 한국 전화번호 기본 지원
 */
import parsePhoneNumber, {
  isValidPhoneNumber as isValidLibPhone,
  AsYouType,
} from 'libphonenumber-js'

/**
 * 전화번호를 한국 형식으로 포맷팅 (010-1234-5678)
 * 입력 중 실시간 포맷팅 지원. 완성된 한국 휴대폰 E.164(브라우저 자동완성)는 국내 표기로 접는다.
 */
export function formatPhoneNumber(value: string): string {
  const parsed = value.startsWith('+') ? parsePhoneNumber(value) : undefined
  const isKoreanMobileE164 =
    parsed !== undefined &&
    parsed.country === 'KR' &&
    parsed.isValid() &&
    parsed.nationalNumber.length === 10 &&
    parsed.nationalNumber.startsWith('10')
  return new AsYouType('KR').input(isKoreanMobileE164 ? fromE164(value) : value)
}

/**
 * 전화번호를 E.164 형식으로 변환 (+821012345678)
 */
export function toE164(phoneNumber: string): string {
  const parsed = parsePhoneNumber(phoneNumber, 'KR')
  if (!parsed) throw new Error('Invalid phone number')
  return parsed.format('E.164')
}

/**
 * 전화번호가 유효한지 검증
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  return isValidLibPhone(phoneNumber, 'KR')
}

/**
 * E.164 형식을 한국 형식으로 변환 (+821012345678 → 010-1234-5678)
 */
export function fromE164(e164Phone: string): string {
  const parsed = parsePhoneNumber(e164Phone)
  if (!parsed) throw new Error('Invalid E.164 phone number')
  return parsed.formatNational()
}

/**
 * 전화번호를 국내 숫자만 형식으로 변환 (01012345678)
 * API 호출 시 사용 — 백엔드가 \d{10,11} 형식을 기대
 */
export function toNationalNumber(phoneNumber: string): string {
  const parsed = parsePhoneNumber(phoneNumber, 'KR')
  if (!parsed) throw new Error('Invalid phone number')
  return `0${parsed.nationalNumber}`
}
