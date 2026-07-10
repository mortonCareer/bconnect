import { z } from 'zod'

export const EXPERIENCE_MIN = 0
/** 홈 필터 슬라이더 천장(10년) 전용 — 경력 도메인 상한 아님. 프로필 스키마엔 상한 없음(#684) */
export const EXPERIENCE_FILTER_MAX = 10

export type ExperienceRange = [number, number]

export const FULL_EXPERIENCE_RANGE: ExperienceRange = [EXPERIENCE_MIN, EXPERIENCE_FILTER_MAX]

export const EXPERIENCE_THUMB_LABELS = ['최소 경력', '최대 경력']

export const isFullExperienceRange = ([min, max]: ExperienceRange) =>
  min <= EXPERIENCE_MIN && max >= EXPERIENCE_FILTER_MAX

// 천장(EXPERIENCE_FILTER_MAX)은 슬라이더 전용 상한 — 경력 도메인엔 상한 없음(#684).
// 따라서 천장 값은 "정확히 10년"이 아니라 "10년 이상"을 의미하므로 그렇게 표기한다.
export const formatExperienceRange = ([min, max]: ExperienceRange) => {
  if (max >= EXPERIENCE_FILTER_MAX) return `${min}년 이상`
  if (min === max) return `${min}년`
  return `${min}~${max}년`
}

export const formatExperienceYears = (years: number) =>
  years >= EXPERIENCE_FILTER_MAX ? `${EXPERIENCE_FILTER_MAX}년 이상` : `${years}년`

/**
 * 프로필 경력(단일 정수) 입력 스키마 — signup/profile 폼의 SSOT. 필터는 범위라 별도.
 * 상한 없음 — BE `@PositiveOrZero`(하한만, 상한 없음)에 정합. 기존 max=10 은 슬라이더 잔재였음(#684).
 * 하한(.min(0))은 NumberField 가 [^0-9] strip 으로 음수를 원천 차단하므로 생략 — .int() 만 유지.
 */
export const experienceSchema = z.number({ error: '경력을 입력해주세요' }).int()
