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
 * 입력 중 실시간 포맷팅 지원
 */
export function formatPhoneNumber(value: string): string {
  return new AsYouType('KR').input(value)
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
