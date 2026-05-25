// TODO: apps/career/src/lib/experience.ts 와 중복 — packages/config/experience 로 추출 필요
export type ExperienceLevel = 'newcomer' | '1-3' | '3-5' | '5-10' | '10+'

export interface ExperienceOption {
  id: ExperienceLevel
  label: string
}

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'newcomer', label: '신입' },
  { id: '1-3', label: '1~3년' },
  { id: '3-5', label: '3~5년' },
  { id: '5-10', label: '5~10년' },
  { id: '10+', label: '10년 이상' },
]

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  newcomer: '신입',
  '1-3': '1~3년',
  '3-5': '3~5년',
  '5-10': '5~10년',
  '10+': '10년 이상',
}

export const EXPERIENCE_RANGES: Record<ExperienceLevel, { min: number; max?: number }> = {
  newcomer: { min: 0, max: 0 },
  '1-3': { min: 1, max: 3 },
  '3-5': { min: 3, max: 5 },
  '5-10': { min: 5, max: 10 },
  '10+': { min: 10 },
}
