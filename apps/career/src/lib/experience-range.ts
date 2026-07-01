import { z } from 'zod'

export const EXPERIENCE_MIN = 0
export const EXPERIENCE_MAX = 10

export type ExperienceRange = [number, number]

export const FULL_EXPERIENCE_RANGE: ExperienceRange = [EXPERIENCE_MIN, EXPERIENCE_MAX]

export const EXPERIENCE_THUMB_LABELS = ['최소 경력', '최대 경력']

export const isFullExperienceRange = ([min, max]: ExperienceRange) =>
  min <= EXPERIENCE_MIN && max >= EXPERIENCE_MAX

export const formatExperienceRange = ([min, max]: ExperienceRange) => `${min}~${max}년`

export const formatExperienceYears = (years: number) => `${years}년`

/** 프로필 경력(단일 정수) 입력 스키마 — signup/profile 폼의 SSOT. 필터는 범위라 별도. */
export const experienceSchema = z
  .number({ error: '경력을 입력해주세요' })
  .int()
  .min(EXPERIENCE_MIN, `경력은 ${EXPERIENCE_MIN}~${EXPERIENCE_MAX}년 사이로 입력해주세요`)
  .max(EXPERIENCE_MAX, `경력은 ${EXPERIENCE_MIN}~${EXPERIENCE_MAX}년 사이로 입력해주세요`)
