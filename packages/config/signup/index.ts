/**
 * 회원가입 생년월일 SSOT (#1177).
 * career /signup/username, plan /signup/member 가 공유 — 형식·최소 연령 판정의 단일 진실.
 */
import { z } from 'zod'
import { ageInYears, isCalendarDate } from '../date'

/** BE MemberService 의 MIN_AGE 와 같은 값. 미만이면 가입 시 M004(UNDERAGE) 로 거절된다. */
export const MIN_SIGNUP_AGE = 15

/**
 * 생년월일 zod 필드 — 'YYYY-MM-DD'. 달력 대신 숫자 직접 입력이라 형식 검증이 필요하다.
 * 최소 연령은 BE 와 같은 만 나이 기준으로 화면에서 먼저 걸러, 마지막 단계까지 갔다 되돌아오는 일을 줄인다.
 */
export const birthField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 8자리를 입력해주세요.')
  .refine(isCalendarDate, '올바른 날짜가 아니에요.')
  .refine((v) => ageInYears(v) >= MIN_SIGNUP_AGE, `만 ${MIN_SIGNUP_AGE}세 미만은 가입할 수 없어요.`)
