/**
 * 사용자 ID(username) 검증 유틸리티
 * career signup/username, plan signup/member 가 공유 — 규칙/포맷의 SSOT.
 */
import { z } from 'zod'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/

/**
 * 입력 정제 — 허용 문자(영문/숫자/`_`/`.`)만 남기고 소문자화.
 * 입력 중 실시간 적용 (TextField transform).
 */
export function formatUsername(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase()
}

/** 길이 + charset 유효성 */
export function isValidUsername(value: string): boolean {
  return (
    value.length >= USERNAME_MIN_LENGTH &&
    value.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(value)
  )
}

/** username zod 필드 — 규칙 + 에러 메시지 SSOT. `z.object({ username: usernameField })` 로 합성. */
export const usernameField = z
  .string()
  .min(USERNAME_MIN_LENGTH, `최소 ${USERNAME_MIN_LENGTH}자 이상 입력해주세요.`)
  .max(USERNAME_MAX_LENGTH, `최대 ${USERNAME_MAX_LENGTH}자까지 입력 가능합니다.`)
  .regex(USERNAME_PATTERN, '숫자, 영어, 밑줄 및 마침표만 사용할 수 있습니다.')
  .transform((val) => val.toLowerCase())
