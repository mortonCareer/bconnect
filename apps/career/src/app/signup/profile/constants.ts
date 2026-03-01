import type { FieldOption, FieldCategory, ExperienceOption } from './types'

export const FIELD_OPTIONS: FieldOption[] = [
  { id: 'tile', emoji: '🪨', label: '타일' },
  { id: 'wallpaper', emoji: '🎨', label: '도배' },
  { id: 'flooring', emoji: '🪵', label: '마루/장판' },
  { id: 'carpentry', emoji: '🪚', label: '목공' },
  { id: 'demolition', emoji: '🔨', label: '철거' },
  { id: 'cleaning', emoji: '🧹', label: '청소' },
  { id: 'electrical', emoji: '⚡', label: '전기' },
  { id: 'plumbing', emoji: '🔧', label: '설비' },
]

export const FIELD_CATEGORIES: FieldCategory[] = [
  {
    category: '기반공정',
    fields: [
      { id: 'demolition', emoji: '🔨', label: '철거' },
      { id: 'electrical', emoji: '⚡', label: '전기' },
      { id: 'plumbing', emoji: '🔧', label: '설비' },
    ],
  },
  {
    category: '구조공정',
    fields: [{ id: 'carpentry', emoji: '🪚', label: '목공' }],
  },
  {
    category: '마감공정',
    fields: [
      { id: 'tile', emoji: '🪨', label: '타일' },
      { id: 'wallpaper', emoji: '🎨', label: '도배' },
      { id: 'flooring', emoji: '🪵', label: '마루/장판' },
    ],
  },
  {
    category: '현장지원',
    fields: [{ id: 'cleaning', emoji: '🧹', label: '청소' }],
  },
]

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'newcomer', label: '신입' },
  { id: '1-3', label: '1~3년' },
  { id: '3-5', label: '3~5년' },
  { id: '5-10', label: '5~10년' },
  { id: '10+', label: '10년 이상' },
]
