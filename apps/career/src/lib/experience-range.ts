import { z } from 'zod'

export const EXPERIENCE_MIN = 0
export const EXPERIENCE_MAX = 10

export type ExperienceRange = [number, number]

export const DEFAULT_EXPERIENCE_RANGE: ExperienceRange = [1, 3]

export const FULL_EXPERIENCE_RANGE: ExperienceRange = [EXPERIENCE_MIN, EXPERIENCE_MAX]

export const EXPERIENCE_THUMB_LABELS = ['최소 경력', '최대 경력']

export const isFullExperienceRange = ([min, max]: ExperienceRange) =>
  min <= EXPERIENCE_MIN && max >= EXPERIENCE_MAX

export const formatExperienceRange = ([min, max]: ExperienceRange) => `${min}~${max}년`

export const experienceRangeSchema = z
  .tuple([
    z.number().int().min(EXPERIENCE_MIN).max(EXPERIENCE_MAX),
    z.number().int().min(EXPERIENCE_MIN).max(EXPERIENCE_MAX),
  ])
  .refine(([min, max]) => min <= max, { message: '경력 범위를 확인해주세요' })

export const formatExperienceYears = (years: number) => `${years}년`

const clampYears = (years: number) =>
  Math.min(Math.max(Math.round(years), EXPERIENCE_MIN), EXPERIENCE_MAX)

export const rangeToApiExperience = ([min, max]: ExperienceRange) => clampYears((min + max) / 2)

export const apiExperienceToRange = (years: number): ExperienceRange => {
  const value = clampYears(years)
  return [value, value]
}
